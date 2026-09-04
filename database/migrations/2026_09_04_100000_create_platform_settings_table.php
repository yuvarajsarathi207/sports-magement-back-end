<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        $now = now();
        DB::table('platform_settings')->insert([
            [
                'key' => 'tournament_publish_mode',
                'value' => 'approval',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'organizer_publish_fee',
                'value' => '0',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'player_subscription_fee',
                'value' => '0',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_settings');
    }
};
