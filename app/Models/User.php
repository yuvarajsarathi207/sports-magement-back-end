<?php

namespace App\Models;

use App\Models\Platform\Role;
use App\Models\Platform\UserProfile;
use App\Models\Turf\Booking;
use App\Models\Turf\TurfOwner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'mobile',
        'role',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function organizedTournaments()
    {
        return $this->hasMany(Tournament::class, 'organizer_id');
    }

    public function tournamentInterests()
    {
        return $this->hasMany(TournamentInterest::class, 'player_id');
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'player_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'player_id');
    }

    public function addresses()
    {
        return $this->hasMany(\App\Models\Commerce\UserAddress::class);
    }

    public function cart()
    {
        return $this->hasOne(\App\Models\Commerce\Cart::class);
    }

    public function commerceOrders()
    {
        return $this->hasMany(\App\Models\Commerce\Order::class);
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles')->withTimestamps();
    }

    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }

    public function turfOwner()
    {
        return $this->hasOne(TurfOwner::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function isOrganizer(): bool
    {
        return $this->role === 'organizer' || $this->hasRole('organizer');
    }

    public function isPlayer(): bool
    {
        return $this->role === 'player' || $this->hasRole('player');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin' || $this->hasRole('platform_admin');
    }

    public function isTurfOwner(): bool
    {
        return $this->role === 'turf_owner' || $this->hasRole('turf_owner');
    }

    public function hasRole(string $roleName): bool
    {
        if ($this->relationLoaded('roles')) {
            return $this->roles->contains('name', $roleName);
        }

        return $this->roles()->where('name', $roleName)->exists();
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        $roles = $this->relationLoaded('roles')
            ? $this->roles
            : $this->roles()->with('permissions')->get();

        foreach ($roles as $role) {
            $permissions = $role->relationLoaded('permissions')
                ? $role->permissions
                : $role->permissions()->get();

            if ($permissions->contains('name', $permission)) {
                return true;
            }
        }

        // Fallback for environments not yet seeded
        return $this->legacyPermission($permission);
    }

    public function permissionNames(): array
    {
        if ($this->isAdmin()) {
            return ['*'];
        }

        $roles = $this->roles()->with('permissions')->get();
        $names = $roles->flatMap(fn ($role) => $role->permissions->pluck('name'))->unique()->values()->all();

        if (empty($names)) {
            return $this->legacyPermissionSet();
        }

        return $names;
    }

    public function assignRoleByName(string $roleName): void
    {
        $role = Role::where('name', $roleName)->first();
        if ($role && !$this->roles()->where('role_id', $role->id)->exists()) {
            $this->roles()->attach($role->id);
        }
    }

    protected function legacyPermission(string $permission): bool
    {
        return in_array($permission, $this->legacyPermissionSet(), true);
    }

    protected function legacyPermissionSet(): array
    {
        return match ($this->role) {
            'admin' => ['*'],
            'organizer' => [
                'module.tournament.access',
                'module.shop.access',
                'tournament.create',
                'tournament.manage_own',
                'shop.order.place',
                'turf.booking.create',
                'module.turf.access',
            ],
            'turf_owner' => [
                'module.turf.access',
                'module.shop.access',
                'turf.venue.manage_own',
                'turf.booking.create',
                'shop.order.place',
            ],
            default => [
                'module.tournament.access',
                'module.shop.access',
                'module.turf.access',
                'tournament.register',
                'shop.order.place',
                'turf.booking.create',
            ],
        };
    }
}
