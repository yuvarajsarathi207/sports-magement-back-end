<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $rows = [
            ['key' => 'turf_enabled', 'value' => '1', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'turf_booking_hold_minutes', 'value' => '10', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'turf_cancellation_hours', 'value' => '2', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'turf_require_owner_approval', 'value' => '1', 'created_at' => $now, 'updated_at' => $now],
        ];

        foreach ($rows as $row) {
            $exists = DB::table('platform_settings')->where('key', $row['key'])->exists();
            if (!$exists) {
                DB::table('platform_settings')->insert($row);
            }
        }
    }

    public function down(): void
    {
        DB::table('platform_settings')->whereIn('key', [
            'turf_enabled',
            'turf_booking_hold_minutes',
            'turf_cancellation_hours',
            'turf_require_owner_approval',
        ])->delete();
    }
};
