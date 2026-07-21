<?php

namespace App\Services\Payment\Contracts;

use App\Models\Order;

interface PaymentGatewayInterface
{
    public function getName(): string;

    /**
     * Initiate a payment for an order.
     *
     * @return array{status: string, transaction_id: ?string, gateway_response: array, redirect_url?: ?string}
     */
    public function initiate(Order $order, array $options = []): array;

    /**
     * Verify / confirm a payment callback or client confirmation.
     *
     * @return array{status: string, transaction_id: ?string, gateway_response: array}
     */
    public function verify(Order $order, array $payload = []): array;

    /**
     * Refund a payment.
     *
     * @return array{status: string, transaction_id: ?string, gateway_response: array}
     */
    public function refund(Order $order, array $options = []): array;
}
