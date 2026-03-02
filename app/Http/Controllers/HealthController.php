<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

/**
 * @OA\Tag(
 *     name="Health",
 *     description="API health check endpoints"
 * )
 */
class HealthController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/health",
     *     tags={"Health"},
     *     summary="Health check endpoint",
     *     description="Check if the API is running and database is accessible",
     *     @OA\Response(
     *         response=200,
     *         description="API is healthy",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="healthy"),
     *             @OA\Property(property="timestamp", type="string", example="2026-02-05T06:30:00.000000Z"),
     *             @OA\Property(property="database", type="string", example="connected"),
     *             @OA\Property(property="cache", type="string", example="working"),
     *             @OA\Property(property="version", type="string", example="1.0.0")
     *         )
     *     ),
     *     @OA\Response(
     *         response=503,
     *         description="Service unavailable",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="unhealthy"),
     *             @OA\Property(property="timestamp", type="string"),
     *             @OA\Property(property="database", type="string", example="disconnected"),
     *             @OA\Property(property="cache", type="string", example="not working"),
     *             @OA\Property(property="errors", type="array", @OA\Items(type="string"))
     *         )
     *     )
     * )
     */
    public function check()
    {
        $status = 'healthy';
        $errors = [];
        $database = 'connected';
        $cache = 'working';

        // Check database connection
        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            $database = 'disconnected';
            $status = 'unhealthy';
            $errors[] = 'Database connection failed: ' . $e->getMessage();
        }

        // Check cache
        try {
            $testKey = 'health_check_' . time();
            Cache::put($testKey, 'test', 1);
            $value = Cache::get($testKey);
            Cache::forget($testKey);
            
            if ($value !== 'test') {
                $cache = 'not working';
                $status = 'unhealthy';
                $errors[] = 'Cache is not working properly';
            }
        } catch (\Exception $e) {
            $cache = 'not working';
            $status = 'unhealthy';
            $errors[] = 'Cache check failed: ' . $e->getMessage();
        }

        $response = [
            'status' => $status,
            'timestamp' => now()->toIso8601String(),
            'database' => $database,
            'cache' => $cache,
            'version' => '1.0.0',
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        $httpStatus = $status === 'healthy' ? 200 : 503;

        return response()->json($response, $httpStatus);
    }

    /**
     * @OA\Get(
     *     path="/api/health/simple",
     *     tags={"Health"},
     *     summary="Simple health check endpoint",
     *     description="Simple health check that only returns API status without database checks",
     *     @OA\Response(
     *         response=200,
     *         description="API is running",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="ok"),
     *             @OA\Property(property="message", type="string", example="API is running"),
     *             @OA\Property(property="timestamp", type="string", example="2026-02-05T06:30:00.000000Z")
     *         )
     *     )
     * )
     */
    public function simple()
    {
        return response()->json([
            'status' => 'ok',
            'message' => 'API is running',
            'timestamp' => now()->toIso8601String(),
        ], 200);
    }
}

