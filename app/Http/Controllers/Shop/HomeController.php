<?php

namespace App\Http\Controllers\Shop;

use App\Models\Banner;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Tournament;
use Illuminate\Http\Request;

class HomeController extends ShopController
{
    public function index(Request $request)
    {
        $banners = Banner::active()->ofType($request->get('banner_type', 'home'))->ordered()->get();
        $offerBanners = Banner::active()->ofType('offer')->ordered()->limit(5)->get();
        $tournamentBanners = Banner::active()->ofType('tournament')->ordered()->limit(5)->get();

        $categories = ProductCategory::active()->ordered()->limit(12)->get();

        $base = Product::active()->with(['images', 'category']);

        return response()->json([
            'banners' => $banners,
            'offer_banners' => $offerBanners,
            'tournament_banners' => $tournamentBanners,
            'categories' => $categories,
            'featured_products' => (clone $base)->where('is_featured', true)->latest()->limit(10)->get(),
            'popular_products' => (clone $base)->where('is_popular', true)->orderByDesc('rating')->limit(10)->get(),
            'new_arrivals' => (clone $base)->where('is_new', true)->latest()->limit(10)->get(),
            'flash_deals' => (clone $base)->where('is_flash_deal', true)->limit(10)->get(),
            'tournament_promo' => Tournament::publishedForPlayers()
                ->with('sportsCategory')
                ->latest()
                ->limit(3)
                ->get(['id', 'team_name', 'sports_category_id', 'start_date', 'entry_fee', 'city', 'state']),
        ]);
    }
}
