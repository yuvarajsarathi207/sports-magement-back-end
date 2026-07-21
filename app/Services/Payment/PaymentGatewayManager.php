<?php

namespace App\Services\Payment;

use App\Services\Payment\Contracts\PaymentGatewayInterface;
use App\Services\Payment\Providers\CodGateway;
use App\Services\Payment\Providers\PhonePeGateway;
use App\Services\Payment\Providers\RazorpayGateway;
use InvalidArgumentException;

class PaymentGatewayManager
{
    public function driver(?string $method = null): PaymentGatewayInterface
    {
        $method = $method ?: config('shop.default_payment', 'razorpay');

        return match ($method) {
            'razorpay' => new RazorpayGateway(),
            'phonepe' => new PhonePeGateway(),
            'cod' => new CodGateway(),
            default => throw new InvalidArgumentException("Unsupported payment method: {$method}"),
        };
    }

    public function available(): array
    {
        return ['razorpay', 'phonepe', 'cod'];
    }
}
