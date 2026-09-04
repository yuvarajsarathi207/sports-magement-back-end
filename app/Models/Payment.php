<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    public const TYPE_PLAYER_SUBSCRIPTION = 'player_subscription';
    public const TYPE_ORGANIZER_PUBLISH = 'organizer_publish';

    protected $fillable = [
        'type',
        'subscription_id',
        'tournament_id',
        'player_id',
        'organizer_id',
        'amount',
        'status',
        'payment_method',
        'transaction_id',
        'merchant_order_id',
        'payment_details',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    public function tournament()
    {
        return $this->belongsTo(Tournament::class);
    }

    public function player()
    {
        return $this->belongsTo(User::class, 'player_id');
    }

    public function organizer()
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }
}
