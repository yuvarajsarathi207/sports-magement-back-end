<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE tournaments MODIFY COLUMN status ENUM('draft', 'pending_approval', 'pending_payment', 'published', 'rejected') NOT NULL DEFAULT 'draft'");
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check');
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['subscription_id']);
            $table->dropForeign(['player_id']);
        });

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE payments MODIFY subscription_id BIGINT UNSIGNED NULL');
            DB::statement('ALTER TABLE payments MODIFY player_id BIGINT UNSIGNED NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE payments ALTER COLUMN subscription_id DROP NOT NULL');
            DB::statement('ALTER TABLE payments ALTER COLUMN player_id DROP NOT NULL');
        } else {
            // SQLite: recreate not practical here; try raw alter where supported
            try {
                DB::statement('ALTER TABLE payments ALTER COLUMN subscription_id DROP NOT NULL');
                DB::statement('ALTER TABLE payments ALTER COLUMN player_id DROP NOT NULL');
            } catch (\Throwable $e) {
                // ignore for sqlite test envs that already allow nulls
            }
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('organizer_id')->nullable()->after('player_id')->constrained('users')->nullOnDelete();
            $table->string('type')->default('player_subscription')->after('id');
            $table->string('merchant_order_id')->nullable()->unique()->after('transaction_id');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->foreign('subscription_id')->references('id')->on('subscriptions')->nullOnDelete();
            $table->foreign('player_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['organizer_id']);
            $table->dropForeign(['subscription_id']);
            $table->dropForeign(['player_id']);
            $table->dropColumn(['organizer_id', 'type', 'merchant_order_id']);
        });

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE payments MODIFY subscription_id BIGINT UNSIGNED NOT NULL');
            DB::statement('ALTER TABLE payments MODIFY player_id BIGINT UNSIGNED NOT NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE payments ALTER COLUMN subscription_id SET NOT NULL');
            DB::statement('ALTER TABLE payments ALTER COLUMN player_id SET NOT NULL');
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->foreign('subscription_id')->references('id')->on('subscriptions')->onDelete('cascade');
            $table->foreign('player_id')->references('id')->on('users')->onDelete('cascade');
        });

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE tournaments MODIFY COLUMN status ENUM('draft', 'pending_approval', 'published', 'rejected') NOT NULL DEFAULT 'draft'");
        }
    }
};
