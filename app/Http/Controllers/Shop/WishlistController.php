<?php

namespace App\Http\Controllers\Shop;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\Request;

class WishlistController extends ShopController
{
    public function index(Request $request)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $items = Wishlist::with('product.images', 'product.category')
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        Product::active()->findOrFail($data['product_id']);

        $item = Wishlist::firstOrCreate([
            'user_id' => $user->id,
            'product_id' => $data['product_id'],
        ]);

        return response()->json($item->load('product.images'), 201);
    }

    public function destroy(Request $request, $id)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        Wishlist::where('user_id', $user->id)->where('id', $id)->delete();

        return response()->json(['message' => 'Removed from wishlist']);
    }

    public function moveToCart(Request $request, $id)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $wish = Wishlist::where('user_id', $user->id)->findOrFail($id);
        $product = Product::active()->findOrFail($wish->product_id);

        $cart = Cart::firstOrCreate(['user_id' => $user->id]);
        $item = CartItem::firstOrNew([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
        ]);
        $item->quantity = ($item->exists ? $item->quantity : 0) + 1;
        $item->saved_for_later = false;
        $item->save();

        $wish->delete();

        return response()->json(['message' => 'Moved to cart']);
    }
}
