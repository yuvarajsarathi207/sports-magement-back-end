<?php

namespace App\Http\Controllers\Turf;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Models\Turf\Booking;
use App\Models\Turf\Court;
use App\Models\Turf\Turf;
use App\Models\Turf\TurfAvailabilityException;
use App\Models\Turf\TurfAvailabilityRule;
use App\Models\Turf\TurfOwner;
use App\Models\Turf\TurfPriceRule;
use App\Services\Platform\AuditLogger;
use App\Services\Turf\BookingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OwnerTurfController extends Controller
{
    public function __construct(
        private AuditLogger $audit,
        private BookingService $bookings
    ) {
    }

    public function dashboard(Request $request)
    {
        $owner = $this->ownerOrFail($request);
        $turfIds = $owner->turfs()->pluck('id');

        $today = Carbon::today();
        $todayBookings = Booking::whereIn('turf_id', $turfIds)
            ->whereHas('items', fn ($q) => $q->whereDate('starts_at', $today))
            ->count();

        $confirmedUpcoming = Booking::whereIn('turf_id', $turfIds)
            ->where('status', Booking::STATUS_CONFIRMED)
            ->whereHas('items', fn ($q) => $q->where('starts_at', '>', now()))
            ->count();

        $revenue = (float) Booking::whereIn('turf_id', $turfIds)
            ->where('status', Booking::STATUS_CONFIRMED)
            ->sum('total');

        return response()->json([
            'turfs_count' => $turfIds->count(),
            'courts_count' => Court::whereIn('turf_id', $turfIds)->count(),
            'published_count' => $owner->turfs()->where('is_published', true)->count(),
            'todays_bookings_count' => $todayBookings,
            'confirmed_upcoming_count' => $confirmedUpcoming,
            'revenue' => $revenue,
        ]);
    }

    public function listTurfs(Request $request)
    {
        $owner = $this->ownerOrFail($request);

        return response()->json(
            $owner->turfs()->with('courts')->orderByDesc('id')->get()
        );
    }

    public function showTurf(Request $request, int $id)
    {
        $turf = $this->ownedTurf($request, $id);

        $turf->load([
            'courts.availabilityRules',
            'courts.exceptions',
            'courts.priceRules',
            'courts.sport',
        ]);

        return response()->json($turf);
    }

    public function storeTurf(Request $request)
    {
        $owner = $this->ownerOrCreate($request);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'address_line1' => 'required|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'district' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:16',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'slot_duration_minutes' => 'nullable|integer|min:15|max:240',
        ]);

        $turf = $owner->turfs()->create(array_merge($data, [
            'status' => Turf::STATUS_DRAFT,
            'is_published' => false,
            'slot_duration_minutes' => $data['slot_duration_minutes'] ?? 60,
        ]));

        $this->audit->log('turf.created', $request->user(), $turf, null, $turf->toArray(), $request);

        return response()->json($turf, 201);
    }

    public function updateTurf(Request $request, int $id)
    {
        $turf = $this->ownedTurf($request, $id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'address_line1' => 'sometimes|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'sometimes|string|max:100',
            'state' => 'sometimes|string|max:100',
            'district' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:16',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'slot_duration_minutes' => 'nullable|integer|min:15|max:240',
        ]);

        $before = $turf->toArray();
        $turf->update($data);
        $this->audit->log('turf.updated', $request->user(), $turf, $before, $turf->toArray(), $request);

        return response()->json($turf->fresh('courts'));
    }

    public function publishTurf(Request $request, int $id)
    {
        $turf = $this->ownedTurf($request, $id);
        if ($turf->courts()->where('is_active', true)->count() < 1) {
            return response()->json(['message' => 'Add at least one active court before publishing.'], 422);
        }

        $requireApproval = (string) PlatformSetting::getValue('turf_require_owner_approval', '1') === '1';

        if ($requireApproval) {
            $turf->update([
                'status' => Turf::STATUS_PENDING_APPROVAL,
                'is_published' => false,
            ]);
        } else {
            $turf->update([
                'status' => Turf::STATUS_PUBLISHED,
                'is_published' => true,
            ]);
        }

        return response()->json($turf->fresh('courts'));
    }

    public function storeCourt(Request $request, int $turfId)
    {
        $turf = $this->ownedTurf($request, $turfId);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sports_category_id' => 'nullable|integer|exists:sports_categories,id',
            'capacity' => 'nullable|integer|min:1',
            'base_price' => 'required|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'weekly_hours' => 'nullable|array',
            'weekly_hours.*.day_of_week' => 'required_with:weekly_hours|integer|min:0|max:6',
            'weekly_hours.*.open_time' => 'required_with:weekly_hours|date_format:H:i',
            'weekly_hours.*.close_time' => 'required_with:weekly_hours|date_format:H:i|after:weekly_hours.*.open_time',
            'weekly_hours.*.is_closed' => 'nullable|boolean',
        ]);

        $court = DB::transaction(function () use ($turf, $data) {
            $court = $turf->courts()->create([
                'name' => $data['name'],
                'sports_category_id' => $data['sports_category_id'] ?? null,
                'capacity' => $data['capacity'] ?? null,
                'base_price' => $data['base_price'],
                'is_active' => $data['is_active'] ?? true,
            ]);

            $hours = $data['weekly_hours'] ?? $this->defaultHours();
            foreach ($hours as $hour) {
                TurfAvailabilityRule::updateOrCreate(
                    ['court_id' => $court->id, 'day_of_week' => $hour['day_of_week']],
                    [
                        'open_time' => $hour['open_time'] ?? '06:00',
                        'close_time' => $hour['close_time'] ?? '22:00',
                        'is_closed' => $hour['is_closed'] ?? false,
                    ]
                );
            }

            return $court->load('availabilityRules');
        });

        return response()->json($court, 201);
    }

    public function updateCourt(Request $request, int $courtId)
    {
        $court = Court::with('turf')->findOrFail($courtId);
        $this->ownedTurf($request, $court->turf_id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sports_category_id' => 'nullable|integer|exists:sports_categories,id',
            'capacity' => 'nullable|integer|min:1',
            'base_price' => 'sometimes|numeric|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $court->update($data);

        return response()->json($court->fresh('availabilityRules'));
    }

    public function setWeeklyHours(Request $request, int $courtId)
    {
        $court = Court::findOrFail($courtId);
        $this->ownedTurf($request, $court->turf_id);

        $data = $request->validate([
            'weekly_hours' => 'required|array|min:1',
            'weekly_hours.*.day_of_week' => 'required|integer|min:0|max:6',
            'weekly_hours.*.open_time' => 'required_unless:weekly_hours.*.is_closed,true|nullable|date_format:H:i',
            'weekly_hours.*.close_time' => 'required_unless:weekly_hours.*.is_closed,true|nullable|date_format:H:i',
            'weekly_hours.*.is_closed' => 'nullable|boolean',
        ]);

        $rules = DB::transaction(function () use ($court, $data) {
            TurfAvailabilityRule::where('court_id', $court->id)->delete();

            foreach ($data['weekly_hours'] as $hour) {
                TurfAvailabilityRule::create([
                    'court_id' => $court->id,
                    'day_of_week' => $hour['day_of_week'],
                    'open_time' => $hour['open_time'] ?? '06:00',
                    'close_time' => $hour['close_time'] ?? '22:00',
                    'is_closed' => $hour['is_closed'] ?? false,
                ]);
            }

            return TurfAvailabilityRule::where('court_id', $court->id)
                ->orderBy('day_of_week')
                ->get();
        });

        return response()->json(['weekly_hours' => $rules]);
    }

    public function listExceptions(Request $request, int $courtId)
    {
        $court = Court::findOrFail($courtId);
        $this->ownedTurf($request, $court->turf_id);

        $exceptions = TurfAvailabilityException::where('court_id', $court->id)
            ->orderByDesc('exception_date')
            ->get();

        return response()->json($exceptions);
    }

    public function setException(Request $request, int $courtId)
    {
        $court = Court::findOrFail($courtId);
        $this->ownedTurf($request, $court->turf_id);

        $data = $request->validate([
            'exception_date' => 'required|date',
            'is_closed' => 'required|boolean',
            'open_time' => 'nullable|date_format:H:i',
            'close_time' => 'nullable|date_format:H:i',
            'reason' => 'nullable|string|max:255',
        ]);

        $exception = TurfAvailabilityException::updateOrCreate(
            ['court_id' => $court->id, 'exception_date' => $data['exception_date']],
            $data
        );

        return response()->json($exception);
    }

    public function deleteException(Request $request, int $id)
    {
        $exception = TurfAvailabilityException::with('court')->findOrFail($id);
        $this->ownedTurf($request, $exception->court->turf_id);
        $exception->delete();

        return response()->json(['message' => 'Exception deleted']);
    }

    public function listPriceRules(Request $request, int $courtId)
    {
        $court = Court::findOrFail($courtId);
        $this->ownedTurf($request, $court->turf_id);

        $rules = TurfPriceRule::where('court_id', $court->id)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return response()->json($rules);
    }

    public function setPriceRule(Request $request, int $courtId)
    {
        $court = Court::findOrFail($courtId);
        $this->ownedTurf($request, $court->turf_id);

        $data = $request->validate([
            'name' => 'required|string|max:100',
            'day_of_week' => 'nullable|integer|min:0|max:6',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'price' => 'required|numeric|min:0',
            'is_peak' => 'nullable|boolean',
            'is_weekend' => 'nullable|boolean',
        ]);

        $rule = TurfPriceRule::create(array_merge($data, ['court_id' => $court->id]));

        return response()->json($rule, 201);
    }

    public function updatePriceRule(Request $request, int $id)
    {
        $rule = TurfPriceRule::with('court')->findOrFail($id);
        $this->ownedTurf($request, $rule->court->turf_id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'day_of_week' => 'nullable|integer|min:0|max:6',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'price' => 'sometimes|numeric|min:0',
            'is_peak' => 'nullable|boolean',
            'is_weekend' => 'nullable|boolean',
        ]);

        $rule->update($data);

        return response()->json($rule->fresh());
    }

    public function deletePriceRule(Request $request, int $id)
    {
        $rule = TurfPriceRule::with('court')->findOrFail($id);
        $this->ownedTurf($request, $rule->court->turf_id);
        $rule->delete();

        return response()->json(['message' => 'Price rule deleted']);
    }

    public function listBookings(Request $request)
    {
        $owner = $this->ownerOrFail($request);
        $turfIds = $owner->turfs()->pluck('id');

        $query = Booking::with(['items.court', 'turf', 'user', 'paymentIntents'])
            ->whereIn('turf_id', $turfIds)
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('date')) {
            $date = Carbon::parse($request->string('date'))->toDateString();
            $query->whereHas('items', fn ($q) => $q->whereDate('starts_at', $date));
        }

        if ($request->filled('date_from')) {
            $from = Carbon::parse($request->string('date_from'))->startOfDay();
            $query->whereHas('items', fn ($q) => $q->where('starts_at', '>=', $from));
        }

        if ($request->filled('date_to')) {
            $to = Carbon::parse($request->string('date_to'))->endOfDay();
            $query->whereHas('items', fn ($q) => $q->where('starts_at', '<=', $to));
        }

        $bookings = $query->paginate(min((int) $request->get('per_page', 30), 100));

        return response()->json([
            'data' => $bookings->getCollection()->map(fn (Booking $b) => $this->bookings->payloadWithPayment($b)),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    public function cancelBooking(Request $request, int $id)
    {
        $booking = $this->ownedBooking($request, $id);
        $updated = $this->bookings->cancelBooking(
            $booking,
            $request->user(),
            $request->input('reason'),
            $request->boolean('refund', true)
        );
        $this->audit->log('turf.booking.cancelled', $request->user(), $updated, null, [
            'reason' => $request->input('reason'),
        ], $request);

        return response()->json($this->bookings->payloadWithPayment($updated->load('paymentIntents')));
    }

    public function confirmBooking(Request $request, int $id)
    {
        $booking = $this->ownedBooking($request, $id);
        $updated = $this->bookings->forceConfirmManual($booking, $request->user());
        $this->audit->log('turf.booking.force_confirmed', $request->user(), $updated, null, null, $request);

        return response()->json($this->bookings->payloadWithPayment($updated->load('paymentIntents')));
    }

    public function markNoShow(Request $request, int $id)
    {
        $booking = $this->ownedBooking($request, $id);
        $updated = $this->bookings->markNoShow($booking);
        $this->audit->log('turf.booking.no_show', $request->user(), $updated, null, null, $request);

        return response()->json($this->bookings->payload($updated));
    }

    public function markCompleted(Request $request, int $id)
    {
        $booking = $this->ownedBooking($request, $id);
        $updated = $this->bookings->markCompleted($booking);
        $this->audit->log('turf.booking.completed', $request->user(), $updated, null, null, $request);

        return response()->json($this->bookings->payload($updated));
    }

    protected function ownerOrFail(Request $request): TurfOwner
    {
        $user = $request->user();
        $owner = TurfOwner::where('user_id', $user->id)->first();

        if ($owner) {
            return $owner;
        }

        if ($user->isAdmin()) {
            abort(403, 'Admin must impersonate or create an owner profile to manage venues.');
        }

        abort(403, 'Turf owner profile required.');
    }

    protected function ownerOrCreate(Request $request): TurfOwner
    {
        $user = $request->user();
        $owner = TurfOwner::firstOrCreate(
            ['user_id' => $user->id],
            [
                'business_name' => $request->input('business_name', $user->name . ' Turfs'),
                'status' => 'active',
            ]
        );

        if ($user->role !== 'admin' && $user->role !== 'turf_owner') {
            // Keep primary shell role; grant turf_owner RBAC role
            $user->assignRoleByName('turf_owner');
        }

        return $owner;
    }

    protected function ownedTurf(Request $request, int $id): Turf
    {
        $owner = $this->ownerOrFail($request);
        $turf = Turf::where('id', $id)->where('turf_owner_id', $owner->id)->firstOrFail();

        return $turf;
    }

    protected function ownedBooking(Request $request, int $id): Booking
    {
        $owner = $this->ownerOrFail($request);
        $turfIds = $owner->turfs()->pluck('id');

        return Booking::with(['items.court', 'turf.owner', 'paymentIntents', 'user'])
            ->whereIn('turf_id', $turfIds)
            ->where('id', $id)
            ->firstOrFail();
    }

    protected function defaultHours(): array
    {
        $hours = [];
        for ($d = 0; $d <= 6; $d++) {
            $hours[] = [
                'day_of_week' => $d,
                'open_time' => '06:00',
                'close_time' => '22:00',
                'is_closed' => false,
            ];
        }

        return $hours;
    }
}
