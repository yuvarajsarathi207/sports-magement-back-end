<?php

namespace Database\Seeders;

use App\Models\Banner;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ShopSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Sports Gear', 'icon' => '⚽', 'display_order' => 1],
            ['name' => 'Apparel', 'icon' => '👕', 'display_order' => 2],
            ['name' => 'Footwear', 'icon' => '👟', 'display_order' => 3],
            ['name' => 'Accessories', 'icon' => '🎒', 'display_order' => 4],
            ['name' => 'Nutrition', 'icon' => '🥤', 'display_order' => 5],
        ];

        $categoryModels = [];
        foreach ($categories as $cat) {
            $categoryModels[] = ProductCategory::updateOrCreate(
                ['slug' => Str::slug($cat['name'])],
                array_merge($cat, ['is_active' => true, 'slug' => Str::slug($cat['name'])])
            );
        }

        $products = [
            ['name' => 'Pro Match Football', 'sku' => 'KP-FB-001', 'price' => 1299, 'discount' => 10, 'is_featured' => true, 'is_popular' => true, 'brand' => 'KeepPlay', 'cat' => 0],
            ['name' => 'Tournament Jersey', 'sku' => 'KP-AP-001', 'price' => 899, 'discount' => 15, 'is_featured' => true, 'is_new' => true, 'brand' => 'ArenaWear', 'cat' => 1],
            ['name' => 'Court Running Shoes', 'sku' => 'KP-FW-001', 'price' => 2499, 'discount' => 20, 'is_popular' => true, 'is_flash_deal' => true, 'flash_deal_price' => 1799, 'brand' => 'SprintX', 'cat' => 2],
            ['name' => 'Gym Duffel Bag', 'sku' => 'KP-AC-001', 'price' => 1499, 'discount' => 5, 'is_new' => true, 'brand' => 'CarryFit', 'cat' => 3],
            ['name' => 'Protein Shake Mix', 'sku' => 'KP-NU-001', 'price' => 1999, 'discount' => 0, 'is_featured' => true, 'brand' => 'FuelUp', 'cat' => 4],
            ['name' => 'Badminton Racket Pro', 'sku' => 'KP-SG-002', 'price' => 2199, 'discount' => 12, 'is_popular' => true, 'brand' => 'SmashPro', 'cat' => 0],
            ['name' => 'Compression Shorts', 'sku' => 'KP-AP-002', 'price' => 699, 'discount' => 8, 'is_flash_deal' => true, 'flash_deal_price' => 499, 'brand' => 'ArenaWear', 'cat' => 1],
            ['name' => 'Training Cap', 'sku' => 'KP-AC-002', 'price' => 399, 'discount' => 0, 'is_new' => true, 'brand' => 'KeepPlay', 'cat' => 3],
        ];

        foreach ($products as $row) {
            $catIndex = $row['cat'];
            unset($row['cat']);
            $flash = $row['flash_deal_price'] ?? null;
            unset($row['flash_deal_price']);

            $product = Product::updateOrCreate(
                ['sku' => $row['sku']],
                array_merge($row, [
                    'slug' => Str::slug($row['name']),
                    'description' => $row['name'] . ' — premium quality gear for tournaments and training.',
                    'category_id' => $categoryModels[$catIndex]->id,
                    'stock' => 50,
                    'rating' => round(mt_rand(35, 50) / 10, 1),
                    'rating_count' => mt_rand(5, 120),
                    'status' => 'active',
                    'flash_deal_price' => $flash,
                    'flash_deal_ends_at' => !empty($row['is_flash_deal']) ? now()->addDays(3) : null,
                ])
            );

            ProductImage::updateOrCreate(
                ['product_id' => $product->id, 'is_primary' => true],
                [
                    'path' => 'https://picsum.photos/seed/' . $product->sku . '/600/600',
                    'display_order' => 0,
                ]
            );
        }

        $banners = [
            ['title' => 'Gear Up for Match Day', 'subtitle' => 'Up to 30% off sports essentials', 'type' => 'home', 'image' => 'https://picsum.photos/seed/banner1/1200/500', 'redirect_link' => '/app/shop/products?featured=1'],
            ['title' => 'Flash Deals Live', 'subtitle' => 'Limited time offers', 'type' => 'offer', 'image' => 'https://picsum.photos/seed/banner2/1200/500', 'redirect_link' => '/app/shop/products?flash_deal=1'],
            ['title' => 'Join Upcoming Tournaments', 'subtitle' => 'Book your spot today', 'type' => 'tournament', 'image' => 'https://picsum.photos/seed/banner3/1200/500', 'redirect_link' => '/app/tournaments'],
            ['title' => 'New Season Collection', 'subtitle' => 'Fresh drops every week', 'type' => 'promotional', 'image' => 'https://picsum.photos/seed/banner4/1200/500', 'redirect_link' => '/app/shop/products?new=1'],
        ];

        foreach ($banners as $i => $banner) {
            Banner::updateOrCreate(
                ['title' => $banner['title'], 'type' => $banner['type']],
                array_merge($banner, ['display_order' => $i + 1, 'is_active' => true])
            );
        }
    }
}
