<?php

namespace App\Services\Commerce\Payments;

use App\Services\PhonePeService;

class PhonePePaymentProvider implements PaymentProviderInterface
{
    public function __construct(protected PhonePeService $phonePe)
    {
    }

    public function name(): string
    {
        return 'phonepe';
    }

    public function createPayment(string $merchantOrderId, float $amount, string $redirectUrl, array $meta = []): array
    {
        $amountInPaise = (int) round($amount * 100);

        return $this->phonePe->createPayment($merchantOrderId, $amountInPaise, $redirectUrl, $meta);
    }

    public function fetchStatus(string $merchantOrderId): array
    {
        return $this->phonePe->getOrderStatus($merchantOrderId);
    }
}
