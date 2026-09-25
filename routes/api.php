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
use App\Http\Controllers\Admin\AdminRbacController;
use App\Http\Controllers\Admin\AdminTurfController;
use App\Http\Controllers\Platform\MeController;
use App\Http\Controllers\Platform\NotificationController;
use App\Http\Controllers\Turf\TurfController;
use App\Http\Controllers\Turf\BookingController;
use App\Http\Controllers\Turf\OwnerTurfController;
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
    Route::get('/users/me', [MeController::class, 'show']);
    Route::get('/modules', [MeController::class, 'allModules']);
    Route::get('/modules/available', [MeController::class, 'modules']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::get('/test-auth', action: [\App\Http\Controllers\TestController::class, 'testAuth']);
    Route::post('/payments/{merchantOrderId}/status', [PaymentController::class, 'checkStatus']);

    // Turf booking (module access)
    Route::middleware('module:turf')->prefix('turf')->group(function () {
        Route::get('/venues', [TurfController::class, 'index']);
        Route::get('/venues/{id}', [TurfController::class, 'show']);
        Route::get('/venues/{id}/availability', [TurfController::class, 'availability']);

        Route::get('/bookings', [BookingController::class, 'index']);
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel']);
        Route::post('/bookings/{id}/confirm-payment', [BookingController::class, 'confirmPayment']);

        Route::prefix('owner')->group(function () {
            Route::get('/dashboard', [OwnerTurfController::class, 'dashboard']);
            Route::get('/venues', [OwnerTurfController::class, 'listTurfs']);
            Route::post('/venues', [OwnerTurfController::class, 'storeTurf']);
            Route::get('/venues/{id}', [OwnerTurfController::class, 'showTurf']);
            Route::put('/venues/{id}', [OwnerTurfController::class, 'updateTurf']);
            Route::post('/venues/{id}/publish', [OwnerTurfController::class, 'publishTurf']);
            Route::post('/venues/{turfId}/courts', [OwnerTurfController::class, 'storeCourt']);
            Route::put('/courts/{courtId}', [OwnerTurfController::class, 'updateCourt']);
            Route::put('/courts/{courtId}/weekly-hours', [OwnerTurfController::class, 'setWeeklyHours']);
            Route::get('/courts/{courtId}/exceptions', [OwnerTurfController::class, 'listExceptions']);
            Route::post('/courts/{courtId}/exceptions', [OwnerTurfController::class, 'setException']);
            Route::delete('/exceptions/{id}', [OwnerTurfController::class, 'deleteException']);
            Route::get('/courts/{courtId}/price-rules', [OwnerTurfController::class, 'listPriceRules']);
            Route::post('/courts/{courtId}/price-rules', [OwnerTurfController::class, 'setPriceRule']);
            Route::put('/price-rules/{id}', [OwnerTurfController::class, 'updatePriceRule']);
            Route::delete('/price-rules/{id}', [OwnerTurfController::class, 'deletePriceRule']);
            Route::get('/bookings', [OwnerTurfController::class, 'listBookings']);
            Route::post('/bookings/{id}/cancel', [OwnerTurfController::class, 'cancelBooking']);
            Route::post('/bookings/{id}/confirm', [OwnerTurfController::class, 'confirmBooking']);
            Route::post('/bookings/{id}/no-show', [OwnerTurfController::class, 'markNoShow']);
            Route::post('/bookings/{id}/complete', [OwnerTurfController::class, 'markCompleted']);
        });
    });

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

        Route::prefix('rbac')->group(function () {
            Route::get('/overview', [AdminRbacController::class, 'overview']);
            Route::get('/roles', [AdminRbacController::class, 'listRoles']);
            Route::post('/roles', [AdminRbacController::class, 'storeRole']);
            Route::put('/roles/{id}', [AdminRbacController::class, 'updateRole']);
            Route::delete('/roles/{id}', [AdminRbacController::class, 'deleteRole']);
            Route::get('/permissions', [AdminRbacController::class, 'listPermissions']);
            Route::post('/permissions', [AdminRbacController::class, 'storePermission']);
            Route::put('/permissions/{id}', [AdminRbacController::class, 'updatePermission']);
            Route::delete('/permissions/{id}', [AdminRbacController::class, 'deletePermission']);
        });

        Route::prefix('turf')->group(function () {
            Route::get('/dashboard', [AdminTurfController::class, 'dashboard']);
            Route::get('/settings', [AdminTurfController::class, 'getSettings']);
            Route::put('/settings', [AdminTurfController::class, 'updateSettings']);

            Route::get('/venues', [AdminTurfController::class, 'index']);
            Route::post('/venues', [AdminTurfController::class, 'store']);
            Route::get('/venues/{id}', [AdminTurfController::class, 'show']);
            Route::put('/venues/{id}', [AdminTurfController::class, 'update']);
            Route::delete('/venues/{id}', [AdminTurfController::class, 'delete']);
            Route::post('/venues/{id}/publish', [AdminTurfController::class, 'publish']);
            Route::post('/venues/{id}/unpublish', [AdminTurfController::class, 'unpublish']);
            Route::post('/venues/{id}/approve', [AdminTurfController::class, 'approveTurf']);
            Route::post('/venues/{id}/reject', [AdminTurfController::class, 'rejectTurf']);
            Route::post('/venues/{id}/suspend', [AdminTurfController::class, 'suspendTurf']);
            Route::post('/venues/{turfId}/courts', [AdminTurfController::class, 'storeCourt']);

            Route::get('/owners', [AdminTurfController::class, 'owners']);
            Route::post('/owners/{id}/approve', [AdminTurfController::class, 'approveOwner']);
            Route::post('/owners/{id}/suspend', [AdminTurfController::class, 'suspendOwner']);
            Route::post('/owners/{id}/activate', [AdminTurfController::class, 'activateOwner']);

            Route::get('/bookings', [AdminTurfController::class, 'listBookings']);
            Route::post('/bookings/{id}/cancel', [AdminTurfController::class, 'cancelBooking']);
            Route::post('/bookings/{id}/confirm', [AdminTurfController::class, 'confirmBooking']);
            Route::post('/bookings/{id}/no-show', [AdminTurfController::class, 'markNoShow']);
            Route::post('/bookings/{id}/complete', [AdminTurfController::class, 'markCompleted']);
        });

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
            Route::put('/variants/{id}', [AdminCommerceController::class, 'updateVariant']);
            Route::delete('/variants/{id}', [AdminCommerceController::class, 'deleteVariant']);

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
