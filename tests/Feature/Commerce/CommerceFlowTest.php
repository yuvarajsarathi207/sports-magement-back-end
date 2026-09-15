<?php

namespace Tests\Feature\Commerce;

use App\Models\Commerce\Product;
use App\Models\Commerce\ProductVariant;
use App\Models\Commerce\UserAddress;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\Commerce\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommerceFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        PlatformSetting::setValue(PlatformSetting::KEY_COMMERCE_ENABLED, '1');
        PlatformSetting::setValue(PlatformSetting::KEY_COMMERCE_COD_ENABLED, '1');
        PlatformSetting::setValue(PlatformSetting::KEY_COMMERCE_ONLINE_PAYMENT_ENABLED, '0');
        PlatformSetting::setValue(PlatformSetting::KEY_COMMERCE_DELIVERY_CHARGE, '49');
        PlatformSetting::setValue(PlatformSetting::KEY_COMMERCE_FREE_DELIVERY_THRESHOLD, '999');
        PlatformSetting::setValue(PlatformSetting::KEY_COMMERCE_RESERVATION_TTL_MINUTES, '15');
    }

    protected function createSellableProduct(int $stock = 5): array
    {
        $product = Product::create([
            'name' => 'Test Bat',
            'slug' => 'test-bat-' . uniqid(),
            'base_price' => 1000,
            'discount_price' => 900,
            'tax_percent' => 0,
            'status' => Product::STATUS_ACTIVE,
            'has_variants' => false,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'SKU-' . uniqid(),
            'name' => 'Default',
            'price' => 1000,
            'discount_price' => 900,
            'status' => ProductVariant::STATUS_ACTIVE,
            'available_quantity' => 0,
        ]);

        app(InventoryService::class)->stockIn($variant->id, $stock, null, 'seed');

        return [$product->fresh(), $variant->fresh()];
    }

    public function test_player_can_add_to_cart_and_checkout_cod(): void
    {
        $player = User::factory()->create(['role' => 'player']);
        [, $variant] = $this->createSellableProduct(3);

        $this->actingAs($player, 'sanctum')
            ->postJson('/api/commerce/cart/items', [
                'product_variant_id' => $variant->id,
                'quantity' => 1,
            ])
            ->assertOk();

        $address = UserAddress::create([
            'user_id' => $player->id,
            'name' => 'Player',
            'mobile' => '9999999999',
            'address_line1' => 'Line 1',
            'city' => 'Pune',
            'state' => 'Maharashtra',
            'pincode' => '411001',
            'address_type' => 'HOME',
        ]);

        $response = $this->actingAs($player, 'sanctum')
            ->postJson('/api/commerce/checkout', [
                'shipping_address_id' => $address->id,
                'payment_method' => 'cod',
                'idempotency_key' => 'test-cod-1',
            ]);

        $response->assertCreated();
        $this->assertEquals('CONFIRMED', $response->json('order.status'));
        $this->assertEquals(2, $variant->fresh()->available_quantity);
        $this->assertEquals(1, $variant->fresh()->sold_quantity);
    }

    public function test_inventory_prevents_negative_stock(): void
    {
        [, $variant] = $this->createSellableProduct(1);
        $inventory = app(InventoryService::class);

        $this->expectException(\RuntimeException::class);
        $inventory->stockOut($variant->id, 2);
    }

    public function test_concurrent_reservation_does_not_oversell(): void
    {
        [, $variant] = $this->createSellableProduct(1);
        $inventory = app(InventoryService::class);
        $userA = User::factory()->create(['role' => 'player']);
        $userB = User::factory()->create(['role' => 'player']);

        $inventory->reserve($variant->id, 1, $userA->id, null, 'a');

        $this->expectException(\RuntimeException::class);
        $inventory->reserve($variant->id, 1, $userB->id, null, 'b');
    }

    public function test_admin_can_create_product(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/commerce/products', [
                'name' => 'Football Shoes',
                'base_price' => 2500,
                'initial_stock' => 10,
                'status' => 'active',
            ])
            ->assertCreated()
            ->assertJsonPath('product.name', 'Football Shoes');
    }

    public function test_duplicate_checkout_idempotency(): void
    {
        $player = User::factory()->create(['role' => 'player']);
        [, $variant] = $this->createSellableProduct(5);

        $this->actingAs($player, 'sanctum')
            ->postJson('/api/commerce/cart/items', [
                'product_variant_id' => $variant->id,
                'quantity' => 1,
            ])->assertOk();

        $address = UserAddress::create([
            'user_id' => $player->id,
            'name' => 'Player',
            'mobile' => '9999999999',
            'address_line1' => 'Line 1',
            'city' => 'Pune',
            'state' => 'Maharashtra',
            'pincode' => '411001',
        ]);

        $first = $this->actingAs($player, 'sanctum')->postJson('/api/commerce/checkout', [
            'shipping_address_id' => $address->id,
            'payment_method' => 'cod',
            'idempotency_key' => 'same-key',
        ]);
        $first->assertCreated();

        // Cart cleared; second call with same key returns same order
        $second = $this->actingAs($player, 'sanctum')->postJson('/api/commerce/checkout', [
            'shipping_address_id' => $address->id,
            'payment_method' => 'cod',
            'idempotency_key' => 'same-key',
        ]);
        $second->assertCreated();
        $this->assertEquals($first->json('order.id'), $second->json('order.id'));
    }
}
