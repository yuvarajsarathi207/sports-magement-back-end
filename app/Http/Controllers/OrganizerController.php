<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use App\Models\SportsCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * @OA\Tag(
 *     name="Organizer",
 *     description="Organizer dashboard and tournament management endpoints"
 * )
 */
class OrganizerController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * @OA\Get(
     *     path="/api/organizer/dashboard",
     *     tags={"Organizer"},
     *     security={{"sanctum":{}}},
     *     summary="Get organizer dashboard data",
     *     description="REQUIRES: Authorization header with Bearer token. Format: 'Bearer {token}'. Example: 'Bearer 6|YuxRBo5pyMcpMOraGyRKfNZnqKsVuwQ7dG5jKu4Dab7b101f'",
     *     @OA\Response(
     *         response=200,
     *         description="Dashboard data",
     *         @OA\JsonContent(
     *             @OA\Property(property="tournaments", type="array", @OA\Items(type="object")),
     *             @OA\Property(property="stats", type="object")
     *         )
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

        if (!$user->isOrganizer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tournaments = Tournament::where('organizer_id', $user->id)
            ->with(['sportsCategory', 'interests'])
            ->latest()
            ->get();

        $stats = [
            'total_tournaments' => $tournaments->count(),
            'open_tournaments' => $tournaments->where('status', 'open')->count(),
            'active_tournaments' => $tournaments->where('status', 'active')->count(),
            'expired_tournaments' => $tournaments->where('status', 'expired')->count(),
        ];

        return response()->json([
            'tournaments' => $tournaments,
            'stats' => $stats,
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/organizer/tournaments",
     *     tags={"Organizer"},
     *     security={{"sanctum":{}}},
     *     summary="List all tournaments for organizer",
     *     @OA\Parameter(
     *         name="status",
     *         in="query",
     *         description="Filter by status",
     *         @OA\Schema(type="string", enum={"draft", "open", "active", "expired", "published"})
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="List of tournaments"
     *     )
     * )
     */
    public function listTournaments(Request $request)
    {
        $user = Auth::user();

        if (!$user->isOrganizer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Tournament::where('organizer_id', $user->id)
            ->with(['sportsCategory', 'interests.player'])
            ->withCount('interests');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $tournaments = $query->latest()->get();


        return response()->json($tournaments);
    }

    /**
     * @OA\Post(
     *     path="/api/organizer/tournaments",
     *     tags={"Organizer"},
     *     security={{"sanctum":{}}},
     *     summary="Create a new tournament",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"sports_category_id", "team_name", "location", "start_date", "winning_date", "slot_count", "rules", "entry_fee"},
     *             @OA\Property(property="sports_category_id", type="integer", example=1),
     *             @OA\Property(property="team_name", type="string", example="Team Alpha"),
     *             @OA\Property(property="location", type="string", example="Stadium A"),
     *             @OA\Property(property="location_details", type="string", example="Near City Center"),
     *             @OA\Property(property="start_date", type="string", format="date", example="2024-02-01"),
     *             @OA\Property(property="winning_date", type="string", format="date", example="2024-02-15"),
     *             @OA\Property(property="slot_count", type="integer", example=16),
     *             @OA\Property(property="template", type="string", example="Template details"),
     *             @OA\Property(property="rules", type="string", example="Tournament rules"),
     *             @OA\Property(property="entry_fee", type="number", format="float", example=100.00),
     *             @OA\Property(property="price_details", type="string", example="Price breakdown"),
     *             @OA\Property(property="ball_type", type="string", example="Football")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Tournament created successfully"
     *     )
     * )
     */
    public function createTournament(Request $request)
    {
        $user = Auth::user();

        if (!$user->isOrganizer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'sports_category_id' => 'required|exists:sports_categories,id',
            'team_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'location_details' => 'nullable|string',
            'start_date' => 'required|date',
            'winning_date' => 'required|date|after:start_date',
            'slot_count' => 'required|integer|min:1',
            'template' => 'nullable|string',
            'rules' => 'required|string',
            'entry_fee' => 'required|numeric|min:0',
            'price_details' => 'nullable|string',
            'ball_type' => 'nullable|string|max:255',
        ]);

        $tournament = Tournament::create([
            'organizer_id' => $user->id,
            'sports_category_id' => $request->sports_category_id,
            'team_name' => $request->team_name,
            'location' => $request->location,
            'location_details' => $request->location_details,
            'start_date' => $request->start_date,
            'winning_date' => $request->winning_date,
            'slot_count' => $request->slot_count,
            'template' => $request->template,
            'rules' => $request->rules,
            'entry_fee' => $request->entry_fee,
            'price_details' => $request->price_details,
            'ball_type' => $request->ball_type,
            'status' => 'draft',
        ]);

        return response()->json($tournament->load('sportsCategory'), 201);
    }

    /**
     * @OA\Get(
     *     path="/api/organizer/tournaments/{id}",
     *     tags={"Organizer"},
     *     security={{"sanctum":{}}},
     *     summary="Get tournament details",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Tournament details"
     *     )
     * )
     */
    public function viewTournament($id)
    {
        $user = Auth::user();

        if (!$user->isOrganizer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tournament = Tournament::where('id', $id)
            ->where('organizer_id', $user->id)
            ->with(['sportsCategory', 'interests.player'])
            ->firstOrFail();

        $interestedPlayersCount = $tournament->interests->count();

        return response()->json([
            'tournament' => $tournament,
            'interested_players_count' => $interestedPlayersCount,
        ]);
    }

    /**
     * @OA\Put(
     *     path="/api/organizer/tournaments/{id}",
     *     tags={"Organizer"},
     *     security={{"sanctum":{}}},
     *     summary="Update tournament",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(type="object")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Tournament updated successfully"
     *     )
     * )
     */
    public function updateTournament(Request $request, $id)
    {
        $user = Auth::user();

        if (!$user->isOrganizer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tournament = Tournament::where('id', $id)
            ->where('organizer_id', $user->id)
            ->firstOrFail();

        $request->validate([
            'sports_category_id' => 'sometimes|exists:sports_categories,id',
            'team_name' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'location_details' => 'nullable|string',
            'start_date' => 'sometimes|date',
            'winning_date' => 'sometimes|date|after:start_date',
            'slot_count' => 'sometimes|integer|min:1',
            'template' => 'nullable|string',
            'rules' => 'sometimes|string',
            'entry_fee' => 'sometimes|numeric|min:0',
            'price_details' => 'nullable|string',
            'ball_type' => 'nullable|string|max:255',
            'status' => 'sometimes|in:draft,open,active,expired,published',
        ]);

        $tournament->update($request->all());

        return response()->json($tournament->load('sportsCategory'));
    }

    /**
     * @OA\Post(
     *     path="/api/organizer/tournaments/{id}/publish",
     *     tags={"Organizer"},
     *     security={{"sanctum":{}}},
     *     summary="Publish tournament",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Tournament published successfully"
     *     )
     * )
     */
    public function publishTournament($id)
    {
        $user = Auth::user();

        if (!$user->isOrganizer()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tournament = Tournament::where('id', $id)
            ->where('organizer_id', $user->id)
            ->firstOrFail();

        $tournament->update([
            'status' => 'published',
            'is_published' => true,
        ]);

        return response()->json($tournament);
    }
}

