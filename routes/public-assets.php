<?php

use App\Http\Controllers\PublicAssetController;
use Illuminate\Support\Facades\Route;

// PWA + static assets — no session/cookies (required for service worker + install prompt)
Route::get('/manifest.webmanifest', [PublicAssetController::class, 'manifest']);
Route::get('/sw.js', [PublicAssetController::class, 'serviceWorker']);
Route::get('/icons/icon-192.png', [PublicAssetController::class, 'pwaIcon192']);
Route::get('/icons/icon-512.png', [PublicAssetController::class, 'pwaIcon512']);
Route::get('/pwa/icon-192.png', [PublicAssetController::class, 'pwaIcon192']);
Route::get('/pwa/icon-512.png', [PublicAssetController::class, 'pwaIcon512']);
Route::get('/build/{path}', [PublicAssetController::class, 'asset'])
    ->where('path', '.*')
    ->defaults('folder', 'build');
