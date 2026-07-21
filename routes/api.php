<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrganizerController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\SportsCategoryController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\Shop\HomeController as ShopHomeController;
use App\Http\Controllers\Shop\CategoryController;
use App\Http\Controllers\Shop\ProductController;
use App\Http\Controllers\Shop\BannerController;
use App\Http\Controllers\Shop\CartController;
use App\Http\Controllers\Shop\WishlistController;
use App\Http\Controllers\Shop\AddressController;
use App\Http\Controllers\Shop\OrderController;
use App\Http\Controllers\Shop\PaymentController;
use App\Http\Controllers\Shop\AdminShopController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::get('/health', [HealthController::class, 'check']);
Route::get('/health/simple', [HealthController::class, 'simple']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/sports-categories', [SportsCategoryController::class, 'index']);

// Public shop catalogue
Route::prefix('shop')->group(function () {
    Route::get('/home', [ShopHomeController::class, 'index']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::get('/banners', [BannerController::class, 'index']);
    Route::get('/payment-methods', [PaymentController::class, 'methods']);
});

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

        // Shop admin
        Route::get('/shop/dashboard', [AdminShopController::class, 'dashboard']);
        Route::get('/shop/orders', [AdminShopController::class, 'orders']);
        Route::get('/shop/orders/{id}', [AdminShopController::class, 'showOrder']);
        Route::put('/shop/orders/{id}/status', [AdminShopController::class, 'updateOrderStatus']);
        Route::post('/shop/orders/{id}/refund', [AdminShopController::class, 'refundOrder']);
        Route::get('/shop/customers', [AdminShopController::class, 'customers']);
        Route::post('/shop/customers/{id}/block', [AdminShopController::class, 'blockUser']);
        Route::post('/shop/customers/{id}/unblock', [AdminShopController::class, 'unblockUser']);
        Route::post('/shop/customers/{id}/reset-password', [AdminShopController::class, 'resetPassword']);
        Route::get('/shop/reports', [AdminShopController::class, 'reports']);
        Route::post('/shop/tournaments/{id}/feature', [AdminShopController::class, 'featureTournament']);

        Route::post('/shop/categories', [CategoryController::class, 'store']);
        Route::put('/shop/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/shop/categories/{id}', [CategoryController::class, 'destroy']);
        Route::post('/shop/categories/{id}/toggle', [CategoryController::class, 'toggle']);

        Route::post('/shop/products', [ProductController::class, 'store']);
        Route::put('/shop/products/{id}', [ProductController::class, 'update']);
        Route::delete('/shop/products/{id}', [ProductController::class, 'destroy']);
        Route::post('/shop/products/bulk', [ProductController::class, 'bulkUpload']);
        Route::put('/shop/products/{id}/stock', [ProductController::class, 'updateStock']);

        Route::post('/shop/banners', [BannerController::class, 'store']);
        Route::put('/shop/banners/{id}', [BannerController::class, 'update']);
        Route::delete('/shop/banners/{id}', [BannerController::class, 'destroy']);
        Route::post('/shop/banners/{id}/toggle', [BannerController::class, 'toggle']);
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

    // Authenticated shop (cart, wishlist, addresses, orders)
    Route::prefix('shop')->group(function () {
        Route::get('/cart', [CartController::class, 'show']);
        Route::post('/cart', [CartController::class, 'store']);
        Route::put('/cart/{id}', [CartController::class, 'update']);
        Route::delete('/cart/{id}', [CartController::class, 'destroy']);
        Route::post('/cart/{id}/save-for-later', [CartController::class, 'saveForLater']);
        Route::post('/cart/{id}/move-to-cart', [CartController::class, 'moveToCart']);

        Route::get('/wishlist', [WishlistController::class, 'index']);
        Route::post('/wishlist', [WishlistController::class, 'store']);
        Route::delete('/wishlist/{id}', [WishlistController::class, 'destroy']);
        Route::post('/wishlist/{id}/move-to-cart', [WishlistController::class, 'moveToCart']);

        Route::get('/addresses', [AddressController::class, 'index']);
        Route::post('/addresses', [AddressController::class, 'store']);
        Route::put('/addresses/{id}', [AddressController::class, 'update']);
        Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);
        Route::post('/addresses/{id}/default', [AddressController::class, 'setDefault']);

        Route::get('/orders', [OrderController::class, 'index']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/orders/{id}', [OrderController::class, 'show']);
        Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
        Route::get('/orders/{id}/track', [OrderController::class, 'track']);
        Route::get('/orders/{id}/invoice', [OrderController::class, 'invoice']);

        Route::post('/orders/{id}/pay/confirm', [PaymentController::class, 'confirm']);
    });
});
