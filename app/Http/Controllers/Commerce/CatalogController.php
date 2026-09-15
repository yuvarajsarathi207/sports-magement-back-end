<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\Brand;
use App\Models\Commerce\Product;
use App\Models\Commerce\ProductCategory;
use App\Models\PlatformSetting;
use App\Services\Commerce\RecommendationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CatalogController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function products(Request $request)
    {
        $this->ensureCommerceEnabled();

        $query = Product::with(['images', 'brand', 'category', 'sportsCategory', 'variants'])
            ->where('status', Product::STATUS_ACTIVE);

        if ($request->filled('category_id')) {
            $query->where('product_category_id', $request->integer('category_id'));
        }
        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->integer('brand_id'));
        }
        if ($request->filled('sports_category_id')) {
            $query->where('sports_category_id', $request->integer('sports_category_id'));
        }
        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where(function ($builder) use ($q) {
                $builder->where('name', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('sku', 'like', "%{$q}%");
            });
        }

        $products = $query->latest('id')->paginate(min(50, max(1, $request->integer('per_page', 20))));

        return response()->json($products);
    }

    public function showProduct(int $id, RecommendationService $recommendations)
    {
        $this->ensureCommerceEnabled();

        $product = Product::with(['images', 'brand', 'category', 'sportsCategory', 'variants'])
            ->where('status', Product::STATUS_ACTIVE)
            ->findOrFail($id);

        $user = Auth::user();
        if ($user) {
            $recommendations->trackView($user, $product->id);
        }

        return response()->json(['product' => $product]);
    }

    public function categories()
    {
        $this->ensureCommerceEnabled();

        $categories = ProductCategory::with('children')
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['categories' => $categories]);
    }

    public function brands()
    {
        $this->ensureCommerceEnabled();

        $brands = Brand::where('is_active', true)->orderBy('name')->get();

        return response()->json(['brands' => $brands]);
    }

    public function recommendations(RecommendationService $recommendations)
    {
        $this->ensureCommerceEnabled();
        $user = Auth::user();
        if (!$user || (!$user->isPlayer() && !$user->isOrganizer())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($recommendations->forUser($user));
    }

    protected function ensureCommerceEnabled(): void
    {
        if (!PlatformSetting::commerceEnabled()) {
            abort(503, 'Commerce is currently disabled.');
        }
    }
}
