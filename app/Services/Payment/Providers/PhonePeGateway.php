<?php

namespace App\Services\Payment\Providers;

use App\Models\Order;
use App\Services\Payment\Contracts\PaymentGatewayInterface;
use Illuminate\Support\Str;

class PhonePeGateway implements PaymentGatewayInterface
{
    public function getName(): string
    {
        return 'phonepe';
    }

    public function initiate(Order $order, array $options = []): array
    {
        $txn = 'ppe_' . Str::lower(Str::random(16));

        return [
            'status' => 'pending',
            'transaction_id' => $txn,
            'gateway_response' => [
                'provider' => 'phonepe',
                'merchant_transaction_id' => $txn,
                'amount' => (int) round($order->grand_total * 100),
                'stub' => true,
            ],
            'redirect_url' => null,
        ];
    }

    public function verify(Order $order, array $payload = []): array
    {
        return [
            'status' => 'paid',
            'transaction_id' => $payload['transaction_id'] ?? ('ppe_' . Str::lower(Str::random(12))),
            'gateway_response' => array_merge($payload, ['provider' => 'phonepe', 'verified' => true, 'stub' => true]),
        ];
    }

    public function refund(Order $order, array $options = []): array
    {
        return [
            'status' => 'refunded',
            'transaction_id' => $options['transaction_id'] ?? null,
            'gateway_response' => ['provider' => 'phonepe', 'refunded' => true, 'stub' => true],
        ];
    }
}
