<?php

namespace App\Services\Payment\Providers;

use App\Models\Order;
use App\Services\Payment\Contracts\PaymentGatewayInterface;
use Illuminate\Support\Str;

class RazorpayGateway implements PaymentGatewayInterface
{
    public function getName(): string
    {
        return 'razorpay';
    }

    public function initiate(Order $order, array $options = []): array
    {
        // Stub: replace with Razorpay Orders API when keys are configured.
        $txn = 'rzp_' . Str::lower(Str::random(16));

        return [
            'status' => 'pending',
            'transaction_id' => $txn,
            'gateway_response' => [
                'provider' => 'razorpay',
                'order_id' => $order->order_number,
                'amount' => (int) round($order->grand_total * 100),
                'currency' => 'INR',
                'key' => config('services.razorpay.key', env('RAZORPAY_KEY', 'rzp_test_stub')),
                'stub' => true,
            ],
            'redirect_url' => null,
        ];
    }

    public function verify(Order $order, array $payload = []): array
    {
        return [
            'status' => 'paid',
            'transaction_id' => $payload['transaction_id'] ?? ('rzp_' . Str::lower(Str::random(12))),
            'gateway_response' => array_merge($payload, ['provider' => 'razorpay', 'verified' => true, 'stub' => true]),
        ];
    }

    public function refund(Order $order, array $options = []): array
    {
        return [
            'status' => 'refunded',
            'transaction_id' => $options['transaction_id'] ?? null,
            'gateway_response' => ['provider' => 'razorpay', 'refunded' => true, 'stub' => true],
        ];
    }
}
