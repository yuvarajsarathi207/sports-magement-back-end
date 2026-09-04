<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Tournament;
use App\Models\TournamentInterest;
use Illuminate\Support\Facades\DB;

class PaymentCompletionService
{
    public function __construct(
        protected PhonePeService $phonePe
    ) {
    }

    public function syncFromGateway(Payment $payment): Payment
    {
        if ($payment->status === 'completed' || $payment->status === 'refunded') {
            return $payment->fresh();
        }

        if (!$payment->merchant_order_id) {
            return $payment;
        }

        $status = $this->phonePe->getOrderStatus($payment->merchant_order_id);
        $mapped = $this->phonePe->mapStateToPaymentStatus($status['state']);

        if ($mapped === 'completed') {
            return $this->markCompleted($payment, $status['orderId'] ?? $payment->transaction_id, $status['raw']);
        }

        if ($mapped === 'failed') {
            return $this->markFailed($payment, $status['raw']);
        }

        $payment->update([
            'payment_details' => json_encode($status['raw']),
        ]);

        return $payment->fresh();
    }

    public function markCompleted(Payment $payment, ?string $transactionId = null, mixed $details = null): Payment
    {
        return DB::transaction(function () use ($payment, $transactionId, $details) {
            $payment = Payment::where('id', $payment->id)->lockForUpdate()->firstOrFail();

            if ($payment->status === 'completed') {
                return $payment;
            }

            $payment->update([
                'status' => 'completed',
                'payment_method' => 'phonepe',
                'transaction_id' => $transactionId ?: $payment->transaction_id,
                'payment_details' => $details !== null ? json_encode($details) : $payment->payment_details,
            ]);

            if ($payment->type === 'player_subscription' && $payment->subscription_id) {
                $payment->subscription()->update(['status' => 'active']);

                TournamentInterest::where('tournament_id', $payment->tournament_id)
                    ->where('player_id', $payment->player_id)
                    ->delete();
            }

            if ($payment->type === 'organizer_publish' && $payment->tournament_id) {
                Tournament::where('id', $payment->tournament_id)->update([
                    'status' => 'published',
                    'publish_path' => 'payment',
                    'is_published' => true,
                    'rejection_reason' => null,
                    'approved_by' => null,
                    'approved_at' => now(),
                ]);
            }

            return $payment->fresh(['tournament', 'subscription']);
        });
    }

    public function markFailed(Payment $payment, mixed $details = null): Payment
    {
        return DB::transaction(function () use ($payment, $details) {
            $payment = Payment::where('id', $payment->id)->lockForUpdate()->firstOrFail();

            if ($payment->status === 'completed') {
                return $payment;
            }

            $payment->update([
                'status' => 'failed',
                'payment_method' => 'phonepe',
                'payment_details' => $details !== null ? json_encode($details) : $payment->payment_details,
            ]);

            if ($payment->type === 'organizer_publish' && $payment->tournament_id) {
                $tournament = Tournament::find($payment->tournament_id);
                if ($tournament && $tournament->status === 'pending_payment') {
                    $tournament->update([
                        'status' => 'draft',
                        'is_published' => false,
                    ]);
                }
            }

            return $payment->fresh();
        });
    }
}
