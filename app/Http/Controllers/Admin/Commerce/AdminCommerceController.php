<?php

namespace App\Http\Controllers\Admin\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\Brand;
use App\Models\Commerce\Coupon;
use App\Models\Commerce\InventoryTransaction;
use App\Models\Commerce\Order;
use App\Models\Commerce\OrderReturn;
use App\Models\Commerce\Product;
use App\Models\Commerce\ProductCategory;
use App\Models\Commerce\ProductImage;
use App\Models\Commerce\ProductVariant;
use App\Models\Commerce\Shipment;
use App\Models\PlatformSetting;
use App\Services\Commerce\InventoryService;
use App\Services\Commerce\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class AdminCommerceController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService,
        protected OrderService $orderService
    ) {
        $this->middleware('auth:sanctum');
    }

    protected function ensureAdmin()
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Unauthorized');
        }

        return $user;
    }

    public function dashboard()
    {
        $this->ensureAdmin();

        $lowStock = PlatformSetting::commerceLowStockThreshold();

        return response()->json([
            'stats' => [
                'products' => Product::count(),
                'active_products' => Product::where('status', Product::STATUS_ACTIVE)->count(),
                'orders' => Order::count(),
                'orders_pending_payment' => Order::where('status', Order::STATUS_PAYMENT_PENDING)->count(),
                'orders_to_ship' => Order::whereIn('status', [Order::STATUS_CONFIRMED, Order::STATUS_PROCESSING, Order::STATUS_PACKED])->count(),
                'low_stock_variants' => ProductVariant::where('available_quantity', '<=', $lowStock)->count(),
                'return_requests' => OrderReturn::where('status', OrderReturn::STATUS_REQUESTED)->count(),
            ],
            'settings' => PlatformSetting::commercePayload(),
        ]);
    }

    public function getSettings()
    {
        $this->ensureAdmin();

        return response()->json(PlatformSetting::commercePayload());
    }

    public function updateSettings(Request $request)
    {
        $this->ensureAdmin();
        $data = $request->validate([
            'commerce_enabled' => 'sometimes|boolean',
            'commerce_cod_enabled' => 'sometimes|boolean',
            'commerce_online_payment_enabled' => 'sometimes|boolean',
            'commerce_cod_min_amount' => 'sometimes|numeric|min:0',
            'commerce_cod_max_amount' => 'sometimes|numeric|min:0',
            'commerce_delivery_charge' => 'sometimes|numeric|min:0',
            'commerce_free_delivery_threshold' => 'sometimes|numeric|min:0',
            'commerce_low_stock_threshold' => 'sometimes|integer|min:0',
            'commerce_reservation_ttl_minutes' => 'sometimes|integer|min:1|max:1440',
        ]);

        $map = [
            'commerce_enabled' => PlatformSetting::KEY_COMMERCE_ENABLED,
            'commerce_cod_enabled' => PlatformSetting::KEY_COMMERCE_COD_ENABLED,
            'commerce_online_payment_enabled' => PlatformSetting::KEY_COMMERCE_ONLINE_PAYMENT_ENABLED,
            'commerce_cod_min_amount' => PlatformSetting::KEY_COMMERCE_COD_MIN_AMOUNT,
            'commerce_cod_max_amount' => PlatformSetting::KEY_COMMERCE_COD_MAX_AMOUNT,
            'commerce_delivery_charge' => PlatformSetting::KEY_COMMERCE_DELIVERY_CHARGE,
            'commerce_free_delivery_threshold' => PlatformSetting::KEY_COMMERCE_FREE_DELIVERY_THRESHOLD,
            'commerce_low_stock_threshold' => PlatformSetting::KEY_COMMERCE_LOW_STOCK_THRESHOLD,
            'commerce_reservation_ttl_minutes' => PlatformSetting::KEY_COMMERCE_RESERVATION_TTL_MINUTES,
        ];

        foreach ($data as $key => $value) {
            if (isset($map[$key])) {
                PlatformSetting::setValue($map[$key], $value);
            }
        }

        return response()->json(PlatformSetting::commercePayload());
    }

    // ——— Categories ———
    public function listCategories()
    {
        $this->ensureAdmin();

        return response()->json([
            'categories' => ProductCategory::with('children')->whereNull('parent_id')->orderBy('sort_order')->get(),
        ]);
    }

    public function storeCategory(Request $request)
    {
        $this->ensureAdmin();
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'parent_id' => 'nullable|integer|exists:product_categories,id',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $category = ProductCategory::create([
            ...$data,
            'slug' => $this->uniqueSlug(ProductCategory::class, $data['name']),
            'is_active' => $data['is_active'] ?? true,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return response()->json(['category' => $category], 201);
    }

    public function updateCategory(Request $request, int $id)
    {
        $this->ensureAdmin();
        $category = ProductCategory::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:120',
            'parent_id' => 'nullable|integer|exists:product_categories,id',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);
        if (isset($data['name'])) {
            $data['slug'] = $this->uniqueSlug(ProductCategory::class, $data['name'], $category->id);
        }
        $category->update($data);

        return response()->json(['category' => $category->fresh('children')]);
    }

    public function deleteCategory(int $id)
    {
        $this->ensureAdmin();
        ProductCategory::findOrFail($id)->delete();

        return response()->json(['message' => 'Category deleted']);
    }

    // ——— Brands ———
    public function listBrands()
    {
        $this->ensureAdmin();

        return response()->json(['brands' => Brand::orderBy('name')->get()]);
    }

    public function storeBrand(Request $request)
    {
        $this->ensureAdmin();
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);
        $brand = Brand::create([
            ...$data,
            'slug' => $this->uniqueSlug(Brand::class, $data['name']),
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json(['brand' => $brand], 201);
    }

    public function updateBrand(Request $request, int $id)
    {
        $this->ensureAdmin();
        $brand = Brand::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:120',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);
        if (isset($data['name'])) {
            $data['slug'] = $this->uniqueSlug(Brand::class, $data['name'], $brand->id);
        }
        $brand->update($data);

        return response()->json(['brand' => $brand]);
    }

    public function deleteBrand(int $id)
    {
        $this->ensureAdmin();
        Brand::findOrFail($id)->delete();

        return response()->json(['message' => 'Brand deleted']);
    }

    // ——— Products ———
    public function listProducts(Request $request)
    {
        $this->ensureAdmin();
        $query = Product::with(['brand', 'category', 'variants', 'images']);
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where(function ($b) use ($q) {
                $b->where('name', 'like', "%{$q}%")->orWhere('sku', 'like', "%{$q}%");
            });
        }

        return response()->json($query->latest('id')->paginate(20));
    }

    public function storeProduct(Request $request)
    {
        $this->ensureAdmin();
        $data = $request->validate([
            'name' => 'required|string|max:200',
            'description' => 'nullable|string',
            'product_category_id' => 'nullable|integer|exists:product_categories,id',
            'brand_id' => 'nullable|integer|exists:brands,id',
            'sports_category_id' => 'nullable|integer|exists:sports_categories,id',
            'sku' => 'nullable|string|max:100|unique:products,sku',
            'base_price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'tax_percent' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|in:draft,active,inactive,archived',
            'weight' => 'nullable|numeric|min:0',
            'dimensions' => 'nullable|string|max:100',
            'initial_stock' => 'nullable|integer|min:0',
            'variants' => 'nullable|array',
            'variants.*.sku' => 'required_with:variants|string|max:100',
            'variants.*.size' => 'nullable|string|max:50',
            'variants.*.color' => 'nullable|string|max:50',
            'variants.*.price' => 'required_with:variants|numeric|min:0',
            'variants.*.discount_price' => 'nullable|numeric|min:0',
            'variants.*.stock' => 'nullable|integer|min:0',
            'variants.*.status' => 'nullable|in:active,inactive,out_of_stock',
        ]);

        $product = Product::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug(Product::class, $data['name']),
            'description' => $data['description'] ?? null,
            'product_category_id' => $data['product_category_id'] ?? null,
            'brand_id' => $data['brand_id'] ?? null,
            'sports_category_id' => $data['sports_category_id'] ?? null,
            'sku' => $data['sku'] ?? null,
            'base_price' => $data['base_price'],
            'discount_price' => $data['discount_price'] ?? null,
            'tax_percent' => $data['tax_percent'] ?? 0,
            'status' => $data['status'] ?? Product::STATUS_DRAFT,
            'weight' => $data['weight'] ?? null,
            'dimensions' => $data['dimensions'] ?? null,
            'has_variants' => !empty($data['variants']),
        ]);

        if (!empty($data['variants'])) {
            foreach ($data['variants'] as $v) {
                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'sku' => $v['sku'],
                    'size' => $v['size'] ?? null,
                    'color' => $v['color'] ?? null,
                    'price' => $v['price'],
                    'discount_price' => $v['discount_price'] ?? null,
                    'status' => $v['status'] ?? ProductVariant::STATUS_ACTIVE,
                    'available_quantity' => 0,
                ]);
                $stock = (int) ($v['stock'] ?? 0);
                if ($stock > 0) {
                    $this->inventoryService->stockIn($variant->id, $stock, Auth::id(), 'Initial stock');
                }
            }
        } else {
            $variant = ProductVariant::create([
                'product_id' => $product->id,
                'sku' => $data['sku'] ?: ('SKU-' . $product->id),
                'name' => 'Default',
                'price' => $data['discount_price'] ?? $data['base_price'],
                'discount_price' => $data['discount_price'] ?? null,
                'status' => ProductVariant::STATUS_ACTIVE,
                'available_quantity' => 0,
            ]);
            $stock = (int) ($data['initial_stock'] ?? 0);
            if ($stock > 0) {
                $this->inventoryService->stockIn($variant->id, $stock, Auth::id(), 'Initial stock');
            }
        }

        return response()->json([
            'product' => $product->fresh(['variants', 'images', 'brand', 'category']),
        ], 201);
    }

    public function showProduct(int $id)
    {
        $this->ensureAdmin();

        return response()->json([
            'product' => Product::with(['variants', 'images', 'brand', 'category', 'sportsCategory'])->findOrFail($id),
        ]);
    }

    public function updateProduct(Request $request, int $id)
    {
        $this->ensureAdmin();
        $product = Product::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'product_category_id' => 'nullable|integer|exists:product_categories,id',
            'brand_id' => 'nullable|integer|exists:brands,id',
            'sports_category_id' => 'nullable|integer|exists:sports_categories,id',
            'sku' => 'nullable|string|max:100|unique:products,sku,' . $product->id,
            'base_price' => 'sometimes|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'tax_percent' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|in:draft,active,inactive,archived',
            'weight' => 'nullable|numeric|min:0',
            'dimensions' => 'nullable|string|max:100',
        ]);
        if (isset($data['name'])) {
            $data['slug'] = $this->uniqueSlug(Product::class, $data['name'], $product->id);
        }
        $product->update($data);

        return response()->json(['product' => $product->fresh(['variants', 'images', 'brand', 'category'])]);
    }

    public function deleteProduct(int $id)
    {
        $this->ensureAdmin();
        Product::findOrFail($id)->delete();

        return response()->json(['message' => 'Product deleted']);
    }

    public function uploadProductImage(Request $request, int $id)
    {
        $this->ensureAdmin();
        $product = Product::findOrFail($id);
        $data = $request->validate([
            'image' => 'required|file|mimes:jpg,jpeg,png,webp|max:5120',
            'is_primary' => 'nullable|boolean',
            'product_variant_id' => 'nullable|integer|exists:product_variants,id',
        ]);

        $path = $request->file('image')->store('product-images', 'public');
        $url = Storage::disk('public')->url($path);

        if (!empty($data['is_primary'])) {
            ProductImage::where('product_id', $product->id)->update(['is_primary' => false]);
        }

        $image = ProductImage::create([
            'product_id' => $product->id,
            'product_variant_id' => $data['product_variant_id'] ?? null,
            'url' => $url,
            'is_primary' => $data['is_primary'] ?? false,
            'sort_order' => (int) ProductImage::where('product_id', $product->id)->max('sort_order') + 1,
        ]);

        return response()->json(['image' => $image], 201);
    }

    public function upsertVariant(Request $request, int $productId)
    {
        $this->ensureAdmin();
        $product = Product::findOrFail($productId);
        $data = $request->validate([
            'id' => 'nullable|integer|exists:product_variants,id',
            'sku' => 'required|string|max:100',
            'name' => 'nullable|string|max:120',
            'size' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'tax_percent' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|in:active,inactive,out_of_stock',
        ]);

        if (!empty($data['id'])) {
            $variant = ProductVariant::where('product_id', $product->id)->whereKey($data['id'])->firstOrFail();
            $variant->update(collect($data)->except('id')->all());
        } else {
            $variant = ProductVariant::create([
                ...collect($data)->except('id')->all(),
                'product_id' => $product->id,
                'status' => $data['status'] ?? ProductVariant::STATUS_ACTIVE,
            ]);
            $product->update(['has_variants' => true]);
        }

        return response()->json(['variant' => $variant->fresh()]);
    }

    // ——— Inventory ———
    public function inventory(Request $request)
    {
        $this->ensureAdmin();
        $low = PlatformSetting::commerceLowStockThreshold();
        $query = ProductVariant::with('product');
        if ($request->boolean('low_stock')) {
            $query->where('available_quantity', '<=', $low);
        }

        return response()->json($query->orderBy('available_quantity')->paginate(30));
    }

    public function inventoryTransactions(Request $request)
    {
        $this->ensureAdmin();
        $query = InventoryTransaction::with(['variant.product', 'user'])->latest('id');
        if ($request->filled('product_variant_id')) {
            $query->where('product_variant_id', $request->integer('product_variant_id'));
        }

        return response()->json($query->paginate(50));
    }

    public function stockIn(Request $request)
    {
        return $this->stockMutation($request, 'in');
    }

    public function stockOut(Request $request)
    {
        return $this->stockMutation($request, 'out');
    }

    public function stockAdjust(Request $request)
    {
        $this->ensureAdmin();
        $data = $request->validate([
            'product_variant_id' => 'required|integer|exists:product_variants,id',
            'available_quantity' => 'required|integer|min:0',
            'notes' => 'nullable|string|max:500',
            'idempotency_key' => 'nullable|string|max:100',
        ]);

        try {
            $variant = $this->inventoryService->adjust(
                $data['product_variant_id'],
                $data['available_quantity'],
                Auth::id(),
                $data['notes'] ?? null,
                $data['idempotency_key'] ?? null
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['variant' => $variant]);
    }

    protected function stockMutation(Request $request, string $direction)
    {
        $this->ensureAdmin();
        $data = $request->validate([
            'product_variant_id' => 'required|integer|exists:product_variants,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:500',
            'idempotency_key' => 'nullable|string|max:100',
        ]);

        try {
            $variant = $direction === 'in'
                ? $this->inventoryService->stockIn($data['product_variant_id'], $data['quantity'], Auth::id(), $data['notes'] ?? null, $data['idempotency_key'] ?? null)
                : $this->inventoryService->stockOut($data['product_variant_id'], $data['quantity'], Auth::id(), $data['notes'] ?? null, $data['idempotency_key'] ?? null);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['variant' => $variant]);
    }

    // ——— Orders ———
    public function listOrders(Request $request)
    {
        $this->ensureAdmin();
        $query = Order::with(['items', 'user', 'payments', 'shipments'])->latest('id');
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json($query->paginate(20));
    }

    public function showOrder(int $id)
    {
        $this->ensureAdmin();

        return response()->json([
            'order' => Order::with(['items', 'user', 'payments', 'shipments', 'returns', 'refunds'])->findOrFail($id),
        ]);
    }

    public function updateOrderStatus(Request $request, int $id)
    {
        $this->ensureAdmin();
        $data = $request->validate([
            'status' => 'required|string',
            'tracking_number' => 'nullable|string|max:120',
        ]);

        $order = Order::with('items')->findOrFail($id);

        try {
            if (!empty($data['tracking_number'])) {
                $shipment = $order->shipments()->latest('id')->first();
                if ($shipment) {
                    $shipment->update([
                        'tracking_number' => $data['tracking_number'],
                        'shipment_id' => $shipment->shipment_id ?: ('MANUAL-' . Str::upper(Str::random(8))),
                    ]);
                }
            }
            $order = $this->orderService->transition($order, $data['status'], Auth::id());
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['order' => $order]);
    }

    public function listReturns()
    {
        $this->ensureAdmin();

        return response()->json([
            'returns' => OrderReturn::with(['order', 'user'])->latest('id')->paginate(20),
        ]);
    }

    public function resolveReturn(Request $request, int $id)
    {
        $this->ensureAdmin();
        $data = $request->validate([
            'action' => 'required|in:approve,reject,refund',
            'notes' => 'nullable|string|max:500',
        ]);

        $return = OrderReturn::with('order.items')->findOrFail($id);
        $order = $return->order;

        if ($data['action'] === 'reject') {
            $return->update(['status' => OrderReturn::STATUS_REJECTED, 'resolved_at' => now()]);
            if ($order->canTransitionTo(Order::STATUS_DELIVERED)) {
                $order->update(['status' => Order::STATUS_DELIVERED]);
            }

            return response()->json(['return' => $return->fresh(), 'order' => $order->fresh()]);
        }

        $return->update(['status' => OrderReturn::STATUS_APPROVED, 'resolved_at' => now()]);
        if ($order->canTransitionTo(Order::STATUS_RETURNED)) {
            $this->orderService->transition($order, Order::STATUS_RETURNED, Auth::id());
        }

        $refund = null;
        if ($data['action'] === 'refund') {
            $refund = $this->orderService->createRefund($order->fresh('items'), (float) $order->total_amount, $return->id, $data['notes'] ?? null);
            $return->update(['status' => OrderReturn::STATUS_COMPLETED]);
        }

        return response()->json([
            'return' => $return->fresh(),
            'order' => $order->fresh(['refunds']),
            'refund' => $refund,
        ]);
    }

    public function listShipments()
    {
        $this->ensureAdmin();

        return response()->json([
            'shipments' => Shipment::with('order')->latest('id')->paginate(20),
        ]);
    }

    public function listCoupons()
    {
        $this->ensureAdmin();

        return response()->json(['coupons' => Coupon::latest('id')->get()]);
    }

    public function storeCoupon(Request $request)
    {
        $this->ensureAdmin();
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:coupons,code',
            'name' => 'required|string|max:120',
            'discount_type' => 'required|in:fixed,percent',
            'discount_value' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'is_active' => 'nullable|boolean',
        ]);

        $coupon = Coupon::create([
            ...$data,
            'code' => strtoupper($data['code']),
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json(['coupon' => $coupon], 201);
    }

    public function updateCoupon(Request $request, int $id)
    {
        $this->ensureAdmin();
        $coupon = Coupon::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:120',
            'discount_type' => 'sometimes|in:fixed,percent',
            'discount_value' => 'sometimes|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
            'is_active' => 'nullable|boolean',
        ]);
        $coupon->update($data);

        return response()->json(['coupon' => $coupon]);
    }

    protected function uniqueSlug(string $modelClass, string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'item';
        $slug = $base;
        $i = 1;
        while ($modelClass::withTrashed()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }
}
