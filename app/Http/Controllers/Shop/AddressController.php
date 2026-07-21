<?php

namespace App\Http\Controllers\Shop;

use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends ShopController
{
    public function index(Request $request)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        return response()->json(
            Address::where('user_id', $user->id)->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $data = $this->validated($request);
        $data['user_id'] = $user->id;

        $address = DB::transaction(function () use ($data, $user) {
            if (!empty($data['is_default'])) {
                Address::where('user_id', $user->id)->update(['is_default' => false]);
            } elseif (!Address::where('user_id', $user->id)->exists()) {
                $data['is_default'] = true;
            }

            return Address::create($data);
        });

        return response()->json($address, 201);
    }

    public function update(Request $request, $id)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $address = Address::where('user_id', $user->id)->findOrFail($id);
        $data = $this->validated($request, true);

        DB::transaction(function () use ($address, $data, $user) {
            if (!empty($data['is_default'])) {
                Address::where('user_id', $user->id)->update(['is_default' => false]);
            }
            $address->update($data);
        });

        return response()->json($address->fresh());
    }

    public function destroy(Request $request, $id)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        Address::where('user_id', $user->id)->where('id', $id)->delete();

        return response()->json(['message' => 'Address deleted']);
    }

    public function setDefault(Request $request, $id)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $address = Address::where('user_id', $user->id)->findOrFail($id);

        DB::transaction(function () use ($address, $user) {
            Address::where('user_id', $user->id)->update(['is_default' => false]);
            $address->update(['is_default' => true]);
        });

        return response()->json($address->fresh());
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'full_name' => "{$req}|string|max:255",
            'mobile' => "{$req}|string|max:20",
            'house_number' => 'nullable|string|max:100',
            'street' => 'nullable|string|max:255',
            'area' => 'nullable|string|max:255',
            'landmark' => 'nullable|string|max:255',
            'city' => "{$req}|string|max:100",
            'district' => 'nullable|string|max:100',
            'state' => "{$req}|string|max:100",
            'country' => 'nullable|string|max:100',
            'postal_code' => "{$req}|string|max:20",
            'address_type' => 'nullable|in:home,work,other',
            'is_default' => 'boolean',
        ]);
    }
}
