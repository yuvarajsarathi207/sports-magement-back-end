<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ShopController extends Controller
{
    protected function shopUser(): User|JsonResponse
    {
        $user = Auth::user();
        if (!$user || !$user->canShop()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $user;
    }

    protected function adminUser(): User|JsonResponse
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $user;
    }
}
