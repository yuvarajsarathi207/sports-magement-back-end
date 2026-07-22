<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SettingsController extends Controller
{
    public function publicIndex()
    {
        return response()->json(AppSetting::publicSettings());
    }

    public function adminIndex()
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(AppSetting::publicSettings());
    }

    public function adminUpdate(Request $request)
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'feature_mode' => 'required|in:shop,tournaments,all',
            'app_name' => 'nullable|string|max:100',
        ]);

        AppSetting::setValue('feature_mode', $data['feature_mode']);
        if (array_key_exists('app_name', $data) && $data['app_name'] !== null) {
            AppSetting::setValue('app_name', $data['app_name']);
        }

        return response()->json([
            'message' => 'Settings updated',
            'settings' => AppSetting::publicSettings(),
        ]);
    }
}
