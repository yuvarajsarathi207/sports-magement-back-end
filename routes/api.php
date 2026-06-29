<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrganizerController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\SportsCategoryController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::get('/health', [HealthController::class, 'check']);
Route::get('/health/simple', [HealthController::class, 'simple']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/sports-categories', [SportsCategoryController::class, 'index']);

// Test route (for debugging)

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/test-auth', action: [\App\Http\Controllers\TestController::class, 'testAuth']);

    // Admin routes
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/tournaments', [AdminController::class, 'listTournaments']);
        Route::get('/tournaments/{id}', [AdminController::class, 'viewTournament']);
        Route::post('/tournaments/{id}/approve', [AdminController::class, 'approveTournament']);
        Route::post('/tournaments/{id}/reject', [AdminController::class, 'rejectTournament']);
        Route::post('/tournaments/{id}/unpublish', [AdminController::class, 'unpublishTournament']);
    });

    // Organizer routes
    Route::prefix('organizer')->group(function () {
        Route::get('/dashboard', [OrganizerController::class, 'dashboard']);
        Route::get('/tournaments', [OrganizerController::class, 'listTournaments']);
        Route::post('/tournaments', [OrganizerController::class, 'createTournament']);
        Route::get('/tournaments/{id}', [OrganizerController::class, 'viewTournament']);
        Route::put('/tournaments/{id}', [OrganizerController::class, 'updateTournament']);
        Route::post('/tournaments/{id}/publish', [OrganizerController::class, 'publishTournament']);
    });

    // Player routes
    Route::prefix('player')->group(function () {
        Route::get('/dashboard', [PlayerController::class, 'dashboard']);
        Route::get('/profile', [PlayerController::class, 'getProfile']);
        Route::put('/profile', [PlayerController::class, 'updateProfile']);
        Route::get('/tournaments', [PlayerController::class, 'listTournaments']);
        Route::get('/tournaments/{id}', [PlayerController::class, 'viewTournamentBasic']);
        Route::post('/tournaments/{id}/interest', [PlayerController::class, 'expressInterest']);
        Route::post('/tournaments/{id}/subscribe', [PlayerController::class, 'subscribe']);
        Route::get('/tournaments/{id}/details', [PlayerController::class, 'viewTournamentDetails']);
        Route::post('/subscriptions/{id}/pay', [PlayerController::class, 'paySubscription']);
    });
});
