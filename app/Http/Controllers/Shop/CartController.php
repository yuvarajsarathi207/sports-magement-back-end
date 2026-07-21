<?php

namespace App\Http\Controllers\Shop;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\Shop\CartCalculator;
use Illuminate\Http\Request;

class CartController extends ShopController
{
    public function __construct(private CartCalculator $calculator)
    {
    }

    public function show(Request $request)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $cart = $this->getOrCreateCart($user->id);
        $summary = $this->calculator->summarize($cart);
        $saved = $cart->savedItems()->with('product.images')->get();

        return response()->json([
            'cart_id' => $cart->id,
            'summary' => $summary,
            'saved_for_later' => $saved,
        ]);
    }

    public function store(Request $request)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'integer|min:1|max:99',
        ]);

        $product = Product::active()->findOrFail($data['product_id']);
        $qty = $data['quantity'] ?? 1;

        if ($product->stock < $qty) {
            return response()->json(['message' => 'Insufficient stock'], 422);
        }

        $cart = $this->getOrCreateCart($user->id);
        $item = CartItem::firstOrNew([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
        ]);

        $item->quantity = ($item->exists ? $item->quantity : 0) + $qty;
        $item->saved_for_later = false;
        $item->save();

        return $this->show($request);
    }

    public function update(Request $request, $id)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $data = $request->validate([
            'quantity' => 'required|integer|min:1|max:99',
        ]);

        $cart = $this->getOrCreateCart($user->id);
        $item = CartItem::where('cart_id', $cart->id)->findOrFail($id);

        if ($item->product->stock < $data['quantity']) {
            return response()->json(['message' => 'Insufficient stock'], 422);
        }

        $item->update(['quantity' => $data['quantity']]);

        return $this->show($request);
    }

    public function destroy(Request $request, $id)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $cart = $this->getOrCreateCart($user->id);
        CartItem::where('cart_id', $cart->id)->where('id', $id)->delete();

        return $this->show($request);
    }

    public function saveForLater(Request $request, $id)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $cart = $this->getOrCreateCart($user->id);
        $item = CartItem::where('cart_id', $cart->id)->findOrFail($id);
        $item->update(['saved_for_later' => true]);

        return $this->show($request);
    }

    public function moveToCart(Request $request, $id)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $cart = $this->getOrCreateCart($user->id);
        $item = CartItem::where('cart_id', $cart->id)->findOrFail($id);
        $item->update(['saved_for_later' => false]);

        return $this->show($request);
    }

    private function getOrCreateCart(int $userId): Cart
    {
        return Cart::firstOrCreate(['user_id' => $userId]);
    }
}
