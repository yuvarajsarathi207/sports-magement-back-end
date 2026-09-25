<?php

namespace Database\Seeders;

use App\Models\Platform\Module;
use App\Models\Platform\Permission;
use App\Models\Platform\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class PlatformRbacSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'module.tournament.access', 'display_name' => 'Access Tournaments', 'module' => 'tournament'],
            ['name' => 'module.shop.access', 'display_name' => 'Access Shop', 'module' => 'shop'],
            ['name' => 'module.turf.access', 'display_name' => 'Access Turf Booking', 'module' => 'turf'],
            ['name' => 'users.manage', 'display_name' => 'Manage Users', 'module' => 'platform'],
            ['name' => 'roles.manage', 'display_name' => 'Manage Roles', 'module' => 'platform'],
            ['name' => 'tournament.create', 'display_name' => 'Create Tournaments', 'module' => 'tournament'],
            ['name' => 'tournament.manage_own', 'display_name' => 'Manage Own Tournaments', 'module' => 'tournament'],
            ['name' => 'tournament.moderate', 'display_name' => 'Moderate Tournaments', 'module' => 'tournament'],
            ['name' => 'tournament.register', 'display_name' => 'Register for Tournaments', 'module' => 'tournament'],
            ['name' => 'shop.catalog.manage', 'display_name' => 'Manage Shop Catalog', 'module' => 'shop'],
            ['name' => 'shop.order.place', 'display_name' => 'Place Shop Orders', 'module' => 'shop'],
            ['name' => 'turf.venue.manage_own', 'display_name' => 'Manage Own Turfs', 'module' => 'turf'],
            ['name' => 'turf.booking.create', 'display_name' => 'Book Turf Slots', 'module' => 'turf'],
            ['name' => 'payments.refund', 'display_name' => 'Issue Refunds', 'module' => 'platform'],
            ['name' => 'reports.platform', 'display_name' => 'Platform Reports', 'module' => 'platform'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(['name' => $permission['name']], $permission);
        }

        $roleMap = [
            'platform_admin' => [
                'display_name' => 'Platform Admin',
                'permissions' => Permission::pluck('name')->all(),
            ],
            'organizer' => [
                'display_name' => 'Organizer',
                'permissions' => [
                    'module.tournament.access',
                    'module.shop.access',
                    'module.turf.access',
                    'tournament.create',
                    'tournament.manage_own',
                    'shop.order.place',
                    'turf.booking.create',
                ],
            ],
            'player' => [
                'display_name' => 'Player',
                'permissions' => [
                    'module.tournament.access',
                    'module.shop.access',
                    'module.turf.access',
                    'tournament.register',
                    'shop.order.place',
                    'turf.booking.create',
                ],
            ],
            'turf_owner' => [
                'display_name' => 'Turf Owner',
                'permissions' => [
                    'module.turf.access',
                    'module.shop.access',
                    'turf.venue.manage_own',
                    'turf.booking.create',
                    'shop.order.place',
                ],
            ],
        ];

        foreach ($roleMap as $name => $config) {
            $role = Role::updateOrCreate(
                ['name' => $name],
                ['display_name' => $config['display_name'], 'description' => $config['display_name']]
            );
            $ids = Permission::whereIn('name', $config['permissions'])->pluck('id');
            $role->permissions()->sync($ids);
        }

        $modules = [
            ['code' => 'tournament', 'name' => 'Tournaments', 'icon' => 'trophy', 'route_prefix' => '/tournaments', 'sort_order' => 1, 'required_permission' => 'module.tournament.access'],
            ['code' => 'shop', 'name' => 'Shop', 'icon' => 'cart', 'route_prefix' => '/shop', 'sort_order' => 2, 'required_permission' => 'module.shop.access'],
            ['code' => 'turf', 'name' => 'Turf Booking', 'icon' => 'stadium', 'route_prefix' => '/turf', 'sort_order' => 3, 'required_permission' => 'module.turf.access'],
        ];

        foreach ($modules as $module) {
            Module::updateOrCreate(['code' => $module['code']], array_merge($module, ['is_active' => true]));
        }

        // Backfill RBAC roles from legacy users.role
        User::query()->each(function (User $user) {
            $map = [
                'admin' => 'platform_admin',
                'organizer' => 'organizer',
                'player' => 'player',
                'turf_owner' => 'turf_owner',
            ];
            $roleName = $map[$user->role] ?? 'player';
            $user->assignRoleByName($roleName);
        });
    }
}
