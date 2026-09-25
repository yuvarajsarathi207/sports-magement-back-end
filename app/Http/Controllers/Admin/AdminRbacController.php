<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Platform\Permission;
use App\Models\Platform\Role;
use App\Models\User;
use App\Services\Platform\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class AdminRbacController extends Controller
{
    public function __construct(private AuditLogger $audit)
    {
        $this->middleware('auth:sanctum');
    }

    protected function ensureAdmin(): void
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Unauthorized');
        }
    }

    public function overview()
    {
        $this->ensureAdmin();

        return response()->json([
            'roles' => Role::withCount(['users', 'permissions'])->with('permissions:id,name,display_name,module')->orderBy('name')->get(),
            'permissions' => Permission::orderBy('module')->orderBy('name')->get(),
            'users_summary' => [
                'total' => User::count(),
                'by_role' => User::query()
                    ->selectRaw('role, count(*) as total')
                    ->groupBy('role')
                    ->pluck('total', 'role'),
            ],
        ]);
    }

    public function listRoles()
    {
        $this->ensureAdmin();

        return response()->json([
            'roles' => Role::with('permissions')->withCount('users')->orderBy('name')->get(),
        ]);
    }

    public function storeRole(Request $request)
    {
        $this->ensureAdmin();
        $data = $request->validate([
            'name' => 'required|string|max:80|unique:roles,name|regex:/^[a-z0-9_]+$/',
            'display_name' => 'required|string|max:120',
            'description' => 'nullable|string|max:255',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        $role = Role::create([
            'name' => $data['name'],
            'display_name' => $data['display_name'],
            'description' => $data['description'] ?? null,
        ]);

        if (!empty($data['permission_ids'])) {
            $role->permissions()->sync($data['permission_ids']);
        }

        $this->audit->log('rbac.role.created', Auth::user(), $role, null, $role->load('permissions')->toArray(), $request);

        return response()->json(['role' => $role->load('permissions')->loadCount('users')], 201);
    }

    public function updateRole(Request $request, int $id)
    {
        $this->ensureAdmin();
        $role = Role::findOrFail($id);

        $data = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:80',
                'regex:/^[a-z0-9_]+$/',
                Rule::unique('roles', 'name')->ignore($role->id),
            ],
            'display_name' => 'sometimes|string|max:120',
            'description' => 'nullable|string|max:255',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        if ($role->name === 'platform_admin' && isset($data['name']) && $data['name'] !== 'platform_admin') {
            return response()->json(['message' => 'Cannot rename the platform_admin role.'], 422);
        }

        $before = $role->load('permissions')->toArray();
        $role->update(collect($data)->only(['name', 'display_name', 'description'])->filter(fn ($v) => $v !== null)->all());

        if (array_key_exists('permission_ids', $data)) {
            $role->permissions()->sync($data['permission_ids'] ?? []);
        }

        $this->audit->log('rbac.role.updated', Auth::user(), $role, $before, $role->fresh('permissions')->toArray(), $request);

        return response()->json(['role' => $role->fresh('permissions')->loadCount('users')]);
    }

    public function deleteRole(int $id)
    {
        $this->ensureAdmin();
        $role = Role::withCount('users')->findOrFail($id);

        if (in_array($role->name, ['platform_admin', 'player', 'organizer'], true)) {
            return response()->json(['message' => 'Core system roles cannot be deleted.'], 422);
        }

        if ($role->users_count > 0) {
            return response()->json(['message' => 'Detach users from this role before deleting.'], 422);
        }

        $this->audit->log('rbac.role.deleted', Auth::user(), $role, $role->toArray(), null, request());
        $role->permissions()->detach();
        $role->delete();

        return response()->json(['message' => 'Role deleted']);
    }

    public function listPermissions()
    {
        $this->ensureAdmin();

        return response()->json([
            'permissions' => Permission::orderBy('module')->orderBy('name')->get(),
        ]);
    }

    public function storePermission(Request $request)
    {
        $this->ensureAdmin();
        $data = $request->validate([
            'name' => 'required|string|max:120|unique:permissions,name|regex:/^[a-z0-9_.]+$/',
            'display_name' => 'required|string|max:160',
            'module' => 'nullable|string|max:60',
            'description' => 'nullable|string|max:255',
        ]);

        $permission = Permission::create($data);
        $this->audit->log('rbac.permission.created', Auth::user(), $permission, null, $permission->toArray(), $request);

        return response()->json(['permission' => $permission], 201);
    }

    public function updatePermission(Request $request, int $id)
    {
        $this->ensureAdmin();
        $permission = Permission::findOrFail($id);

        $data = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:120',
                'regex:/^[a-z0-9_.]+$/',
                Rule::unique('permissions', 'name')->ignore($permission->id),
            ],
            'display_name' => 'sometimes|string|max:160',
            'module' => 'nullable|string|max:60',
            'description' => 'nullable|string|max:255',
        ]);

        $before = $permission->toArray();
        $permission->update($data);
        $this->audit->log('rbac.permission.updated', Auth::user(), $permission, $before, $permission->toArray(), $request);

        return response()->json(['permission' => $permission]);
    }

    public function deletePermission(int $id)
    {
        $this->ensureAdmin();
        $permission = Permission::findOrFail($id);

        if (str_starts_with($permission->name, 'module.') || in_array($permission->name, [
            'users.manage', 'roles.manage', 'reports.platform',
        ], true)) {
            return response()->json(['message' => 'Core permissions cannot be deleted.'], 422);
        }

        $this->audit->log('rbac.permission.deleted', Auth::user(), $permission, $permission->toArray(), null, request());
        $permission->roles()->detach();
        $permission->delete();

        return response()->json(['message' => 'Permission deleted']);
    }
}
