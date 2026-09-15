<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $defaults = [
            'app_theme' => 'ocean',
            'payment_method' => 'phonepe',
            'platform_name' => 'Keep Playing',
            'support_email' => '',
            'support_phone' => '',
            'payment_instructions' => 'Pay via UPI or bank transfer and share the screenshot with the organizer.',
        ];

        foreach ($defaults as $key => $value) {
            $exists = DB::table('platform_settings')->where('key', $key)->exists();
            if (!$exists) {
                DB::table('platform_settings')->insert([
                    'key' => $key,
                    'value' => $value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('platform_settings')->whereIn('key', [
            'app_theme',
            'payment_method',
            'platform_name',
            'support_email',
            'support_phone',
            'payment_instructions',
        ])->delete();
    }
};
