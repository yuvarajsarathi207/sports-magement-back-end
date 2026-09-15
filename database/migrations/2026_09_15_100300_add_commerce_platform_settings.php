<?php

use App\Models\PlatformSetting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $defaults = [
            PlatformSetting::KEY_COMMERCE_ENABLED => '1',
            PlatformSetting::KEY_COMMERCE_COD_ENABLED => '1',
            PlatformSetting::KEY_COMMERCE_ONLINE_PAYMENT_ENABLED => '1',
            PlatformSetting::KEY_COMMERCE_COD_MIN_AMOUNT => '0',
            PlatformSetting::KEY_COMMERCE_COD_MAX_AMOUNT => '50000',
            PlatformSetting::KEY_COMMERCE_DELIVERY_CHARGE => '49',
            PlatformSetting::KEY_COMMERCE_FREE_DELIVERY_THRESHOLD => '999',
            PlatformSetting::KEY_COMMERCE_LOW_STOCK_THRESHOLD => '5',
            PlatformSetting::KEY_COMMERCE_RESERVATION_TTL_MINUTES => '15',
        ];

        foreach ($defaults as $key => $value) {
            PlatformSetting::query()->firstOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }

    public function down(): void
    {
        PlatformSetting::query()->whereIn('key', [
            PlatformSetting::KEY_COMMERCE_ENABLED,
            PlatformSetting::KEY_COMMERCE_COD_ENABLED,
            PlatformSetting::KEY_COMMERCE_ONLINE_PAYMENT_ENABLED,
            PlatformSetting::KEY_COMMERCE_COD_MIN_AMOUNT,
            PlatformSetting::KEY_COMMERCE_COD_MAX_AMOUNT,
            PlatformSetting::KEY_COMMERCE_DELIVERY_CHARGE,
            PlatformSetting::KEY_COMMERCE_FREE_DELIVERY_THRESHOLD,
            PlatformSetting::KEY_COMMERCE_LOW_STOCK_THRESHOLD,
            PlatformSetting::KEY_COMMERCE_RESERVATION_TTL_MINUTES,
        ])->delete();
    }
};
