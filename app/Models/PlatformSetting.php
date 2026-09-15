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

    public const PAYMENT_METHOD_PHONEPE = 'phonepe';
    public const PAYMENT_METHOD_MANUAL = 'manual';
    public const PAYMENT_METHOD_FREE = 'free';

    public const THEME_OCEAN = 'ocean';
    public const THEME_FOREST = 'forest';
    public const THEME_SUNSET = 'sunset';
    public const THEME_ROYAL = 'royal';
    public const THEME_MIDNIGHT = 'midnight';

    public const KEY_PUBLISH_MODE = 'tournament_publish_mode';
    public const KEY_ORGANIZER_PUBLISH_FEE = 'organizer_publish_fee';
    public const KEY_PLAYER_SUBSCRIPTION_FEE = 'player_subscription_fee';
    public const KEY_PHONEPE_ENV = 'phonepe_env';
    public const KEY_APP_THEME = 'app_theme';
    public const KEY_PAYMENT_METHOD = 'payment_method';
    public const KEY_PLATFORM_NAME = 'platform_name';
    public const KEY_SUPPORT_EMAIL = 'support_email';
    public const KEY_SUPPORT_PHONE = 'support_phone';
    public const KEY_PAYMENT_INSTRUCTIONS = 'payment_instructions';

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

    public static function appTheme(): string
    {
        $theme = static::getValue(self::KEY_APP_THEME, self::THEME_OCEAN);
        $allowed = [
            self::THEME_OCEAN,
            self::THEME_FOREST,
            self::THEME_SUNSET,
            self::THEME_ROYAL,
            self::THEME_MIDNIGHT,
        ];

        return in_array($theme, $allowed, true) ? $theme : self::THEME_OCEAN;
    }

    public static function paymentMethod(): string
    {
        $method = static::getValue(self::KEY_PAYMENT_METHOD, self::PAYMENT_METHOD_PHONEPE);
        $allowed = [
            self::PAYMENT_METHOD_PHONEPE,
            self::PAYMENT_METHOD_MANUAL,
            self::PAYMENT_METHOD_FREE,
        ];

        return in_array($method, $allowed, true) ? $method : self::PAYMENT_METHOD_PHONEPE;
    }

    public static function platformName(): string
    {
        $name = trim((string) static::getValue(self::KEY_PLATFORM_NAME, 'Keep Playing'));

        return $name !== '' ? $name : 'Keep Playing';
    }

    public static function supportEmail(): string
    {
        return trim((string) static::getValue(self::KEY_SUPPORT_EMAIL, ''));
    }

    public static function supportPhone(): string
    {
        return trim((string) static::getValue(self::KEY_SUPPORT_PHONE, ''));
    }

    public static function paymentInstructions(): string
    {
        $text = trim((string) static::getValue(
            self::KEY_PAYMENT_INSTRUCTIONS,
            'Pay via UPI or bank transfer and share the screenshot with the organizer.'
        ));

        return $text !== ''
            ? $text
            : 'Pay via UPI or bank transfer and share the screenshot with the organizer.';
    }

    public static function themeTokens(string $theme = null): array
    {
        $theme = $theme ?: static::appTheme();

        $presets = [
            self::THEME_OCEAN => [
                'primary' => '#2563eb',
                'primary_dark' => '#1d4ed8',
                'header_from' => '#1e3a5f',
                'header_to' => '#2563eb',
                'bg' => '#f0f4f8',
                'surface' => '#ffffff',
                'text' => '#0f172a',
                'sidebar' => '#0f172a',
                'mode' => 'light',
            ],
            self::THEME_FOREST => [
                'primary' => '#16a34a',
                'primary_dark' => '#15803d',
                'header_from' => '#14532d',
                'header_to' => '#16a34a',
                'bg' => '#f0fdf4',
                'surface' => '#ffffff',
                'text' => '#0f172a',
                'sidebar' => '#052e16',
                'mode' => 'light',
            ],
            self::THEME_SUNSET => [
                'primary' => '#ea580c',
                'primary_dark' => '#c2410c',
                'header_from' => '#7c2d12',
                'header_to' => '#ea580c',
                'bg' => '#fff7ed',
                'surface' => '#ffffff',
                'text' => '#0f172a',
                'sidebar' => '#431407',
                'mode' => 'light',
            ],
            self::THEME_ROYAL => [
                'primary' => '#7c3aed',
                'primary_dark' => '#6d28d9',
                'header_from' => '#4c1d95',
                'header_to' => '#7c3aed',
                'bg' => '#f5f3ff',
                'surface' => '#ffffff',
                'text' => '#0f172a',
                'sidebar' => '#2e1065',
                'mode' => 'light',
            ],
            self::THEME_MIDNIGHT => [
                'primary' => '#38bdf8',
                'primary_dark' => '#0ea5e9',
                'header_from' => '#020617',
                'header_to' => '#1e293b',
                'bg' => '#0f172a',
                'surface' => '#1e293b',
                'text' => '#f1f5f9',
                'sidebar' => '#020617',
                'mode' => 'dark',
            ],
        ];

        return $presets[$theme] ?? $presets[self::THEME_OCEAN];
    }

    public static function publicPayload(): array
    {
        return [
            'tournament_publish_mode' => static::publishMode(),
            'organizer_publish_fee' => static::organizerPublishFee(),
            'player_subscription_fee' => static::playerSubscriptionFee(),
            'phonepe_env' => static::phonepeEnv(),
            'app_theme' => static::appTheme(),
            'theme' => static::themeTokens(),
            'payment_method' => static::paymentMethod(),
            'platform_name' => static::platformName(),
            'support_email' => static::supportEmail(),
            'support_phone' => static::supportPhone(),
            'payment_instructions' => static::paymentInstructions(),
        ];
    }

    public static function adminPayload(): array
    {
        $sandboxConfigured = filled(config('services.phonepe.sandbox.client_id'))
            && filled(config('services.phonepe.sandbox.client_secret'));
        $productionConfigured = filled(config('services.phonepe.production.client_id'))
            && filled(config('services.phonepe.production.client_secret'));

        return array_merge(static::publicPayload(), [
            'available_themes' => [
                ['id' => self::THEME_OCEAN, 'label' => 'Ocean Blue', 'swatch' => '#2563eb'],
                ['id' => self::THEME_FOREST, 'label' => 'Forest Green', 'swatch' => '#16a34a'],
                ['id' => self::THEME_SUNSET, 'label' => 'Sunset Orange', 'swatch' => '#ea580c'],
                ['id' => self::THEME_ROYAL, 'label' => 'Royal Purple', 'swatch' => '#7c3aed'],
                ['id' => self::THEME_MIDNIGHT, 'label' => 'Midnight Dark', 'swatch' => '#38bdf8'],
            ],
            'available_payment_methods' => [
                ['id' => self::PAYMENT_METHOD_PHONEPE, 'label' => 'PhonePe gateway'],
                ['id' => self::PAYMENT_METHOD_MANUAL, 'label' => 'Manual / offline'],
                ['id' => self::PAYMENT_METHOD_FREE, 'label' => 'Free (auto-approve)'],
            ],
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
