<?php

namespace App\Services\Commerce\Payments;

interface PaymentProviderInterface
{
    public function name(): string;

    public function createPayment(string $merchantOrderId, float $amount, string $redirectUrl, array $meta = []): array;

    public function fetchStatus(string $merchantOrderId): array;
}
