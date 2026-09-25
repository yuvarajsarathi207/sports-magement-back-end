<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Platform\Module;
use App\Models\PlatformSetting;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load(['roles.permissions', 'profile', 'turfOwner']);

        $permissions = $user->permissionNames();
        $modules = $this->availableModules($user, $permissions);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'mobile' => $user->mobile,
            'role' => $user->role,
            'roles' => $user->roles->pluck('name'),
            'permissions' => $permissions,
            'modules' => $modules,
            'profile' => $user->profile,
            'turf_owner' => $user->turfOwner,
        ]);
    }

    public function modules(Request $request)
    {
        $user = $request->user()->load('roles.permissions');
        $permissions = $user->permissionNames();

        return response()->json([
            'modules' => $this->availableModules($user, $permissions),
        ]);
    }

    public function allModules()
    {
        return response()->json([
            'modules' => Module::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    protected function availableModules($user, array $permissions): array
    {
        $modules = Module::where('is_active', true)->orderBy('sort_order')->get();

        // Feature flags
        $commerceOn = PlatformSetting::commerceEnabled();
        $turfOn = (string) PlatformSetting::getValue('turf_enabled', '1') === '1';

        return $modules
            ->filter(function (Module $module) use ($permissions, $commerceOn, $turfOn) {
                if ($module->code === 'shop' && !$commerceOn) {
                    return false;
                }
                if ($module->code === 'turf' && !$turfOn) {
                    return false;
                }

                if (in_array('*', $permissions, true)) {
                    return true;
                }

                $required = $module->required_permission ?: ('module.' . $module->code . '.access');

                return in_array($required, $permissions, true);
            })
            ->values()
            ->map(fn (Module $m) => [
                'code' => $m->code,
                'name' => $m->name,
                'icon' => $m->icon,
                'route_prefix' => $m->route_prefix,
                'sort_order' => $m->sort_order,
            ])
            ->all();
    }
}
