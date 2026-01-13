<?php

namespace App\Http\Controllers;

use App\Models\SportsCategory;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Sports Categories",
 *     description="Sports categories endpoints"
 * )
 */
class SportsCategoryController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/sports-categories",
     *     tags={"Sports Categories"},
     *     summary="List all sports categories",
     *     @OA\Response(
     *         response=200,
     *         description="List of sports categories"
     *     )
     * )
     */
    public function index()
    {
        $categories = SportsCategory::all();
        return response()->json($categories);
    }
}

