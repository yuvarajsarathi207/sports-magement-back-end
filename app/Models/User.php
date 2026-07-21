<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'mobile',
        'role',
        'password',
        'is_blocked',
        'blocked_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<int, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_blocked' => 'boolean',
        'blocked_at' => 'datetime',
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
        return $this->hasMany(Address::class);
    }

    public function cart()
    {
        return $this->hasOne(Cart::class);
    }

    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function isOrganizer()
    {
        return $this->role === 'organizer';
    }

    public function isPlayer()
    {
        return $this->role === 'player';
    }

    public function isCustomer()
    {
        return false;
    }

    public function isAdmin()
    {
        return in_array($this->role, ['admin', 'super_admin'], true);
    }

    public function isSuperAdmin()
    {
        return $this->role === 'super_admin';
    }

    /** Players and organizers shop with the same account. */
    public function canShop()
    {
        return in_array($this->role, ['player', 'organizer', 'admin', 'super_admin'], true)
            && !$this->is_blocked;
    }
}
