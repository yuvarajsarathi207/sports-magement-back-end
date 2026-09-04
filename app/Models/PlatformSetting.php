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
    public const KEY_PHONEPE_ENV = 'phonepe_env';

    public const PHONEPE_ENV_SANDBOX = 'sandbox';
    public const PHONEPE_ENV_PRODUCTION = 'production';

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

    public static function phonepeEnv(): string
    {
        $env = static::getValue(self::KEY_PHONEPE_ENV, config('services.phonepe.env', self::PHONEPE_ENV_SANDBOX));

        return in_array($env, [self::PHONEPE_ENV_SANDBOX, self::PHONEPE_ENV_PRODUCTION], true)
            ? $env
            : self::PHONEPE_ENV_SANDBOX;
    }

    public static function publicPayload(): array
    {
        return [
            'tournament_publish_mode' => static::publishMode(),
            'organizer_publish_fee' => static::organizerPublishFee(),
            'player_subscription_fee' => static::playerSubscriptionFee(),
            'phonepe_env' => static::phonepeEnv(),
        ];
    }

    public static function adminPayload(): array
    {
        $sandboxConfigured = filled(config('services.phonepe.sandbox.client_id'))
            && filled(config('services.phonepe.sandbox.client_secret'));
        $productionConfigured = filled(config('services.phonepe.production.client_id'))
            && filled(config('services.phonepe.production.client_secret'));

        return array_merge(static::publicPayload(), [
            'phonepe' => [
                'active_env' => static::phonepeEnv(),
                'sandbox_configured' => $sandboxConfigured,
                'production_configured' => $productionConfigured,
                'merchant_id' => config('services.phonepe.merchant_id'),
                'sandbox_client_id_hint' => static::maskSecret(config('services.phonepe.sandbox.client_id')),
                'production_client_id_hint' => static::maskSecret(config('services.phonepe.production.client_id')),
            ],
        ]);
    }

    protected static function maskSecret(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        $len = strlen($value);
        if ($len <= 8) {
            return str_repeat('*', $len);
        }

        return substr($value, 0, 4) . str_repeat('*', max(4, $len - 8)) . substr($value, -4);
    }
}
