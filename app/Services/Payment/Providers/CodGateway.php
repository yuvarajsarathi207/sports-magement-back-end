<?php

namespace App\Services\Payment\Providers;

use App\Models\Order;
use App\Services\Payment\Contracts\PaymentGatewayInterface;
use Illuminate\Support\Str;

class CodGateway implements PaymentGatewayInterface
{
    public function getName(): string
    {
        return 'cod';
    }

    public function initiate(Order $order, array $options = []): array
    {
        return [
            'status' => 'pending',
            'transaction_id' => 'cod_' . Str::lower(Str::random(12)),
            'gateway_response' => [
                'provider' => 'cod',
                'message' => 'Cash on delivery selected',
            ],
            'redirect_url' => null,
        ];
    }

    public function verify(Order $order, array $payload = []): array
    {
        // COD is marked paid on delivery by admin; initiate leaves it pending.
        return [
            'status' => $payload['status'] ?? 'pending',
            'transaction_id' => $payload['transaction_id'] ?? null,
            'gateway_response' => array_merge($payload, ['provider' => 'cod']),
        ];
    }

    public function refund(Order $order, array $options = []): array
    {
        return [
            'status' => 'refunded',
            'transaction_id' => $options['transaction_id'] ?? null,
            'gateway_response' => ['provider' => 'cod', 'refunded' => true],
        ];
    }
}
