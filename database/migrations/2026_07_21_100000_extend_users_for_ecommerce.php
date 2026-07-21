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

        // Drop customer role if previously added; keep player/organizer/admin/super_admin
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text IN ('super_admin', 'admin', 'organizer', 'player'))");
        } else {
            // MySQL: migrate any legacy customer rows first
            DB::table('users')->where('role', 'customer')->update(['role' => 'player']);
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'organizer', 'player') NOT NULL DEFAULT 'player'");
        }

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'is_blocked')) {
                $table->boolean('is_blocked')->default(false)->after('role');
            }
            if (!Schema::hasColumn('users', 'blocked_at')) {
                $table->timestamp('blocked_at')->nullable()->after('is_blocked');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'blocked_at')) {
                $table->dropColumn('blocked_at');
            }
            if (Schema::hasColumn('users', 'is_blocked')) {
                $table->dropColumn('is_blocked');
            }
        });

        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text IN ('organizer', 'player', 'admin'))");
        } else {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('organizer', 'player', 'admin') NOT NULL DEFAULT 'player'");
        }
    }
};
