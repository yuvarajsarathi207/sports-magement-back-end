<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrganizerController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\SportsCategoryController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\Commerce\CatalogController;
use App\Http\Controllers\Commerce\CartController;
use App\Http\Controllers\Commerce\CheckoutController;
use App\Http\Controllers\Admin\Commerce\AdminCommerceController;
use App\Models\PlatformSetting;

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
Route::get('/sports-categories', [SportsCategoryController::class, 'index']);
Route::get('/settings/public', function () {
    return response()->json(PlatformSetting::publicPayload());
});
Route::match(['get', 'post'], '/payments/phonepe/callback', [PaymentController::class, 'phonepeCallback']);
Route::match(['get', 'post'], '/commerce/payments/webhook', [CheckoutController::class, 'webhook']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/test-auth', action: [\App\Http\Controllers\TestController::class, 'testAuth']);
    Route::post('/payments/{merchantOrderId}/status', [PaymentController::class, 'checkStatus']);

    // Admin routes
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/settings', [AdminController::class, 'getSettings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);
        Route::get('/tournaments', [AdminController::class, 'listTournaments']);
        Route::get('/tournaments/{id}', [AdminController::class, 'viewTournament']);
        Route::post('/tournaments/{id}/approve', [AdminController::class, 'approveTournament']);
        Route::post('/tournaments/{id}/reject', [AdminController::class, 'rejectTournament']);
        Route::post('/tournaments/{id}/unpublish', [AdminController::class, 'unpublishTournament']);

        Route::prefix('commerce')->group(function () {
            Route::get('/dashboard', [AdminCommerceController::class, 'dashboard']);
            Route::get('/settings', [AdminCommerceController::class, 'getSettings']);
            Route::put('/settings', [AdminCommerceController::class, 'updateSettings']);

            Route::get('/categories', [AdminCommerceController::class, 'listCategories']);
            Route::post('/categories', [AdminCommerceController::class, 'storeCategory']);
            Route::put('/categories/{id}', [AdminCommerceController::class, 'updateCategory']);
            Route::delete('/categories/{id}', [AdminCommerceController::class, 'deleteCategory']);

            Route::get('/brands', [AdminCommerceController::class, 'listBrands']);
            Route::post('/brands', [AdminCommerceController::class, 'storeBrand']);
            Route::put('/brands/{id}', [AdminCommerceController::class, 'updateBrand']);
            Route::delete('/brands/{id}', [AdminCommerceController::class, 'deleteBrand']);

            Route::get('/products', [AdminCommerceController::class, 'listProducts']);
            Route::post('/products', [AdminCommerceController::class, 'storeProduct']);
            Route::get('/products/{id}', [AdminCommerceController::class, 'showProduct']);
            Route::put('/products/{id}', [AdminCommerceController::class, 'updateProduct']);
            Route::delete('/products/{id}', [AdminCommerceController::class, 'deleteProduct']);
            Route::post('/products/{id}/images', [AdminCommerceController::class, 'uploadProductImage']);
            Route::post('/products/{id}/variants', [AdminCommerceController::class, 'upsertVariant']);

            Route::get('/inventory', [AdminCommerceController::class, 'inventory']);
            Route::get('/inventory/transactions', [AdminCommerceController::class, 'inventoryTransactions']);
            Route::post('/inventory/stock-in', [AdminCommerceController::class, 'stockIn']);
            Route::post('/inventory/stock-out', [AdminCommerceController::class, 'stockOut']);
            Route::post('/inventory/adjust', [AdminCommerceController::class, 'stockAdjust']);

            Route::get('/orders', [AdminCommerceController::class, 'listOrders']);
            Route::get('/orders/{id}', [AdminCommerceController::class, 'showOrder']);
            Route::post('/orders/{id}/status', [AdminCommerceController::class, 'updateOrderStatus']);

            Route::get('/returns', [AdminCommerceController::class, 'listReturns']);
            Route::post('/returns/{id}/resolve', [AdminCommerceController::class, 'resolveReturn']);

            Route::get('/shipments', [AdminCommerceController::class, 'listShipments']);

            Route::get('/coupons', [AdminCommerceController::class, 'listCoupons']);
            Route::post('/coupons', [AdminCommerceController::class, 'storeCoupon']);
            Route::put('/coupons/{id}', [AdminCommerceController::class, 'updateCoupon']);
        });
    });

    // Organizer routes
    Route::prefix('organizer')->group(function () {
        Route::get('/dashboard', [OrganizerController::class, 'dashboard']);
        Route::get('/tournaments', [OrganizerController::class, 'listTournaments']);
        Route::post('/tournaments', [OrganizerController::class, 'createTournament']);
        Route::get('/tournaments/{id}', [OrganizerController::class, 'viewTournament']);
        Route::put('/tournaments/{id}', [OrganizerController::class, 'updateTournament']);
        Route::post('/tournaments/{id}/publish', [OrganizerController::class, 'publishTournament']);
        Route::post('/tournaments/{id}/subscriptions/{subscriptionId}/confirm-payment', [OrganizerController::class, 'confirmPlayerPayment']);
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

    // Shared commerce (player + organizer)
    Route::prefix('commerce')->group(function () {
        Route::get('/products', [CatalogController::class, 'products']);
        Route::get('/products/{id}', [CatalogController::class, 'showProduct']);
        Route::get('/categories', [CatalogController::class, 'categories']);
        Route::get('/brands', [CatalogController::class, 'brands']);
        Route::get('/recommendations', [CatalogController::class, 'recommendations']);

        Route::get('/cart', [CartController::class, 'show']);
        Route::post('/cart/items', [CartController::class, 'addItem']);
        Route::put('/cart/items/{id}', [CartController::class, 'updateItem']);
        Route::delete('/cart/items/{id}', [CartController::class, 'removeItem']);

        Route::get('/addresses', [CartController::class, 'addresses']);
        Route::post('/addresses', [CartController::class, 'storeAddress']);
        Route::put('/addresses/{id}', [CartController::class, 'updateAddress']);
        Route::delete('/addresses/{id}', [CartController::class, 'deleteAddress']);

        Route::post('/checkout/validate', [CheckoutController::class, 'validateCheckout']);
        Route::post('/checkout', [CheckoutController::class, 'checkout']);
        Route::post('/payments/verify', [CheckoutController::class, 'verifyPayment']);

        Route::get('/orders', [CheckoutController::class, 'orders']);
        Route::get('/orders/{id}', [CheckoutController::class, 'showOrder']);
        Route::post('/orders/{id}/cancel', [CheckoutController::class, 'cancelOrder']);
        Route::post('/orders/{id}/return', [CheckoutController::class, 'returnOrder']);
    });
});
