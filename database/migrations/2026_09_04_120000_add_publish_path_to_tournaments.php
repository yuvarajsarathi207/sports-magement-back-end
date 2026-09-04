<?php

use App\Models\Payment;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tournaments', function (Blueprint $table) {
            $table->string('publish_path', 20)->nullable()->after('status');
        });

        // Existing approval-queue / admin-approved tournaments
        DB::table('tournaments')
            ->where('status', 'pending_approval')
            ->orWhereNotNull('approved_by')
            ->update(['publish_path' => 'approval']);

        // Pending payment queue
        DB::table('tournaments')
            ->where('status', 'pending_payment')
            ->update(['publish_path' => 'payment']);

        // Published via organizer publish payment (no admin approver)
        $paidTournamentIds = DB::table('payments')
            ->where('type', 'organizer_publish')
            ->where('status', 'completed')
            ->pluck('tournament_id')
            ->unique()
            ->filter()
            ->all();

        if (!empty($paidTournamentIds)) {
            DB::table('tournaments')
                ->whereIn('id', $paidTournamentIds)
                ->whereNull('approved_by')
                ->update(['publish_path' => 'payment']);
        }

        // Remaining published without approver or payment stay null (legacy/unknown)
    }

    public function down(): void
    {
        Schema::table('tournaments', function (Blueprint $table) {
            $table->dropColumn('publish_path');
        });
    }
};
