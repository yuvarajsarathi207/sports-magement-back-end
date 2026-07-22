<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class AppSetting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $settings = Cache::remember('app_settings_map', 60, function () {
            return static::query()->pluck('value', 'key')->all();
        });

        return $settings[$key] ?? $default;
    }

    public static function setValue(string $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget('app_settings_map');
    }

    public static function publicSettings(): array
    {
        $mode = static::getValue('feature_mode', 'all');
        if (!in_array($mode, ['shop', 'tournaments', 'all'], true)) {
            $mode = 'all';
        }

        return [
            'feature_mode' => $mode,
            'app_name' => static::getValue('app_name', 'Keep Playing'),
            'logo_url' => url('/icons/logo-128.webp'),
            'logo_url_fallback' => url('/icons/logo-128.png'),
            'favicon_url' => url('/icons/logo-64.png'),
            'features' => [
                'shop' => in_array($mode, ['shop', 'all'], true),
                'tournaments' => in_array($mode, ['tournaments', 'all'], true),
                'module_switch' => $mode === 'all',
            ],
        ];
    }
}
