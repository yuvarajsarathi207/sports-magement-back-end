<?php

namespace App\Http\Controllers\Shop;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends ShopController
{
    public function index(Request $request)
    {
        $query = Product::with(['images', 'category']);

        $isAdmin = $request->user()?->isAdmin();
        if (!$isAdmin) {
            $query->active();
        } elseif ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('brand')) {
            $query->where('brand', $request->brand);
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }
        if ($request->boolean('popular')) {
            $query->where('is_popular', true);
        }
        if ($request->boolean('new')) {
            $query->where('is_new', true);
        }
        if ($request->boolean('flash_deal')) {
            $query->where('is_flash_deal', true);
        }

        $query->search($request->get('q') ?? $request->get('search'));

        $sort = $request->get('sort', 'latest');
        match ($sort) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'rating' => $query->orderByDesc('rating'),
            'name' => $query->orderBy('name'),
            default => $query->latest(),
        };

        $perPage = min((int) $request->get('per_page', 20), 100);

        return response()->json($query->paginate($perPage));
    }

    public function show($id)
    {
        $product = Product::with(['images', 'category'])->findOrFail($id);

        if ($product->status !== 'active' && !auth()->user()?->isAdmin()) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $related = Product::active()
            ->with('images')
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->limit(8)
            ->get();

        $similar = Product::active()
            ->with('images')
            ->where('id', '!=', $product->id)
            ->when($product->brand, fn ($q) => $q->where('brand', $product->brand))
            ->limit(8)
            ->get();

        return response()->json([
            'product' => $product,
            'related_products' => $related,
            'similar_products' => $similar,
        ]);
    }

    public function store(Request $request)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $this->normalizeBooleanFlags($request);
        $request->validate([
            'images' => 'nullable|array|max:8',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp,gif|max:5120',
        ]);

        $data = $this->validatedProduct($request);
        $product = Product::create($data);

        $this->syncImages($request, $product);

        return response()->json($product->load(['images', 'category']), 201);
    }

    public function update(Request $request, $id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $this->normalizeBooleanFlags($request);
        $request->validate([
            'images' => 'nullable|array|max:8',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp,gif|max:5120',
        ]);

        $product = Product::findOrFail($id);
        $data = $this->validatedProduct($request, $product->id);
        $product->update($data);
        $this->syncImages($request, $product);

        return response()->json($product->fresh(['images', 'category']));
    }

    public function destroy($id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }

    public function bulkUpload(Request $request)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $request->validate([
            'products' => 'required|array|min:1',
            'products.*.name' => 'required|string|max:255',
            'products.*.sku' => 'required|string|max:100|distinct',
            'products.*.category_id' => 'required|exists:product_categories,id',
            'products.*.price' => 'required|numeric|min:0',
            'products.*.stock' => 'integer|min:0',
        ]);

        $created = [];
        DB::transaction(function () use ($request, &$created) {
            foreach ($request->products as $row) {
                $row['sku'] = $row['sku'];
                if (Product::where('sku', $row['sku'])->exists()) {
                    continue;
                }
                $row['slug'] = Str::slug($row['name']) . '-' . Str::lower(Str::random(4));
                $row['status'] = $row['status'] ?? 'active';
                $created[] = Product::create($row);
            }
        });

        return response()->json(['created' => count($created), 'products' => $created], 201);
    }

    public function updateStock(Request $request, $id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $data = $request->validate([
            'stock' => 'required|integer|min:0',
            'status' => 'nullable|in:active,inactive,out_of_stock',
        ]);

        $product = Product::findOrFail($id);
        $product->stock = $data['stock'];
        if (isset($data['status'])) {
            $product->status = $data['status'];
        } elseif ($data['stock'] === 0) {
            $product->status = 'out_of_stock';
        }
        $product->save();

        return response()->json($product);
    }

    private function validatedProduct(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'name' => ($id ? 'sometimes' : 'required') . '|string|max:255',
            'sku' => ($id ? 'sometimes' : 'required') . '|string|max:100|unique:products,sku' . ($id ? ",{$id}" : ''),
            'description' => 'nullable|string',
            'category_id' => ($id ? 'sometimes' : 'required') . '|exists:product_categories,id',
            'brand' => 'nullable|string|max:255',
            'price' => ($id ? 'sometimes' : 'required') . '|numeric|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
            'stock' => 'nullable|integer|min:0',
            'status' => 'nullable|in:active,inactive,out_of_stock',
            'is_featured' => 'boolean',
            'is_popular' => 'boolean',
            'is_new' => 'boolean',
            'is_flash_deal' => 'boolean',
            'flash_deal_price' => 'nullable|numeric|min:0',
            'flash_deal_ends_at' => 'nullable|date',
            'slug' => 'nullable|string|max:255',
        ]);
    }

    private function normalizeBooleanFlags(Request $request): void
    {
        foreach (['is_featured', 'is_popular', 'is_new', 'is_flash_deal'] as $flag) {
            if ($request->has($flag)) {
                $request->merge([
                    $flag => filter_var($request->input($flag), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
                ]);
            }
        }
    }

    private function syncImages(Request $request, Product $product): void
    {
        $files = $request->file('images', []);
        if ($files instanceof \Illuminate\Http\UploadedFile) {
            $files = [$files];
        }

        if (!empty($files)) {
            $existingCount = $product->images()->count();
            foreach (array_values($files) as $index => $file) {
                if (!$file || !$file->isValid()) {
                    continue;
                }
                $path = $file->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'path' => $path,
                    'is_primary' => $existingCount === 0 && $index === 0,
                    'display_order' => $existingCount + $index,
                ]);
            }
        }

        if ($request->filled('image_urls') && is_array($request->image_urls)) {
            $existingCount = $product->images()->count();
            foreach (array_values($request->image_urls) as $index => $url) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'path' => $url,
                    'is_primary' => $existingCount === 0 && $index === 0,
                    'display_order' => $existingCount + $index,
                ]);
            }
        }
    }
}
