<?php

namespace App\Http\Controllers\Shop;

use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends ShopController
{
    public function index(Request $request)
    {
        $query = ProductCategory::query()->ordered();

        if ($request->boolean('active_only', true) && !$request->user()?->isAdmin()) {
            $query->active();
        }

        return response()->json($query->withCount(['products' => fn ($q) => $q->active()])->get());
    }

    public function show($id)
    {
        $category = ProductCategory::withCount(['products' => fn ($q) => $q->active()])->findOrFail($id);

        if (!$category->is_active && !auth()->user()?->isAdmin()) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        return response()->json($category);
    }

    public function store(Request $request)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:product_categories,slug',
            'icon' => 'nullable|string|max:255',
            'banner_image' => 'nullable|string|max:500',
            'is_active' => 'boolean',
            'display_order' => 'integer|min:0',
        ]);

        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $category = ProductCategory::create($data);

        return response()->json($category, 201);
    }

    public function update(Request $request, $id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $category = ProductCategory::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'nullable|string|max:255|unique:product_categories,slug,' . $category->id,
            'icon' => 'nullable|string|max:255',
            'banner_image' => 'nullable|string|max:500',
            'is_active' => 'boolean',
            'display_order' => 'integer|min:0',
        ]);

        $category->update($data);

        return response()->json($category->fresh());
    }

    public function destroy($id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $category = ProductCategory::findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Category deleted']);
    }

    public function toggle($id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $category = ProductCategory::findOrFail($id);
        $category->update(['is_active' => !$category->is_active]);

        return response()->json($category);
    }
}
