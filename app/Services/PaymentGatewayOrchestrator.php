<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\PlatformSetting;
use App\Models\Subscription;
use App\Models\Tournament;
use Illuminate\Support\Str;
use RuntimeException;

class PaymentGatewayOrchestrator
{
    public function __construct(
        protected PhonePeService $phonePe,
        protected PaymentCompletionService $completion
    ) {
    }

    public function startOrganizerPublishPayment(Tournament $tournament, int $organizerId): array
    {
        $fee = PlatformSetting::organizerPublishFee();
        $method = PlatformSetting::paymentMethod();

        if ($fee <= 0 || $method === PlatformSetting::PAYMENT_METHOD_FREE) {
            return $this->completeOrganizerPublishFree($tournament, $organizerId, $fee, $method === PlatformSetting::PAYMENT_METHOD_FREE ? 'free_mode' : 'zero_fee');
        }

        $tournament->update([
            'status' => 'pending_payment',
            'publish_path' => 'payment',
            'is_published' => false,
            'rejection_reason' => null,
            'approved_by' => null,
            'approved_at' => null,
        ]);

        if ($method === PlatformSetting::PAYMENT_METHOD_MANUAL) {
            $payment = Payment::create([
                'type' => Payment::TYPE_ORGANIZER_PUBLISH,
                'tournament_id' => $tournament->id,
                'organizer_id' => $organizerId,
                'amount' => $fee,
                'status' => 'pending',
                'payment_method' => 'manual',
                'transaction_id' => null,
                'merchant_order_id' => 'MANUAL-' . Str::upper(Str::random(10)),
                'payment_details' => json_encode(['instructions' => PlatformSetting::paymentInstructions()]),
            ]);

            return [
                'requires_payment' => true,
                'payment_method' => 'manual',
                'message' => 'Complete offline payment to publish this tournament. Admin can confirm once paid.',
                'payment_instructions' => PlatformSetting::paymentInstructions(),
                'tournament' => $tournament->fresh(),
                'payment' => $payment,
            ];
        }

        $checkout = $this->createPhonePeCheckout(
            type: Payment::TYPE_ORGANIZER_PUBLISH,
            amount: $fee,
            tournamentId: $tournament->id,
            organizerId: $organizerId,
            message: 'Tournament publish fee'
        );

        return [
            'requires_payment' => true,
            'payment_method' => 'phonepe',
            'message' => 'Complete payment to publish this tournament.',
            'tournament' => $tournament->fresh(),
            'payment' => $checkout['payment'],
            'redirect_url' => $checkout['redirect_url'],
            'merchant_order_id' => $checkout['merchant_order_id'],
        ];
    }

    public function startPlayerSubscriptionPayment(Subscription $subscription, int $playerId): array
    {
        $fee = PlatformSetting::playerSubscriptionFee();
        $method = PlatformSetting::paymentMethod();

        if ($fee <= 0 || $method === PlatformSetting::PAYMENT_METHOD_FREE) {
            $payment = Payment::create([
                'type' => Payment::TYPE_PLAYER_SUBSCRIPTION,
                'subscription_id' => $subscription->id,
                'tournament_id' => $subscription->tournament_id,
                'player_id' => $playerId,
                'amount' => $method === PlatformSetting::PAYMENT_METHOD_FREE ? $fee : 0,
                'status' => 'pending',
                'payment_method' => 'free',
                'transaction_id' => 'FREE-' . Str::upper(Str::random(12)),
                'merchant_order_id' => null,
                'payment_details' => json_encode([
                    'reason' => $method === PlatformSetting::PAYMENT_METHOD_FREE ? 'free_mode' : 'zero_fee',
                ]),
            ]);

            $payment = $this->completion->markCompleted($payment, $payment->transaction_id, [
                'reason' => $method === PlatformSetting::PAYMENT_METHOD_FREE ? 'free_mode' : 'zero_fee',
            ]);

            return [
                'requires_payment' => false,
                'payment_method' => 'free',
                'message' => 'Subscription activated.',
                'payment' => $payment,
            ];
        }

        if ($method === PlatformSetting::PAYMENT_METHOD_MANUAL) {
            $payment = Payment::create([
                'type' => Payment::TYPE_PLAYER_SUBSCRIPTION,
                'subscription_id' => $subscription->id,
                'tournament_id' => $subscription->tournament_id,
                'player_id' => $playerId,
                'amount' => $fee,
                'status' => 'pending',
                'payment_method' => 'manual',
                'transaction_id' => null,
                'merchant_order_id' => 'MANUAL-' . Str::upper(Str::random(10)),
                'payment_details' => json_encode(['instructions' => PlatformSetting::paymentInstructions()]),
            ]);

            return [
                'requires_payment' => true,
                'payment_method' => 'manual',
                'message' => 'Complete offline payment. Organizer will confirm once paid.',
                'payment_instructions' => PlatformSetting::paymentInstructions(),
                'payment' => $payment,
            ];
        }

        $checkout = $this->createPhonePeCheckout(
            type: Payment::TYPE_PLAYER_SUBSCRIPTION,
            amount: $fee,
            tournamentId: $subscription->tournament_id,
            playerId: $playerId,
            subscriptionId: $subscription->id,
            message: 'Tournament subscription fee'
        );

        return [
            'requires_payment' => true,
            'payment_method' => 'phonepe',
            'message' => 'Complete payment to activate your subscription.',
            'payment' => $checkout['payment'],
            'redirect_url' => $checkout['redirect_url'],
            'merchant_order_id' => $checkout['merchant_order_id'],
        ];
    }

    public function confirmManualSubscriptionPayment(Subscription $subscription, int $organizerId): array
    {
        $tournament = $subscription->tournament;
        if (!$tournament || (int) $tournament->organizer_id !== $organizerId) {
            throw new RuntimeException('Unauthorized.');
        }

        if ($subscription->status === 'active') {
            return [
                'message' => 'Subscription already active.',
                'subscription' => $subscription,
            ];
        }

        $payment = Payment::where('subscription_id', $subscription->id)
            ->where('status', 'pending')
            ->latest()
            ->first();

        if (!$payment) {
            $payment = Payment::create([
                'type' => Payment::TYPE_PLAYER_SUBSCRIPTION,
                'subscription_id' => $subscription->id,
                'tournament_id' => $subscription->tournament_id,
                'player_id' => $subscription->player_id,
                'amount' => PlatformSetting::playerSubscriptionFee(),
                'status' => 'pending',
                'payment_method' => 'manual',
                'transaction_id' => null,
                'merchant_order_id' => 'MANUAL-' . Str::upper(Str::random(10)),
                'payment_details' => json_encode(['confirmed_by_organizer' => true]),
            ]);
        }

        $txn = 'MANUAL-OK-' . Str::upper(Str::random(10));
        $payment = $this->completion->markCompleted($payment, $txn, [
            'confirmed_by_organizer' => $organizerId,
            'method' => 'manual',
        ]);

        return [
            'message' => 'Player marked as paid.',
            'subscription' => $subscription->fresh(),
            'payment' => $payment,
        ];
    }

    protected function completeOrganizerPublishFree(
        Tournament $tournament,
        int $organizerId,
        float $fee,
        string $reason
    ): array {
        $tournament->update([
            'status' => 'published',
            'publish_path' => 'payment',
            'is_published' => true,
            'rejection_reason' => null,
            'approved_by' => null,
            'approved_at' => now(),
        ]);

        $payment = Payment::create([
            'type' => Payment::TYPE_ORGANIZER_PUBLISH,
            'tournament_id' => $tournament->id,
            'organizer_id' => $organizerId,
            'amount' => $reason === 'free_mode' ? $fee : 0,
            'status' => 'completed',
            'payment_method' => 'free',
            'transaction_id' => 'FREE-' . Str::upper(Str::random(12)),
            'merchant_order_id' => null,
            'payment_details' => json_encode(['reason' => $reason]),
        ]);

        return [
            'requires_payment' => false,
            'payment_method' => 'free',
            'message' => 'Tournament published successfully.',
            'tournament' => $tournament->fresh(),
            'payment' => $payment,
        ];
    }

    protected function createPhonePeCheckout(
        string $type,
        float $amount,
        int $tournamentId,
        ?int $playerId = null,
        ?int $organizerId = null,
        ?int $subscriptionId = null,
        string $message = 'Keep Playing payment'
    ): array {
        if (!$this->phonePe->isConfigured()) {
            throw new RuntimeException('PhonePe is not configured. Contact admin.');
        }

        $merchantOrderId = 'KP' . now()->format('YmdHis') . Str::upper(Str::random(8));
        $redirectUrl = rtrim(config('services.phonepe.redirect_url') ?: (config('app.url') . '/app/payments/return'), '/')
            . '?merchantOrderId=' . urlencode($merchantOrderId);

        $payment = Payment::create([
            'type' => $type,
            'subscription_id' => $subscriptionId,
            'tournament_id' => $tournamentId,
            'player_id' => $playerId,
            'organizer_id' => $organizerId,
            'amount' => $amount,
            'status' => 'pending',
            'payment_method' => 'phonepe',
            'merchant_order_id' => $merchantOrderId,
            'payment_details' => null,
        ]);

        $amountInPaise = (int) round($amount * 100);

        try {
            $result = $this->phonePe->createPayment(
                $merchantOrderId,
                $amountInPaise,
                $redirectUrl,
                [
                    'udf1' => (string) $type,
                    'udf2' => (string) $tournamentId,
                    'udf3' => (string) ($playerId ?: $organizerId ?: ''),
                    'message' => $message,
                ]
            );
        } catch (\Throwable $e) {
            $payment->update(['status' => 'failed', 'payment_details' => json_encode(['error' => $e->getMessage()])]);
            throw $e;
        }

        if (empty($result['redirectUrl'])) {
            $payment->update(['status' => 'failed', 'payment_details' => json_encode($result['raw'] ?? [])]);
            throw new RuntimeException('PhonePe did not return a redirect URL.');
        }

        $payment->update([
            'transaction_id' => $result['orderId'] ?? null,
            'payment_details' => json_encode($result['raw'] ?? []),
        ]);

        return [
            'payment' => $payment->fresh(),
            'redirect_url' => $result['redirectUrl'],
            'merchant_order_id' => $merchantOrderId,
        ];
    }
}
