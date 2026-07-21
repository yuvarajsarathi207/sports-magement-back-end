<?php

namespace App\Http\Controllers\Shop;

use App\Models\Banner;
use Illuminate\Http\Request;

class BannerController extends ShopController
{
    public function index(Request $request)
    {
        $query = Banner::query()->ordered();

        if (!$request->user()?->isAdmin()) {
            $query->active();
        } elseif ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('type')) {
            $query->ofType($request->type);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'image' => 'required|string|max:500',
            'redirect_link' => 'nullable|string|max:500',
            'type' => 'required|in:home,offer,tournament,promotional',
            'display_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('image_file')) {
            $data['image'] = $request->file('image_file')->store('banners', 'public');
        }

        $banner = Banner::create($data);

        return response()->json($banner, 201);
    }

    public function update(Request $request, $id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $banner = Banner::findOrFail($id);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'image' => 'sometimes|string|max:500',
            'redirect_link' => 'nullable|string|max:500',
            'type' => 'sometimes|in:home,offer,tournament,promotional',
            'display_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('image_file')) {
            $data['image'] = $request->file('image_file')->store('banners', 'public');
        }

        $banner->update($data);

        return response()->json($banner->fresh());
    }

    public function destroy($id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        Banner::findOrFail($id)->delete();

        return response()->json(['message' => 'Banner deleted']);
    }

    public function toggle($id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $banner = Banner::findOrFail($id);
        $banner->update(['is_active' => !$banner->is_active]);

        return response()->json($banner);
    }
}
