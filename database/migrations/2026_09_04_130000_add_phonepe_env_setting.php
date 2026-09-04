<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $exists = DB::table('platform_settings')->where('key', 'phonepe_env')->exists();

        if (!$exists) {
            DB::table('platform_settings')->insert([
                'key' => 'phonepe_env',
                'value' => env('PHONEPE_ENV', 'sandbox'),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('platform_settings')->where('key', 'phonepe_env')->delete();
    }
};
