<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    public const STATUSES = [
        'pending',
        'confirmed',
        'packed',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refunded',
    ];

    protected $fillable = [
        'order_number',
        'user_id',
        'address_id',
        'shipping_address',
        'subtotal',
        'discount',
        'tax',
        'shipping',
        'grand_total',
        'status',
        'cancel_reason',
        'cancelled_at',
    ];

    protected $casts = [
        'shipping_address' => 'array',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'shipping' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'cancelled_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function address()
    {
        return $this->belongsTo(Address::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(OrderPayment::class);
    }

    public function latestPayment()
    {
        return $this->hasOne(OrderPayment::class)->latestOfMany();
    }

    public function statusHistories()
    {
        return $this->hasMany(OrderStatusHistory::class)->latest();
    }

    public static function generateOrderNumber(): string
    {
        return 'KP-' . now()->format('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
    }
}
