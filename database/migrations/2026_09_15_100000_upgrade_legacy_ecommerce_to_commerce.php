<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Upgrades the orphaned July ecommerce schema (present in DB, migrations missing from repo)
 * into the modular Sports Commerce schema with variants + inventory locking.
 */
return new class extends Migration
{
    public function up(): void
    {
        $legacyMap = [
            'product_images' => 'legacy_product_images',
            'cart_items' => 'legacy_cart_items',
            'carts' => 'legacy_carts',
            'order_items' => 'legacy_order_items',
            'order_payments' => 'legacy_order_payments',
            'order_status_histories' => 'legacy_order_status_histories',
            'orders' => 'legacy_orders',
            'wishlists' => 'legacy_wishlists',
            'products' => 'legacy_products',
            'product_categories' => 'legacy_product_categories',
            'addresses' => 'legacy_addresses',
            'brands' => 'legacy_brands',
        ];

        foreach ($legacyMap as $from => $to) {
            if (Schema::hasTable($from) && !Schema::hasTable($to)) {
                Schema::rename($from, $to);
            }
        }

        if (!Schema::hasTable('brands')) {
            Schema::create('brands', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->string('logo_url')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('product_categories')) {
            Schema::create('product_categories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('parent_id')->nullable()->constrained('product_categories')->nullOnDelete();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->string('image_url')->nullable();
                $table->integer('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();
                $table->index(['parent_id', 'is_active']);
            });
        }

        if (!Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->foreignId('product_category_id')->nullable()->constrained('product_categories')->nullOnDelete();
                $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();
                $table->foreignId('sports_category_id')->nullable()->constrained('sports_categories')->nullOnDelete();
                $table->string('sku')->nullable()->unique();
                $table->decimal('base_price', 12, 2)->default(0);
                $table->decimal('discount_price', 12, 2)->nullable();
                $table->decimal('tax_percent', 5, 2)->default(0);
                $table->string('status')->default('draft');
                $table->decimal('weight', 10, 3)->nullable();
                $table->string('dimensions')->nullable();
                $table->boolean('has_variants')->default(false);
                $table->timestamps();
                $table->softDeletes();
                $table->index(['status', 'product_category_id']);
                $table->index(['sports_category_id', 'status']);
            });
        }

        if (!Schema::hasTable('product_variants')) {
            Schema::create('product_variants', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->string('sku')->unique();
                $table->string('name')->nullable();
                $table->string('size')->nullable();
                $table->string('color')->nullable();
                $table->decimal('price', 12, 2);
                $table->decimal('discount_price', 12, 2)->nullable();
                $table->decimal('tax_percent', 5, 2)->nullable();
                $table->decimal('weight', 10, 3)->nullable();
                $table->string('dimensions')->nullable();
                $table->string('status')->default('active');
                $table->unsignedInteger('available_quantity')->default(0);
                $table->unsignedInteger('reserved_quantity')->default(0);
                $table->unsignedInteger('sold_quantity')->default(0);
                $table->unsignedInteger('returned_quantity')->default(0);
                $table->unsignedInteger('damaged_quantity')->default(0);
                $table->timestamps();
                $table->softDeletes();
                $table->index(['product_id', 'status']);
            });
        }

        if (Schema::hasTable('product_images') && DB::table('product_images')->count() === 0) {
            Schema::drop('product_images');
        }

        if (!Schema::hasTable('product_images')) {
            Schema::create('product_images', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('product_id');
                $table->unsignedBigInteger('product_variant_id')->nullable();
                $table->string('url');
                $table->string('alt_text')->nullable();
                $table->integer('sort_order')->default(0);
                $table->boolean('is_primary')->default(false);
                $table->timestamps();
                $table->index(['product_id', 'sort_order']);
            });

            // Unique constraint names avoid InnoDB leftover FK name collisions from legacy tables
            Schema::table('product_images', function (Blueprint $table) {
                $table->foreign('product_id', 'c_product_images_product_fk')
                    ->references('id')->on('products')->cascadeOnDelete();
                $table->foreign('product_variant_id', 'c_product_images_variant_fk')
                    ->references('id')->on('product_variants')->nullOnDelete();
            });
        }

        if (!Schema::hasTable('inventory_transactions')) {
            Schema::create('inventory_transactions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('product_variant_id');
                $table->string('type');
                $table->integer('quantity');
                $table->integer('available_before')->default(0);
                $table->integer('available_after')->default(0);
                $table->integer('reserved_before')->default(0);
                $table->integer('reserved_after')->default(0);
                $table->string('reference_type')->nullable();
                $table->unsignedBigInteger('reference_id')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->text('notes')->nullable();
                $table->string('idempotency_key')->nullable()->unique();
                $table->timestamps();
                $table->index(['product_variant_id', 'created_at']);
            });
        }

        if (!Schema::hasTable('user_addresses')) {
            Schema::create('user_addresses', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('name');
                $table->string('mobile', 20);
                $table->string('address_line1');
                $table->string('address_line2')->nullable();
                $table->string('city');
                $table->string('state');
                $table->string('country')->default('India');
                $table->string('pincode', 12);
                $table->string('address_type')->default('HOME');
                $table->boolean('is_default')->default(false);
                $table->timestamps();
                $table->softDeletes();
                $table->index(['user_id', 'is_default']);
            });
        }

        if (Schema::hasTable('carts') && !Schema::hasColumn('carts', 'user_id')) {
            Schema::drop('carts');
        }
        // Drop incomplete carts from failed FK attempt
        if (Schema::hasTable('carts')) {
            try {
                $cols = Schema::getColumnListing('carts');
                if (!in_array('user_id', $cols, true)) {
                    Schema::drop('carts');
                }
            } catch (\Throwable $e) {
                Schema::dropIfExists('carts');
            }
        }

        if (!Schema::hasTable('carts')) {
            Schema::create('carts', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->unique();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('cart_items')) {
            Schema::create('cart_items', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('cart_id');
                $table->unsignedBigInteger('product_id');
                $table->unsignedBigInteger('product_variant_id');
                $table->unsignedInteger('quantity');
                $table->decimal('unit_price_snapshot', 12, 2);
                $table->timestamps();
                $table->unique(['cart_id', 'product_variant_id']);
            });
        }

        if (!Schema::hasTable('coupons')) {
            Schema::create('coupons', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->string('discount_type')->default('fixed');
                $table->decimal('discount_value', 12, 2);
                $table->decimal('min_order_amount', 12, 2)->nullable();
                $table->decimal('max_discount_amount', 12, 2)->nullable();
                $table->unsignedInteger('usage_limit')->nullable();
                $table->unsignedInteger('used_count')->default(0);
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('orders')) {
            Schema::create('orders', function (Blueprint $table) {
                $table->id();
                $table->string('order_number')->unique();
                $table->unsignedBigInteger('user_id');
                $table->string('status')->default('CREATED');
                $table->string('payment_status')->default('PENDING');
                $table->string('payment_method')->nullable();
                $table->decimal('subtotal', 12, 2)->default(0);
                $table->decimal('tax_amount', 12, 2)->default(0);
                $table->decimal('discount_amount', 12, 2)->default(0);
                $table->decimal('coupon_discount', 12, 2)->default(0);
                $table->decimal('delivery_charge', 12, 2)->default(0);
                $table->decimal('total_amount', 12, 2)->default(0);
                $table->unsignedBigInteger('coupon_id')->nullable();
                $table->string('coupon_code')->nullable();
                $table->json('shipping_address')->nullable();
                $table->json('billing_address')->nullable();
                $table->unsignedBigInteger('shipping_address_id')->nullable();
                $table->text('notes')->nullable();
                $table->string('idempotency_key')->nullable()->unique();
                $table->timestamp('cancelled_at')->nullable();
                $table->string('cancellation_reason')->nullable();
                $table->timestamps();
                $table->softDeletes();
                $table->index(['user_id', 'status']);
            });
        }

        if (!Schema::hasTable('order_items')) {
            Schema::create('order_items', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('order_id');
                $table->unsignedBigInteger('product_id');
                $table->unsignedBigInteger('product_variant_id');
                $table->string('product_name');
                $table->string('variant_name')->nullable();
                $table->string('sku');
                $table->string('size')->nullable();
                $table->string('color')->nullable();
                $table->unsignedInteger('quantity');
                $table->decimal('unit_price', 12, 2);
                $table->decimal('discount_amount', 12, 2)->default(0);
                $table->decimal('tax_amount', 12, 2)->default(0);
                $table->decimal('line_total', 12, 2);
                $table->timestamps();
                $table->index('order_id');
            });
        }

        if (!Schema::hasTable('commerce_payments')) {
            Schema::create('commerce_payments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('order_id');
                $table->unsignedBigInteger('user_id');
                $table->string('provider')->default('phonepe');
                $table->string('status')->default('INITIATED');
                $table->decimal('amount', 12, 2);
                $table->string('currency', 3)->default('INR');
                $table->string('merchant_order_id')->nullable()->unique();
                $table->string('transaction_id')->nullable()->unique();
                $table->string('idempotency_key')->nullable()->unique();
                $table->json('provider_payload')->nullable();
                $table->json('provider_response')->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->timestamps();
                $table->index(['order_id', 'status']);
            });
        }

        if (!Schema::hasTable('shipments')) {
            Schema::create('shipments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('order_id');
                $table->string('provider')->default('manual');
                $table->string('shipment_id')->nullable();
                $table->string('tracking_number')->nullable();
                $table->string('status')->default('PENDING');
                $table->decimal('delivery_charge', 12, 2)->default(0);
                $table->timestamp('estimated_delivery_at')->nullable();
                $table->timestamp('shipped_at')->nullable();
                $table->timestamp('delivered_at')->nullable();
                $table->json('provider_payload')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('coupon_usages')) {
            Schema::create('coupon_usages', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('coupon_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('order_id');
                $table->decimal('discount_amount', 12, 2);
                $table->timestamps();
                $table->unique(['coupon_id', 'order_id']);
            });
        }

        if (!Schema::hasTable('order_returns')) {
            Schema::create('order_returns', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('order_id');
                $table->unsignedBigInteger('user_id');
                $table->string('status')->default('REQUESTED');
                $table->text('reason')->nullable();
                $table->json('items')->nullable();
                $table->timestamp('resolved_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('refunds')) {
            Schema::create('refunds', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('order_id');
                $table->unsignedBigInteger('commerce_payment_id')->nullable();
                $table->unsignedBigInteger('order_return_id')->nullable();
                $table->decimal('amount', 12, 2);
                $table->string('status')->default('INITIATED');
                $table->string('provider_refund_id')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('product_views')) {
            Schema::create('product_views', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('product_id');
                $table->timestamp('viewed_at');
                $table->timestamps();
                $table->index(['user_id', 'viewed_at']);
            });
        }

        if (!Schema::hasTable('inventory_reservations')) {
            Schema::create('inventory_reservations', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('product_variant_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('order_id')->nullable();
                $table->unsignedInteger('quantity');
                $table->string('status')->default('ACTIVE');
                $table->timestamp('expires_at');
                $table->string('idempotency_key')->nullable()->unique();
                $table->timestamps();
                $table->index(['status', 'expires_at']);
            });
        }

        $this->migrateLegacyCatalog();
    }

    protected function migrateLegacyCatalog(): void
    {
        if (!Schema::hasTable('legacy_product_categories') || !Schema::hasTable('product_categories')) {
            return;
        }

        if (DB::table('product_categories')->count() > 0) {
            return;
        }

        $categoryMap = [];
        foreach (DB::table('legacy_product_categories')->orderBy('id')->get() as $cat) {
            $newId = DB::table('product_categories')->insertGetId([
                'parent_id' => null,
                'name' => $cat->name,
                'slug' => $cat->slug ?: Str::slug($cat->name) . '-' . $cat->id,
                'description' => null,
                'image_url' => $cat->banner_image ?? null,
                'sort_order' => $cat->display_order ?? 0,
                'is_active' => (bool) ($cat->is_active ?? true),
                'created_at' => $cat->created_at,
                'updated_at' => $cat->updated_at,
            ]);
            $categoryMap[$cat->id] = $newId;
        }

        if (!Schema::hasTable('legacy_products')) {
            return;
        }

        foreach (DB::table('legacy_products')->orderBy('id')->get() as $p) {
            $status = match ($p->status ?? 'active') {
                'active', 'published' => 'active',
                'inactive', 'disabled' => 'inactive',
                default => 'active',
            };

            $productId = DB::table('products')->insertGetId([
                'name' => $p->name,
                'slug' => $p->slug ?: Str::slug($p->name) . '-' . $p->id,
                'description' => $p->description,
                'product_category_id' => $categoryMap[$p->category_id] ?? null,
                'brand_id' => null,
                'sports_category_id' => null,
                'sku' => $p->sku,
                'base_price' => $p->price ?? 0,
                'discount_price' => ($p->discount ?? null) ?: ($p->flash_deal_price ?? null),
                'tax_percent' => 0,
                'status' => $status,
                'weight' => null,
                'dimensions' => null,
                'has_variants' => false,
                'created_at' => $p->created_at,
                'updated_at' => $p->updated_at,
            ]);

            $price = (float) (($p->discount ?? 0) > 0 ? $p->discount : ($p->flash_deal_price ?: $p->price));
            $stock = max(0, (int) ($p->stock ?? 0));

            DB::table('product_variants')->insert([
                'product_id' => $productId,
                'sku' => $p->sku ?: ('LEGACY-' . $p->id),
                'name' => 'Default',
                'size' => null,
                'color' => null,
                'price' => $p->price ?? 0,
                'discount_price' => ($p->discount ?? null) ?: null,
                'tax_percent' => null,
                'status' => $stock > 0 ? 'active' : 'out_of_stock',
                'available_quantity' => $stock,
                'reserved_quantity' => 0,
                'sold_quantity' => 0,
                'returned_quantity' => 0,
                'damaged_quantity' => 0,
                'created_at' => $p->created_at,
                'updated_at' => $p->updated_at,
            ]);

            if (Schema::hasTable('legacy_product_images')) {
                $images = DB::table('legacy_product_images')->where('product_id', $p->id)->orderBy('display_order')->get();
                foreach ($images as $img) {
                    DB::table('product_images')->insert([
                        'product_id' => $productId,
                        'product_variant_id' => null,
                        'url' => $img->path,
                        'alt_text' => null,
                        'sort_order' => $img->display_order ?? 0,
                        'is_primary' => (bool) ($img->is_primary ?? false),
                        'created_at' => $img->created_at,
                        'updated_at' => $img->updated_at,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        // Non-destructive down: leave upgraded schema in place.
    }
};
