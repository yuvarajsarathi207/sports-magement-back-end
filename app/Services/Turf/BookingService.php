<?php

namespace App\Services\Turf;

use App\Models\Platform\PaymentIntent;
use App\Models\PlatformSetting;
use App\Models\Turf\Booking;
use App\Models\Turf\BookingItem;
use App\Models\Turf\Court;
use App\Models\Turf\TurfAvailabilityException;
use App\Models\Turf\TurfAvailabilityRule;
use App\Models\Turf\TurfPriceRule;
use App\Models\User;
use App\Services\Platform\PaymentService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(
        private PaymentService $payments,
        private TurfPaymentService $turfPayments,
        private TurfNotificationService $notifier
    ) {
    }

    public function availability(Court $court, string $date): array
    {
        $day = Carbon::parse($date)->startOfDay();
        $duration = (int) ($court->turf->slot_duration_minutes ?: 60);
        [$open, $close] = $this->openCloseForDate($court, $day);

        if (!$open || !$close) {
            return ['date' => $day->toDateString(), 'slots' => []];
        }

        $booked = $this->activeItemsQuery($court->id, $open, $close)->get(['starts_at', 'ends_at']);

        $slots = [];
        $cursor = $open->copy();
        while ($cursor->copy()->addMinutes($duration)->lte($close)) {
            $slotStart = $cursor->copy();
            $slotEnd = $cursor->copy()->addMinutes($duration);
            $overlap = $booked->first(fn ($item) => $item->starts_at < $slotEnd && $item->ends_at > $slotStart);
            $price = $this->resolvePrice($court, $slotStart);
            $slots[] = [
                'starts_at' => $slotStart->toIso8601String(),
                'ends_at' => $slotEnd->toIso8601String(),
                'available' => !$overlap && $slotStart->isFuture(),
                'price' => $price,
            ];
            $cursor->addMinutes($duration);
        }

        return ['date' => $day->toDateString(), 'slots' => $slots];
    }

    public function createBooking(User $user, array $data): array
    {
        $idempotencyKey = $data['idempotency_key'] ?? null;
        if ($idempotencyKey) {
            $existing = Booking::where('idempotency_key', $idempotencyKey)->first();
            if ($existing) {
                return $this->payloadWithPayment($existing->load(['items.court', 'turf', 'paymentIntents']));
            }
        }

        $court = Court::with('turf.owner')->findOrFail($data['court_id']);
        if (!$court->is_active || !$court->turf->is_published || $court->turf->status === 'suspended') {
            throw ValidationException::withMessages(['court_id' => ['Court is not available for booking.']]);
        }

        $startsAt = Carbon::parse($data['starts_at']);
        $endsAt = Carbon::parse($data['ends_at'] ?? $startsAt->copy()->addMinutes($court->turf->slot_duration_minutes));

        if ($endsAt->lte($startsAt) || !$startsAt->isFuture()) {
            throw ValidationException::withMessages(['starts_at' => ['Choose a future valid time slot.']]);
        }

        $this->assertWithinAvailability($court, $startsAt, $endsAt);

        $holdMinutes = (int) PlatformSetting::getValue('turf_booking_hold_minutes', 10);
        $price = $this->resolvePrice($court, $startsAt);

        $booking = DB::transaction(function () use ($user, $court, $startsAt, $endsAt, $price, $holdMinutes, $idempotencyKey) {
            Court::where('id', $court->id)->lockForUpdate()->first();

            $conflict = $this->activeItemsQuery($court->id, $startsAt, $endsAt)->lockForUpdate()->exists();
            if ($conflict) {
                throw ValidationException::withMessages([
                    'starts_at' => ['This slot was just booked. Please choose another time.'],
                ]);
            }

            $booking = Booking::create([
                'user_id' => $user->id,
                'turf_id' => $court->turf_id,
                'status' => Booking::STATUS_HELD,
                'subtotal' => $price,
                'tax' => 0,
                'total' => $price,
                'idempotency_key' => $idempotencyKey,
                'hold_expires_at' => now()->addMinutes(max(1, $holdMinutes)),
            ]);

            BookingItem::create([
                'booking_id' => $booking->id,
                'court_id' => $court->id,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'unit_price' => $price,
                'line_total' => $price,
                'status' => Booking::STATUS_HELD,
            ]);

            return $booking->load(['items.court', 'turf.owner.user']);
        });

        $intent = $this->payments->createIntent(
            $booking,
            $user,
            'turf',
            (float) $booking->total,
            PlatformSetting::paymentMethod(),
            $idempotencyKey ? 'pay_' . $idempotencyKey : null,
            ['booking_uuid' => $booking->uuid]
        );

        $payment = $this->turfPayments->startCheckout($booking, $user, $intent);

        if (!$payment['requires_payment'] || ($payment['payment_method'] ?? '') === 'free') {
            $this->confirmBooking($booking);
        } else {
            $this->notifier->bookingCreated($booking);
        }

        return array_merge(
            $this->payload($booking->fresh(['items.court', 'turf'])),
            ['payment' => $payment]
        );
    }

    public function confirmBooking(Booking $booking): Booking
    {
        $booking->update([
            'status' => Booking::STATUS_CONFIRMED,
            'confirmed_at' => now(),
        ]);
        $booking->items()->update(['status' => Booking::STATUS_CONFIRMED]);
        $fresh = $booking->fresh(['items.court', 'turf.owner.user', 'user']);
        $this->notifier->bookingConfirmed($fresh);

        return $fresh;
    }

    public function syncAndConfirmPayment(Booking $booking): array
    {
        $intent = $booking->paymentIntents()->latest('id')->first();
        if (!$intent) {
            throw ValidationException::withMessages(['booking' => ['No payment found for this booking.']]);
        }

        if ($booking->status === Booking::STATUS_CONFIRMED) {
            return $this->payloadWithPayment($booking->load(['items.court', 'turf', 'paymentIntents']));
        }

        if ($booking->status !== Booking::STATUS_HELD || !$booking->isActiveHold()) {
            throw ValidationException::withMessages(['booking' => ['Booking hold expired or invalid.']]);
        }

        if ($intent->provider === 'phonepe') {
            $intent = $this->turfPayments->syncFromGateway($intent);
            if ($intent->status !== PaymentIntent::STATUS_PAID) {
                return array_merge($this->payload($booking->load(['items.court', 'turf'])), [
                    'payment' => [
                        'requires_payment' => true,
                        'payment_method' => 'phonepe',
                        'status' => $intent->status,
                        'intent_uuid' => $intent->uuid,
                        'merchant_order_id' => $intent->merchant_order_id,
                        'amount' => (float) $intent->amount,
                        'message' => 'Payment not completed yet.',
                    ],
                ]);
            }
        } elseif ($intent->provider === 'manual') {
            // Manual remains pending until staff confirms
            return array_merge($this->payload($booking->load(['items.court', 'turf'])), [
                'payment' => [
                    'requires_payment' => true,
                    'payment_method' => 'manual',
                    'status' => $intent->status,
                    'intent_uuid' => $intent->uuid,
                    'merchant_order_id' => $intent->merchant_order_id,
                    'amount' => (float) $intent->amount,
                    'payment_instructions' => PlatformSetting::paymentInstructions(),
                ],
            ]);
        }

        $this->confirmBooking($booking);

        return $this->payloadWithPayment($booking->fresh(['items.court', 'turf', 'paymentIntents']));
    }

    public function forceConfirmManual(Booking $booking, User $actor): Booking
    {
        $intent = $booking->paymentIntents()->latest('id')->first();
        if ($intent && $intent->status !== PaymentIntent::STATUS_PAID) {
            $this->payments->markPaid($intent, null, [
                'confirmed_by' => $actor->id,
                'method' => 'manual_staff',
            ]);
        }

        return $this->confirmBooking($booking);
    }

    public function cancelBooking(Booking $booking, User $actor, ?string $reason = null, bool $issueRefund = true): Booking
    {
        if (!in_array($booking->status, [Booking::STATUS_HELD, Booking::STATUS_CONFIRMED], true)) {
            throw ValidationException::withMessages(['booking' => ['Booking cannot be cancelled.']]);
        }

        $isStaff = $actor->isAdmin() || $this->managesBookingVenue($actor, $booking);
        $hours = (int) PlatformSetting::getValue('turf_cancellation_hours', 2);
        $firstStart = $booking->items()->min('starts_at');

        if (!$isStaff && $firstStart && Carbon::parse($firstStart)->subHours($hours)->isPast() && $booking->status === Booking::STATUS_CONFIRMED) {
            throw ValidationException::withMessages(['booking' => ["Cancellations must be at least {$hours} hours before start."]]);
        }

        $booking->update([
            'status' => Booking::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'cancel_reason' => $reason,
            'meta' => array_merge($booking->meta ?? [], [
                'cancelled_by' => $actor->id,
                'refund_requested' => $issueRefund,
            ]),
        ]);
        $booking->items()->update(['status' => Booking::STATUS_CANCELLED]);

        if ($issueRefund) {
            $intent = $booking->paymentIntents()->latest('id')->first();
            if ($intent && $intent->status === PaymentIntent::STATUS_PAID) {
                $this->turfPayments->recordRefund($intent, $actor, (float) $intent->amount, $reason ?: 'Booking cancelled');
            }
        }

        $fresh = $booking->fresh(['items.court', 'turf.owner.user', 'user']);
        $this->notifier->bookingCancelled($fresh);

        return $fresh;
    }

    public function markNoShow(Booking $booking): Booking
    {
        if ($booking->status !== Booking::STATUS_CONFIRMED) {
            throw ValidationException::withMessages(['booking' => ['Only confirmed bookings can be marked no-show.']]);
        }

        $booking->update([
            'status' => 'no_show',
            'meta' => array_merge($booking->meta ?? [], ['no_show_at' => now()->toIso8601String()]),
        ]);
        $booking->items()->update(['status' => 'no_show']);

        return $booking->fresh(['items.court', 'turf']);
    }

    public function markCompleted(Booking $booking): Booking
    {
        if (!in_array($booking->status, [Booking::STATUS_CONFIRMED, 'no_show'], true)) {
            throw ValidationException::withMessages(['booking' => ['Booking cannot be completed.']]);
        }

        $booking->update(['status' => Booking::STATUS_COMPLETED]);
        $booking->items()->update(['status' => Booking::STATUS_COMPLETED]);

        return $booking->fresh(['items.court', 'turf']);
    }

    public function completePastBookings(): int
    {
        $ids = Booking::where('status', Booking::STATUS_CONFIRMED)
            ->whereHas('items', fn ($q) => $q->where('ends_at', '<', now()))
            ->pluck('id');

        foreach ($ids as $id) {
            $this->markCompleted(Booking::find($id));
        }

        return $ids->count();
    }

    public function expireHolds(): int
    {
        $expired = Booking::where('status', Booking::STATUS_HELD)
            ->where('hold_expires_at', '<=', now())
            ->get();

        foreach ($expired as $booking) {
            $booking->update(['status' => Booking::STATUS_EXPIRED]);
            $booking->items()->update(['status' => Booking::STATUS_EXPIRED]);
        }

        return $expired->count();
    }

    public function payload(Booking $booking): array
    {
        $booking->loadMissing(['items.court', 'turf', 'user']);

        return [
            'id' => $booking->id,
            'uuid' => $booking->uuid,
            'status' => $booking->status,
            'total' => (float) $booking->total,
            'subtotal' => (float) $booking->subtotal,
            'hold_expires_at' => optional($booking->hold_expires_at)?->toIso8601String(),
            'confirmed_at' => optional($booking->confirmed_at)?->toIso8601String(),
            'cancelled_at' => optional($booking->cancelled_at)?->toIso8601String(),
            'cancel_reason' => $booking->cancel_reason,
            'user' => $booking->user ? [
                'id' => $booking->user->id,
                'name' => $booking->user->name,
                'email' => $booking->user->email,
                'mobile' => $booking->user->mobile,
            ] : null,
            'turf' => [
                'id' => $booking->turf->id,
                'name' => $booking->turf->name,
                'city' => $booking->turf->city,
                'address_line1' => $booking->turf->address_line1,
            ],
            'items' => $booking->items->map(fn (BookingItem $item) => [
                'court_id' => $item->court_id,
                'court_name' => $item->court?->name,
                'starts_at' => $item->starts_at->toIso8601String(),
                'ends_at' => $item->ends_at->toIso8601String(),
                'unit_price' => (float) $item->unit_price,
                'status' => $item->status,
            ])->all(),
        ];
    }

    public function payloadWithPayment(Booking $booking): array
    {
        $intent = $booking->paymentIntents()->latest('id')->first();
        if (!$intent && $booking->relationLoaded('paymentIntents')) {
            $intent = $booking->paymentIntents->sortByDesc('id')->first();
        }

        return array_merge($this->payload($booking), [
            'payment' => $intent ? [
                'intent_uuid' => $intent->uuid,
                'merchant_order_id' => $intent->merchant_order_id,
                'amount' => (float) $intent->amount,
                'status' => $intent->status,
                'payment_method' => $intent->method,
                'requires_payment' => $intent->status !== PaymentIntent::STATUS_PAID && $booking->status === Booking::STATUS_HELD,
            ] : null,
        ]);
    }

    public function managesBookingVenue(User $user, Booking $booking): bool
    {
        $booking->loadMissing('turf.owner');

        return $booking->turf?->owner?->user_id === $user->id;
    }

    protected function assertWithinAvailability(Court $court, Carbon $startsAt, Carbon $endsAt): void
    {
        [$open, $close] = $this->openCloseForDate($court, $startsAt->copy()->startOfDay());
        if (!$open || !$close || $startsAt->lt($open) || $endsAt->gt($close)) {
            throw ValidationException::withMessages([
                'starts_at' => ['Selected time is outside venue operating hours.'],
            ]);
        }

        $duration = (int) ($court->turf->slot_duration_minutes ?: 60);
        $minutes = $open->diffInMinutes($startsAt);
        if ($minutes % $duration !== 0) {
            throw ValidationException::withMessages([
                'starts_at' => ['Selected time does not align with slot duration.'],
            ]);
        }
    }

    protected function openCloseForDate(Court $court, Carbon $day): array
    {
        $exception = TurfAvailabilityException::where('court_id', $court->id)
            ->whereDate('exception_date', $day->toDateString())
            ->first();

        if ($exception && $exception->is_closed) {
            return [null, null];
        }

        if ($exception && $exception->open_time && $exception->close_time) {
            return [
                Carbon::parse($day->toDateString() . ' ' . $exception->open_time),
                Carbon::parse($day->toDateString() . ' ' . $exception->close_time),
            ];
        }

        $rule = TurfAvailabilityRule::where('court_id', $court->id)
            ->where('day_of_week', $day->dayOfWeek)
            ->first();

        if (!$rule || $rule->is_closed) {
            return [null, null];
        }

        return [
            Carbon::parse($day->toDateString() . ' ' . $rule->open_time),
            Carbon::parse($day->toDateString() . ' ' . $rule->close_time),
        ];
    }

    protected function activeItemsQuery(int $courtId, Carbon $from, Carbon $to)
    {
        return BookingItem::query()
            ->where('court_id', $courtId)
            ->whereIn('status', [Booking::STATUS_HELD, Booking::STATUS_CONFIRMED])
            ->where('starts_at', '<', $to)
            ->where('ends_at', '>', $from)
            ->whereHas('booking', function ($q) {
                $q->where(function ($inner) {
                    $inner->where('status', Booking::STATUS_CONFIRMED)
                        ->orWhere(function ($held) {
                            $held->where('status', Booking::STATUS_HELD)
                                ->where('hold_expires_at', '>', now());
                        });
                });
            });
    }

    protected function resolvePrice(Court $court, Carbon $startsAt): float
    {
        $rules = TurfPriceRule::where('court_id', $court->id)->get();
        $time = $startsAt->format('H:i:s');
        $dow = $startsAt->dayOfWeek;
        $isWeekend = in_array($dow, [0, 6], true);

        $match = $rules->first(function (TurfPriceRule $rule) use ($dow, $time, $isWeekend) {
            if ($rule->day_of_week !== null && (int) $rule->day_of_week !== $dow) {
                return false;
            }
            if ($rule->is_weekend && !$isWeekend) {
                return false;
            }
            if ($rule->start_time && $rule->end_time) {
                return $time >= $rule->start_time && $time < $rule->end_time;
            }

            return true;
        });

        return (float) ($match?->price ?? $court->base_price);
    }
}
