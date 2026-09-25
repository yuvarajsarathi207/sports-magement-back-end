<?php

namespace App\Services\Platform;

use App\Models\Platform\PaymentIntent;
use App\Models\Platform\PaymentTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PaymentService
{
    /**
     * Create a platform payment intent for any payable (subscription, order, booking).
     * Existing tournament/commerce gateways remain the source of truth for charging;
     * this records a unified ledger row for reconciliation.
     */
    public function createIntent(
        Model $payable,
        User $user,
        string $module,
        float $amount,
        string $method = 'phonepe',
        ?string $idempotencyKey = null,
        array $meta = []
    ): PaymentIntent {
        if ($idempotencyKey) {
            $existing = PaymentIntent::where('idempotency_key', $idempotencyKey)->first();
            if ($existing) {
                return $existing;
            }
        }

        $intent = PaymentIntent::create([
            'user_id' => $user->id,
            'payable_type' => $payable->getMorphClass(),
            'payable_id' => $payable->getKey(),
            'module' => $module,
            'provider' => $method === 'cod' ? 'cod' : ($method === 'free' ? 'free' : 'phonepe'),
            'method' => $method,
            'amount' => $amount,
            'currency' => 'INR',
            'status' => PaymentIntent::STATUS_PENDING,
            'merchant_order_id' => 'PI_' . Str::upper(Str::random(16)),
            'idempotency_key' => $idempotencyKey,
            'meta' => $meta,
        ]);

        PaymentTransaction::create([
            'payment_intent_id' => $intent->id,
            'event_type' => 'created',
            'status' => PaymentIntent::STATUS_PENDING,
            'amount' => $amount,
            'payload' => $meta,
        ]);

        return $intent;
    }

    public function markPaid(PaymentIntent $intent, ?string $providerPaymentId = null, array $payload = []): PaymentIntent
    {
        $intent->update([
            'status' => PaymentIntent::STATUS_PAID,
            'provider_payment_id' => $providerPaymentId ?? $intent->provider_payment_id,
            'paid_at' => now(),
        ]);

        PaymentTransaction::create([
            'payment_intent_id' => $intent->id,
            'event_type' => 'paid',
            'status' => PaymentIntent::STATUS_PAID,
            'amount' => $intent->amount,
            'payload' => $payload,
        ]);

        return $intent->fresh();
    }

    public function markFailed(PaymentIntent $intent, array $payload = []): PaymentIntent
    {
        $intent->update(['status' => PaymentIntent::STATUS_FAILED]);

        PaymentTransaction::create([
            'payment_intent_id' => $intent->id,
            'event_type' => 'failed',
            'status' => PaymentIntent::STATUS_FAILED,
            'amount' => $intent->amount,
            'payload' => $payload,
        ]);

        return $intent->fresh();
    }
}
