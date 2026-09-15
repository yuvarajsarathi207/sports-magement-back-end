<?php

namespace App\Models\Commerce;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class InventoryReservation extends Model
{
    public const STATUS_ACTIVE = 'ACTIVE';
    public const STATUS_CONSUMED = 'CONSUMED';
    public const STATUS_RELEASED = 'RELEASED';
    public const STATUS_EXPIRED = 'EXPIRED';

    protected $fillable = [
        'product_variant_id',
        'user_id',
        'order_id',
        'quantity',
        'status',
        'expires_at',
        'idempotency_key',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'expires_at' => 'datetime',
    ];

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
