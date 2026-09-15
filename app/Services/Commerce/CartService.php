<?php

namespace App\Services\Commerce;

use App\Models\Commerce\Cart;
use App\Models\Commerce\CartItem;
use App\Models\Commerce\Product;
use App\Models\Commerce\ProductVariant;
use App\Models\User;
use RuntimeException;

class CartService
{
    public function getOrCreateCart(User $user): Cart
    {
        return Cart::firstOrCreate(['user_id' => $user->id]);
    }

    public function getCart(User $user): array
    {
        $cart = $this->getOrCreateCart($user);
        $cart->load(['items.product.images', 'items.variant']);

        $items = [];
        $subtotal = 0;
        $issues = [];

        foreach ($cart->items as $item) {
            $variant = $item->variant;
            $product = $item->product;
            $currentPrice = $variant?->effectivePrice() ?? 0;
            $line = [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_variant_id' => $item->product_variant_id,
                'product_name' => $product?->name,
                'variant_name' => $variant?->displayName(),
                'sku' => $variant?->sku,
                'quantity' => $item->quantity,
                'unit_price_snapshot' => (float) $item->unit_price_snapshot,
                'current_unit_price' => $currentPrice,
                'line_total' => round($currentPrice * $item->quantity, 2),
                'available_quantity' => $variant?->available_quantity ?? 0,
                'product_status' => $product?->status,
                'variant_status' => $variant?->status,
                'image' => $product?->images?->firstWhere('is_primary', true)?->url
                    ?? $product?->images?->first()?->url,
                'valid' => true,
            ];

            if (!$product || !$product->isActive() || !$variant || !$variant->isSellable() || $item->quantity > $variant->available_quantity) {
                $line['valid'] = false;
                $issues[] = [
                    'cart_item_id' => $item->id,
                    'message' => 'Item is unavailable or stock changed.',
                ];
            }

            $subtotal += $line['line_total'];
            $items[] = $line;
        }

        return [
            'cart_id' => $cart->id,
            'items' => $items,
            'subtotal' => round($subtotal, 2),
            'item_count' => array_sum(array_column($items, 'quantity')),
            'issues' => $issues,
        ];
    }

    public function addItem(User $user, int $variantId, int $quantity): array
    {
        if ($quantity <= 0) {
            throw new RuntimeException('Quantity must be at least 1.');
        }

        $variant = ProductVariant::with('product')->findOrFail($variantId);
        $this->assertSellable($variant, $quantity);

        $cart = $this->getOrCreateCart($user);
        $item = CartItem::where('cart_id', $cart->id)
            ->where('product_variant_id', $variant->id)
            ->first();

        if ($item) {
            $newQty = $item->quantity + $quantity;
            $this->assertSellable($variant, $newQty);
            $item->update([
                'quantity' => $newQty,
                'unit_price_snapshot' => $variant->effectivePrice(),
            ]);
        } else {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $variant->product_id,
                'product_variant_id' => $variant->id,
                'quantity' => $quantity,
                'unit_price_snapshot' => $variant->effectivePrice(),
            ]);
        }

        return $this->getCart($user);
    }

    public function updateItem(User $user, int $itemId, int $quantity): array
    {
        $cart = $this->getOrCreateCart($user);
        $item = CartItem::where('cart_id', $cart->id)->whereKey($itemId)->firstOrFail();

        if ($quantity <= 0) {
            $item->delete();

            return $this->getCart($user);
        }

        $variant = ProductVariant::with('product')->findOrFail($item->product_variant_id);
        $this->assertSellable($variant, $quantity);

        $item->update([
            'quantity' => $quantity,
            'unit_price_snapshot' => $variant->effectivePrice(),
        ]);

        return $this->getCart($user);
    }

    public function removeItem(User $user, int $itemId): array
    {
        $cart = $this->getOrCreateCart($user);
        CartItem::where('cart_id', $cart->id)->whereKey($itemId)->delete();

        return $this->getCart($user);
    }

    public function clear(User $user): void
    {
        $cart = $this->getOrCreateCart($user);
        CartItem::where('cart_id', $cart->id)->delete();
    }

    protected function assertSellable(ProductVariant $variant, int $quantity): void
    {
        $product = $variant->product;
        if (!$product || $product->status !== Product::STATUS_ACTIVE) {
            throw new RuntimeException('Product is not available.');
        }
        if ($variant->status !== ProductVariant::STATUS_ACTIVE) {
            throw new RuntimeException('Variant is not available.');
        }
        if ((int) $variant->available_quantity < $quantity) {
            throw new RuntimeException('Insufficient stock.');
        }
    }
}
