<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class PlatformSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];

    public const PUBLISH_MODE_APPROVAL = 'approval';
    public const PUBLISH_MODE_PAYMENT = 'payment';

    public const KEY_PUBLISH_MODE = 'tournament_publish_mode';
    public const KEY_ORGANIZER_PUBLISH_FEE = 'organizer_publish_fee';
    public const KEY_PLAYER_SUBSCRIPTION_FEE = 'player_subscription_fee';

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $settings = static::allCached();

        return array_key_exists($key, $settings) ? $settings[$key] : $default;
    }

    public static function setValue(string $key, mixed $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
        );

        Cache::forget('platform_settings');
    }

    public static function allCached(): array
    {
        return Cache::remember('platform_settings', 60, function () {
            return static::query()->pluck('value', 'key')->all();
        });
    }

    public static function publishMode(): string
    {
        $mode = static::getValue(self::KEY_PUBLISH_MODE, self::PUBLISH_MODE_APPROVAL);

        return in_array($mode, [self::PUBLISH_MODE_APPROVAL, self::PUBLISH_MODE_PAYMENT], true)
            ? $mode
            : self::PUBLISH_MODE_APPROVAL;
    }

    public static function isPaymentPublishMode(): bool
    {
        return static::publishMode() === self::PUBLISH_MODE_PAYMENT;
    }

    public static function isApprovalPublishMode(): bool
    {
        return static::publishMode() === self::PUBLISH_MODE_APPROVAL;
    }

    public static function organizerPublishFee(): float
    {
        return (float) static::getValue(self::KEY_ORGANIZER_PUBLISH_FEE, 0);
    }

    public static function playerSubscriptionFee(): float
    {
        return (float) static::getValue(self::KEY_PLAYER_SUBSCRIPTION_FEE, 0);
    }

    public static function publicPayload(): array
    {
        return [
            'tournament_publish_mode' => static::publishMode(),
            'organizer_publish_fee' => static::organizerPublishFee(),
            'player_subscription_fee' => static::playerSubscriptionFee(),
        ];
    }
}
