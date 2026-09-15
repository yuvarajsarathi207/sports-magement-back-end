<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\UserAddress;
use App\Models\PlatformSetting;
use App\Services\Commerce\CartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

class CartController extends Controller
{
    public function __construct(protected CartService $cartService)
    {
        $this->middleware('auth:sanctum');
    }

    public function show()
    {
        $this->ensureShopper();

        return response()->json($this->cartService->getCart(Auth::user()));
    }

    public function addItem(Request $request)
    {
        $this->ensureShopper();
        $data = $request->validate([
            'product_variant_id' => 'required|integer|exists:product_variants,id',
            'quantity' => 'required|integer|min:1|max:99',
        ]);

        try {
            $cart = $this->cartService->addItem(Auth::user(), $data['product_variant_id'], $data['quantity']);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($cart);
    }

    public function updateItem(Request $request, int $id)
    {
        $this->ensureShopper();
        $data = $request->validate([
            'quantity' => 'required|integer|min:0|max:99',
        ]);

        try {
            $cart = $this->cartService->updateItem(Auth::user(), $id, $data['quantity']);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($cart);
    }

    public function removeItem(int $id)
    {
        $this->ensureShopper();

        return response()->json($this->cartService->removeItem(Auth::user(), $id));
    }

    public function addresses()
    {
        $this->ensureShopper();
        $addresses = UserAddress::where('user_id', Auth::id())->latest('id')->get();

        return response()->json(['addresses' => $addresses]);
    }

    public function storeAddress(Request $request)
    {
        $this->ensureShopper();
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'mobile' => 'required|string|max:20',
            'address_line1' => 'required|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'country' => 'nullable|string|max:100',
            'pincode' => 'required|string|max:12',
            'address_type' => 'nullable|in:HOME,WORK,OTHER',
            'is_default' => 'nullable|boolean',
        ]);

        $user = Auth::user();
        if (!empty($data['is_default'])) {
            UserAddress::where('user_id', $user->id)->update(['is_default' => false]);
        }

        $address = UserAddress::create([
            ...$data,
            'user_id' => $user->id,
            'country' => $data['country'] ?? 'India',
            'address_type' => $data['address_type'] ?? UserAddress::TYPE_HOME,
            'is_default' => $data['is_default'] ?? false,
        ]);

        return response()->json(['address' => $address], 201);
    }

    public function updateAddress(Request $request, int $id)
    {
        $this->ensureShopper();
        $address = UserAddress::where('user_id', Auth::id())->findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:120',
            'mobile' => 'sometimes|string|max:20',
            'address_line1' => 'sometimes|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'sometimes|string|max:100',
            'state' => 'sometimes|string|max:100',
            'country' => 'nullable|string|max:100',
            'pincode' => 'sometimes|string|max:12',
            'address_type' => 'nullable|in:HOME,WORK,OTHER',
            'is_default' => 'nullable|boolean',
        ]);

        if (!empty($data['is_default'])) {
            UserAddress::where('user_id', Auth::id())->update(['is_default' => false]);
        }

        $address->update($data);

        return response()->json(['address' => $address->fresh()]);
    }

    public function deleteAddress(int $id)
    {
        $this->ensureShopper();
        UserAddress::where('user_id', Auth::id())->whereKey($id)->delete();

        return response()->json(['message' => 'Address deleted']);
    }

    protected function ensureShopper(): void
    {
        if (!PlatformSetting::commerceEnabled()) {
            abort(503, 'Commerce is currently disabled.');
        }
        $user = Auth::user();
        if (!$user || (!$user->isPlayer() && !$user->isOrganizer())) {
            abort(403, 'Unauthorized');
        }
    }
}
