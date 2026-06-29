<?php

namespace App\Http\Controllers;

use App\Mail\TournamentPendingApprovalMail;
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
            'published' => Tournament::publishedForPlayers()->count(),
            'draft' => Tournament::where('status', 'draft')->count(),
            'rejected' => Tournament::where('status', 'rejected')->count(),
            'total' => Tournament::count(),
        ];

        $categoryStats = SportsCategory::withCount([
            'tournaments as published_count' => fn ($q) => $q->publishedForPlayers(),
            'tournaments as pending_count' => fn ($q) => $q->where('status', 'pending_approval'),
        ])->get();

        $pendingTournaments = Tournament::where('status', 'pending_approval')
            ->with(['sportsCategory', 'organizer'])
            ->latest()
            ->limit(10)
            ->get();

        return response()->json([
            'stats' => $stats,
            'category_stats' => $categoryStats,
            'pending_tournaments' => $pendingTournaments,
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
