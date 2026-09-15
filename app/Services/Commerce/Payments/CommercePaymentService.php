<?php

namespace App\Services\Commerce\Payments;

use App\Models\Commerce\CommercePayment;
use App\Models\Commerce\Order;
use App\Models\User;
use App\Services\Commerce\OrderService;
use App\Services\PhonePeService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class CommercePaymentService
{
    public function __construct(
        protected PhonePePaymentProvider $phonePeProvider,
        protected PhonePeService $phonePe
    ) {
    }

    public function initiate(Order $order, User $user, string $paymentMethod): array
    {
        if ($paymentMethod === Order::METHOD_COD) {
            $payment = CommercePayment::create([
                'order_id' => $order->id,
                'user_id' => $user->id,
                'provider' => CommercePayment::PROVIDER_COD,
                'status' => CommercePayment::STATUS_PENDING,
                'amount' => $order->total_amount,
                'currency' => 'INR',
                'merchant_order_id' => 'KP-COD-' . $order->order_number,
                'idempotency_key' => 'cod:' . $order->id,
            ]);

            Log::info('Commerce COD payment initiated', [
                'order_id' => $order->id,
                'payment_id' => $payment->id,
            ]);

            return [
                'requires_payment' => false,
                'payment_method' => 'cod',
                'payment' => $payment,
                'message' => 'Order confirmed. Pay cash on delivery.',
            ];
        }

        if ($paymentMethod !== Order::METHOD_PHONEPE) {
            throw new RuntimeException('Unsupported payment method.');
        }

        if (!$this->phonePe->isConfigured()) {
            throw new RuntimeException('Online payment is not configured.');
        }

        $merchantOrderId = 'KP-C-' . Str::upper(Str::random(16));
        $redirectUrl = rtrim(config('app.url'), '/') . '/app/payments/return?merchantOrderId=' . urlencode($merchantOrderId);

        $payment = CommercePayment::create([
            'order_id' => $order->id,
            'user_id' => $user->id,
            'provider' => CommercePayment::PROVIDER_PHONEPE,
            'status' => CommercePayment::STATUS_PENDING,
            'amount' => $order->total_amount,
            'currency' => 'INR',
            'merchant_order_id' => $merchantOrderId,
            'idempotency_key' => 'phonepe:' . $order->id,
            'provider_payload' => ['redirect_url' => $redirectUrl],
        ]);

        try {
            $checkout = $this->phonePeProvider->createPayment(
                $merchantOrderId,
                (float) $order->total_amount,
                $redirectUrl,
                [
                    'udf1' => (string) $order->id,
                    'udf2' => 'commerce_order',
                    'message' => 'Keep Playing shop order ' . $order->order_number,
                ]
            );
        } catch (\Throwable $e) {
            $payment->update(['status' => CommercePayment::STATUS_FAILED]);
            throw $e;
        }

        $payment->update([
            'transaction_id' => $checkout['orderId'] ?? null,
            'provider_response' => $checkout['raw'] ?? $checkout,
            'status' => CommercePayment::STATUS_PENDING,
        ]);

        Log::info('Commerce PhonePe payment initiated', [
            'order_id' => $order->id,
            'payment_id' => $payment->id,
            'merchant_order_id' => $merchantOrderId,
        ]);

        return [
            'requires_payment' => true,
            'payment_method' => 'phonepe',
            'payment' => $payment->fresh(),
            'redirect_url' => $checkout['redirectUrl'] ?? null,
            'merchant_order_id' => $merchantOrderId,
            'message' => 'Complete payment to confirm your order.',
        ];
    }

    public function syncByMerchantOrderId(string $merchantOrderId, OrderService $orderService): CommercePayment
    {
        $payment = CommercePayment::where('merchant_order_id', $merchantOrderId)->firstOrFail();

        if (in_array($payment->status, [
            CommercePayment::STATUS_SUCCESS,
            CommercePayment::STATUS_REFUNDED,
            CommercePayment::STATUS_PARTIALLY_REFUNDED,
        ], true)) {
            return $payment;
        }

        if ($payment->provider !== CommercePayment::PROVIDER_PHONEPE) {
            return $payment;
        }

        $status = $this->phonePeProvider->fetchStatus($merchantOrderId);
        $mapped = $this->phonePe->mapStateToPaymentStatus($status['state'] ?? 'UNKNOWN');

        $payment->provider_response = $status['raw'] ?? $status;
        $payment->transaction_id = $status['orderId'] ?? $payment->transaction_id;
        $payment->save();

        $order = $payment->order;

        if ($mapped === 'completed') {
            $orderService->markPaymentSuccess($order, $payment);
            return $payment->fresh();
        }

        if ($mapped === 'failed') {
            $orderService->markPaymentFailed($order, $payment);
            return $payment->fresh();
        }

        return $payment->fresh();
    }

    public function findByMerchantOrderId(string $merchantOrderId): ?CommercePayment
    {
        return CommercePayment::where('merchant_order_id', $merchantOrderId)->first();
    }
}
