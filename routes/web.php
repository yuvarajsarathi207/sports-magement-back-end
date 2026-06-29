<?php

use App\Http\Controllers\PublicAssetController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Static public files — needed when Hostinger document root is not Laravel's /public
Route::get('/manifest.webmanifest', [PublicAssetController::class, 'manifest']);
Route::get('/sw.js', [PublicAssetController::class, 'serviceWorker']);
Route::get('/pwa/{path}', [PublicAssetController::class, 'asset'])
    ->where('path', '.*')
    ->defaults('folder', 'pwa');
Route::get('/build/{path}', [PublicAssetController::class, 'asset'])
    ->where('path', '.*')
    ->defaults('folder', 'build');

// React SPA — mobile web app
Route::get('/app/{any?}', function () {
    return view('app');
})->where('any', '.*');
