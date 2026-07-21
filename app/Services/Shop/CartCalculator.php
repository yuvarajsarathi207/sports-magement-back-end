<?php

namespace App\Services\Shop;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;

class CartCalculator
{
    public function summarize(Cart $cart): array
    {
        $items = $cart->activeItems()->with('product.images')->get();

        $productTotal = 0;
        $discount = 0;
        $lines = [];

        foreach ($items as $item) {
            /** @var CartItem $item */
            $product = $item->product;
            if (!$product || $product->status !== 'active') {
                continue;
            }

            $unit = (float) $product->price;
            $effective = (float) $product->effective_price;
            $lineDiscount = max(0, ($unit - $effective) * $item->quantity);
            $lineTotal = $effective * $item->quantity;

            $productTotal += $unit * $item->quantity;
            $discount += $lineDiscount;

            $lines[] = [
                'id' => $item->id,
                'product_id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'quantity' => $item->quantity,
                'unit_price' => $unit,
                'effective_price' => $effective,
                'line_discount' => round($lineDiscount, 2),
                'line_total' => round($lineTotal, 2),
                'image' => $product->primary_image_url,
                'stock' => $product->stock,
            ];
        }

        $subtotalAfterDiscount = max(0, $productTotal - $discount);
        $tax = round($subtotalAfterDiscount * config('shop.tax_rate', 0.05), 2);
        $shipping = $subtotalAfterDiscount >= config('shop.free_shipping_min', 999)
            ? 0
            : (float) config('shop.shipping_flat', 49);
        $grandTotal = round($subtotalAfterDiscount + $tax + $shipping, 2);

        return [
            'items' => $lines,
            'product_total' => round($productTotal, 2),
            'discount' => round($discount, 2),
            'tax' => $tax,
            'shipping' => $shipping,
            'grand_total' => $grandTotal,
            'item_count' => collect($lines)->sum('quantity'),
        ];
    }
}
