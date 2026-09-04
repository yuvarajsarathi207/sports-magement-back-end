<?php

namespace App\Http\Controllers;

use App\Mail\TournamentPendingApprovalMail;
use App\Models\Payment;
use App\Models\PlatformSetting;
use App\Models\SportsCategory;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function dashboard()
    {
        $user = Auth::user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $stats = [
            'pending_approval' => Tournament::where('status', 'pending_approval')->count(),
            'pending_payment' => Tournament::where('status', 'pending_payment')->count(),
            'published' => Tournament::publishedForPlayers()->count(),
            'draft' => Tournament::where('status', 'draft')->count(),
            'rejected' => Tournament::where('status', 'rejected')->count(),
            'total' => Tournament::count(),
            'publish_mode' => PlatformSetting::publishMode(),
        ];

        $paymentStats = [
            'total' => Payment::count(),
            'completed' => Payment::where('status', 'completed')->count(),
            'pending' => Payment::where('status', 'pending')->count(),
            'failed' => Payment::where('status', 'failed')->count(),
            'revenue_total' => (float) Payment::where('status', 'completed')->sum('amount'),
            'revenue_publish' => (float) Payment::where('status', 'completed')
                ->where('type', Payment::TYPE_ORGANIZER_PUBLISH)
                ->sum('amount'),
            'revenue_subscription' => (float) Payment::where('status', 'completed')
                ->where('type', Payment::TYPE_PLAYER_SUBSCRIPTION)
                ->sum('amount'),
            'publish_payments' => Payment::where('type', Payment::TYPE_ORGANIZER_PUBLISH)->count(),
            'subscription_payments' => Payment::where('type', Payment::TYPE_PLAYER_SUBSCRIPTION)->count(),
        ];

        $categoryStats = SportsCategory::withCount([
            'tournaments as published_count' => fn ($q) => $q->publishedForPlayers(),
            'tournaments as pending_count' => fn ($q) => $q->where('status', 'pending_approval'),
        ])->get();

        $pendingApprovalTournaments = Tournament::where('status', 'pending_approval')
            ->with(['sportsCategory', 'organizer'])
            ->latest()
            ->limit(10)
            ->get();

        $pendingPaymentTournaments = Tournament::where('status', 'pending_payment')
            ->with(['sportsCategory', 'organizer'])
            ->latest()
            ->limit(10)
            ->get();

        $recentPayments = Payment::with(['tournament', 'player', 'organizer'])
            ->latest()
            ->limit(10)
            ->get();

        return response()->json([
            'stats' => $stats,
            'payment_stats' => $paymentStats,
            'category_stats' => $categoryStats,
            'pending_tournaments' => PlatformSetting::isPaymentPublishMode()
                ? $pendingPaymentTournaments
                : $pendingApprovalTournaments,
            'pending_approval_tournaments' => $pendingApprovalTournaments,
            'pending_payment_tournaments' => $pendingPaymentTournaments,
            'recent_payments' => $recentPayments,
            'settings' => PlatformSetting::publicPayload(),
        ]);
    }

    public function listTournaments(Request $request)
    {
        $user = Auth::user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Tournament::with(['sportsCategory', 'organizer'])
            ->withCount('interests')
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category_id')) {
            $query->where('sports_category_id', $request->category_id);
        }

        return response()->json($query->get());
    }

    public function viewTournament($id)
    {
        $user = Auth::user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tournament = Tournament::with(['sportsCategory', 'organizer', 'approver', 'interests.player'])
            ->findOrFail($id);

        return response()->json([
            'tournament' => $tournament,
            'interested_players_count' => $tournament->interests->count(),
        ]);
    }

    public function getSettings()
    {
        $user = Auth::user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(PlatformSetting::publicPayload());
    }

    public function updateSettings(Request $request)
    {
        $user = Auth::user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'tournament_publish_mode' => 'required|in:approval,payment',
            'organizer_publish_fee' => 'required|numeric|min:0',
            'player_subscription_fee' => 'required|numeric|min:0',
        ]);

        PlatformSetting::setValue(PlatformSetting::KEY_PUBLISH_MODE, $validated['tournament_publish_mode']);
        PlatformSetting::setValue(PlatformSetting::KEY_ORGANIZER_PUBLISH_FEE, number_format((float) $validated['organizer_publish_fee'], 2, '.', ''));
        PlatformSetting::setValue(PlatformSetting::KEY_PLAYER_SUBSCRIPTION_FEE, number_format((float) $validated['player_subscription_fee'], 2, '.', ''));

        return response()->json([
            'message' => 'Settings updated successfully.',
            'settings' => PlatformSetting::publicPayload(),
        ]);
    }

    public function approveTournament($id)
    {
        $user = Auth::user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tournament = Tournament::findOrFail($id);

        if ($tournament->status !== 'pending_approval') {
            return response()->json(['message' => 'Only pending tournaments can be approved'], 400);
        }

        $tournament->update([
            'status' => 'published',
            'publish_path' => 'approval',
            'is_published' => true,
            'rejection_reason' => null,
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return response()->json($tournament->load(['sportsCategory', 'organizer', 'approver']));
    }

    public function rejectTournament(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'rejection_reason' => 'nullable|string|max:1000',
        ]);

        $tournament = Tournament::findOrFail($id);

        if ($tournament->status !== 'pending_approval') {
            return response()->json(['message' => 'Only pending tournaments can be rejected'], 400);
        }

        $tournament->update([
            'status' => 'rejected',
            'publish_path' => 'approval',
            'is_published' => false,
            'rejection_reason' => $request->rejection_reason,
            'approved_by' => null,
            'approved_at' => null,
        ]);

        return response()->json($tournament->load(['sportsCategory', 'organizer']));
    }

    public function unpublishTournament($id)
    {
        $user = Auth::user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tournament = Tournament::findOrFail($id);

        $tournament->update([
            'status' => 'draft',
            'is_published' => false,
            'rejection_reason' => null,
            'approved_by' => null,
            'approved_at' => null,
        ]);

        return response()->json($tournament->load(['sportsCategory', 'organizer']));
    }

    public static function notifyAdmins(Tournament $tournament): void
    {
        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            Mail::to($admin->email)->send(new TournamentPendingApprovalMail($tournament));
        }
    }
}
