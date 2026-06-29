<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('organizer', 'player', 'admin') NOT NULL DEFAULT 'player'");

        DB::table('tournaments')
            ->whereIn('status', ['open', 'active', 'expired'])
            ->update(['status' => 'draft']);

        DB::statement("ALTER TABLE tournaments MODIFY COLUMN status ENUM('draft', 'pending_approval', 'published', 'rejected') NOT NULL DEFAULT 'draft'");

        Schema::table('tournaments', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable()->after('is_published');
            $table->foreignId('approved_by')->nullable()->after('rejection_reason')->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
        });
    }

    public function down(): void
    {
        Schema::table('tournaments', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['rejection_reason', 'approved_by', 'approved_at']);
        });

        DB::statement("ALTER TABLE tournaments MODIFY COLUMN status ENUM('draft', 'open', 'active', 'expired', 'published') NOT NULL DEFAULT 'draft'");
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('organizer', 'player') NOT NULL DEFAULT 'player'");
    }
};
