<?php

namespace App\Services\Commerce;

use App\Models\PlatformSetting;

class DeliveryService
{
    public function calculateCharge(float $subtotalAfterDiscounts): float
    {
        $threshold = PlatformSetting::commerceFreeDeliveryThreshold();
        if ($threshold > 0 && $subtotalAfterDiscounts >= $threshold) {
            return 0.0;
        }

        return PlatformSetting::commerceDeliveryCharge();
    }

    public function estimateDeliveryDays(): int
    {
        return 5;
    }
}
