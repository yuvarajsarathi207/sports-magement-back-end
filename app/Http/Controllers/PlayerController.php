<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use App\Models\TournamentInterest;
use App\Models\Subscription;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * @OA\Tag(
 *     name="Player",
 *     description="Player dashboard and tournament interaction endpoints"
 * )
 */
class PlayerController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * @OA\Get(
     *     path="/api/player/dashboard",
     *     tags={"Player"},
     *     security={{"sanctum":{}}},
     *     summary="Get player dashboard data",
     *     description="REQUIRES: Authorization header with Bearer token. Format: 'Bearer {token}'. Example: 'Bearer 6|YuxRBo5pyMcpMOraGyRKfNZnqKsVuwQ7dG5jKu4Dab7b101f'",
     *     @OA\Response(
     *         response=200,
     *         description="Dashboard data"
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated - Missing or invalid Bearer token"
     *     )
     * )
     */
    public function dashboard()
    {
        $user = Auth::user();

        if (!$user->isPlayer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $subscriptions = Subscription::where('player_id', $user->id)
            ->with(['tournament.sportsCategory'])
            ->latest()
            ->get();

        $interests = TournamentInterest::where('player_id', $user->id)
            ->with(['tournament.sportsCategory'])
            ->latest()
            ->get();

        return response()->json([
            'subscriptions' => $subscriptions,
            'interests' => $interests,
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/player/profile",
     *     tags={"Player"},
     *     security={{"sanctum":{}}},
     *     summary="Get player profile",
     *     @OA\Response(
     *         response=200,
     *         description="Player profile"
     *     )
     * )
     */
    public function getProfile()
    {
        $user = Auth::user();

        if (!$user->isPlayer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($user);
    }

    /**
     * @OA\Put(
     *     path="/api/player/profile",
     *     tags={"Player"},
     *     security={{"sanctum":{}}},
     *     summary="Update player profile",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string"),
     *             @OA\Property(property="mobile", type="string")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Profile updated successfully"
     *     )
     * )
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        if (!$user->isPlayer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'mobile' => 'sometimes|string|unique:users,mobile,' . $user->id,
        ]);

        $user->update($request->only(['name', 'mobile']));

        return response()->json($user);
    }

    /**
     * @OA\Get(
     *     path="/api/player/tournaments",
     *     tags={"Player"},
     *     security={{"sanctum":{}}},
     *     summary="List published tournaments",
     *     @OA\Parameter(
     *         name="category_id",
     *         in="query",
     *         description="Filter by sports category",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="List of published tournaments"
     *     )
     * )
     */
    public function listTournaments(Request $request)
    {
        $user = Auth::user();

        if (!$user->isPlayer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Tournament::where('is_published', true)
            ->where('status', 'published')
            ->with(['sportsCategory']);

        if ($request->has('category_id')) {
            $query->where('sports_category_id', $request->category_id);
        }

        $tournaments = $query->latest()->get();

        // Hide main location details for basic view
        $tournaments = $tournaments->map(function ($tournament) {
            $tournament->location_details = null; // Hide location details in list
            return $tournament;
        });

        return response()->json($tournaments);
    }

    /**
     * @OA\Get(
     *     path="/api/player/tournaments/{id}",
     *     tags={"Player"},
     *     security={{"sanctum":{}}},
     *     summary="Get tournament basic details (location hidden)",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Tournament basic details"
     *     )
     * )
     */
    public function viewTournamentBasic($id)
    {
        $user = Auth::user();

        if (!$user->isPlayer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tournament = Tournament::where('id', $id)
            ->where('is_published', true)
            ->with(['sportsCategory'])
            ->firstOrFail();

        // Hide location details
        $tournament->location_details = null;

        return response()->json($tournament);
    }

    /**
     * @OA\Post(
     *     path="/api/player/tournaments/{id}/interest",
     *     tags={"Player"},
     *     security={{"sanctum":{}}},
     *     summary="Express interest in tournament",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Interest expressed successfully"
     *     )
     * )
     */
    public function expressInterest($id)
    {
        $user = Auth::user();

        if (!$user->isPlayer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tournament = Tournament::where('id', $id)
            ->where('is_published', true)
            ->firstOrFail();

        $existingInterest = TournamentInterest::where('tournament_id', $id)
            ->where('player_id', $user->id)
            ->first();

        if ($existingInterest) {
            return response()->json(['message' => 'Already expressed interest'], 400);
        }

        $interest = TournamentInterest::create([
            'tournament_id' => $id,
            'player_id' => $user->id,
        ]);

        return response()->json($interest, 201);
    }

    /**
     * @OA\Post(
     *     path="/api/player/tournaments/{id}/subscribe",
     *     tags={"Player"},
     *     security={{"sanctum":{}}},
     *     summary="Subscribe to tournament",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Subscription created successfully"
     *     )
     * )
     */
    public function subscribe($id)
    {
        $user = Auth::user();

        if (!$user->isPlayer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tournament = Tournament::where('id', $id)
            ->where('is_published', true)
            ->firstOrFail();

        $existingSubscription = Subscription::where('tournament_id', $id)
            ->where('player_id', $user->id)
            ->first();

        if ($existingSubscription) {
            return response()->json(['message' => 'Already subscribed'], 400);
        }

        $subscription = Subscription::create([
            'tournament_id' => $id,
            'player_id' => $user->id,
            'status' => 'pending',
        ]);

        return response()->json($subscription->load('tournament'), 201);
    }

    /**
     * @OA\Get(
     *     path="/api/player/tournaments/{id}/details",
     *     tags={"Player"},
     *     security={{"sanctum":{}}},
     *     summary="Get full tournament details (requires subscription)",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Full tournament details"
     *     )
     * )
     */
    public function viewTournamentDetails($id)
    {
        $user = Auth::user();

        if (!$user->isPlayer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $subscription = Subscription::where('tournament_id', $id)
            ->where('player_id', $user->id)
            ->first();

        if (!$subscription) {
            return response()->json(['message' => 'Subscription required'], 403);
        }

        $tournament = Tournament::where('id', $id)
            ->with(['sportsCategory'])
            ->firstOrFail();

        return response()->json($tournament);
    }

    /**
     * @OA\Post(
     *     path="/api/player/subscriptions/{id}/pay",
     *     tags={"Player"},
     *     security={{"sanctum":{}}},
     *     summary="Pay for subscription",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="payment_method", type="string", example="card"),
     *             @OA\Property(property="payment_details", type="object")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Payment processed successfully"
     *     )
     * )
     */
    public function paySubscription(Request $request, $id)
    {
        $user = Auth::user();

        if (!$user->isPlayer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $subscription = Subscription::where('id', $id)
            ->where('player_id', $user->id)
            ->with('tournament')
            ->firstOrFail();

        $request->validate([
            'payment_method' => 'required|string',
            'payment_details' => 'nullable|array',
        ]);

        $payment = Payment::create([
            'subscription_id' => $subscription->id,
            'tournament_id' => $subscription->tournament_id,
            'player_id' => $user->id,
            'amount' => $subscription->tournament->entry_fee,
            'status' => 'completed', // In real app, integrate with payment gateway
            'payment_method' => $request->payment_method,
            'transaction_id' => 'TXN-' . Str::random(16),
            'payment_details' => json_encode($request->payment_details),
        ]);

        $subscription->update(['status' => 'active']);

        return response()->json($payment, 201);
    }
}

