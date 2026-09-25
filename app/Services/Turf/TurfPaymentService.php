<?php

namespace App\Services\Turf;

use App\Models\Platform\PaymentIntent;
use App\Models\Platform\PlatformRefund;
use App\Models\PlatformSetting;
use App\Models\Turf\Booking;
use App\Models\User;
use App\Services\PhonePeService;
use App\Services\Platform\PaymentService;
use Illuminate\Support\Str;
use RuntimeException;

class TurfPaymentService
{
    public function __construct(
        private PaymentService $payments,
        private PhonePeService $phonePe
    ) {
    }

    public function startCheckout(Booking $booking, User $user, PaymentIntent $intent): array
    {
        $amount = (float) $booking->total;
        $method = PlatformSetting::paymentMethod();

        if ($amount <= 0 || $method === PlatformSetting::PAYMENT_METHOD_FREE) {
            $this->payments->markPaid($intent, null, ['reason' => 'free_or_zero']);

            return [
                'requires_payment' => false,
                'payment_method' => 'free',
                'status' => 'paid',
                'intent_uuid' => $intent->uuid,
                'merchant_order_id' => $intent->merchant_order_id,
                'amount' => $amount,
            ];
        }

        if ($method === PlatformSetting::PAYMENT_METHOD_MANUAL) {
            $intent->update([
                'method' => 'manual',
                'provider' => 'manual',
                'meta' => array_merge($intent->meta ?? [], [
                    'instructions' => PlatformSetting::paymentInstructions(),
                ]),
            ]);

            return [
                'requires_payment' => true,
                'payment_method' => 'manual',
                'status' => $intent->status,
                'intent_uuid' => $intent->uuid,
                'merchant_order_id' => $intent->merchant_order_id,
                'amount' => $amount,
                'payment_instructions' => PlatformSetting::paymentInstructions(),
                'message' => 'Pay offline and wait for confirmation, or ask venue/admin to confirm.',
            ];
        }

        if (!$this->phonePe->isConfigured()) {
            // Fallback so demo still works when PhonePe is not configured
            return [
                'requires_payment' => true,
                'payment_method' => 'manual',
                'status' => $intent->status,
                'intent_uuid' => $intent->uuid,
                'merchant_order_id' => $intent->merchant_order_id,
                'amount' => $amount,
                'payment_instructions' => PlatformSetting::paymentInstructions(),
                'message' => 'PhonePe is not configured. Use manual confirmation for now.',
            ];
        }

        $merchantOrderId = $intent->merchant_order_id ?: ('TF' . now()->format('YmdHis') . Str::upper(Str::random(8)));
        $intent->update([
            'merchant_order_id' => $merchantOrderId,
            'method' => 'phonepe',
            'provider' => 'phonepe',
            'status' => PaymentIntent::STATUS_PROCESSING,
        ]);

        $redirectUrl = rtrim(config('services.phonepe.redirect_url') ?: (config('app.url') . '/app/payments/return'), '/')
            . '?merchantOrderId=' . urlencode($merchantOrderId)
            . '&type=turf'
            . '&bookingId=' . urlencode((string) $booking->id);

        $amountInPaise = (int) round($amount * 100);

        try {
            $result = $this->phonePe->createPayment(
                $merchantOrderId,
                max(100, $amountInPaise),
                $redirectUrl,
                [
                    'udf1' => 'turf_booking',
                    'udf2' => (string) $booking->id,
                    'udf3' => (string) $user->id,
                    'message' => 'Turf booking #' . $booking->id,
                ]
            );
        } catch (\Throwable $e) {
            $this->payments->markFailed($intent, ['error' => $e->getMessage()]);
            throw $e;
        }

        if (empty($result['redirectUrl'])) {
            $this->payments->markFailed($intent, $result['raw'] ?? []);
            throw new RuntimeException('PhonePe did not return a redirect URL.');
        }

        $intent->update([
            'provider_payment_id' => $result['orderId'] ?? null,
            'meta' => array_merge($intent->meta ?? [], ['phonepe' => $result['raw'] ?? []]),
        ]);

        return [
            'requires_payment' => true,
            'payment_method' => 'phonepe',
            'status' => $intent->status,
            'intent_uuid' => $intent->uuid,
            'merchant_order_id' => $merchantOrderId,
            'amount' => $amount,
            'redirect_url' => $result['redirectUrl'],
        ];
    }

    public function syncFromGateway(PaymentIntent $intent): PaymentIntent
    {
        if (!$intent->merchant_order_id || in_array($intent->status, [PaymentIntent::STATUS_PAID, PaymentIntent::STATUS_REFUNDED], true)) {
            return $intent;
        }

        if ($intent->provider !== 'phonepe') {
            return $intent;
        }

        $status = $this->phonePe->getOrderStatus($intent->merchant_order_id);
        $mapped = $this->phonePe->mapStateToPaymentStatus($status['state'] ?? '');

        if ($mapped === 'completed') {
            return $this->payments->markPaid($intent, $status['orderId'] ?? null, $status['raw'] ?? []);
        }

        if ($mapped === 'failed') {
            return $this->payments->markFailed($intent, $status['raw'] ?? []);
        }

        return $intent;
    }

    public function recordRefund(PaymentIntent $intent, User $actor, float $amount, ?string $reason = null): PlatformRefund
    {
        $refund = PlatformRefund::create([
            'payment_intent_id' => $intent->id,
            'requested_by' => $actor->id,
            'amount' => $amount,
            'status' => 'processed',
            'reason' => $reason,
            'processed_at' => now(),
            'meta' => ['source' => 'turf_cancel'],
        ]);

        $intent->update([
            'status' => ((float) $amount >= (float) $intent->amount)
                ? PaymentIntent::STATUS_REFUNDED
                : PaymentIntent::STATUS_PARTIAL_REFUND,
        ]);

        return $refund;
    }
}
