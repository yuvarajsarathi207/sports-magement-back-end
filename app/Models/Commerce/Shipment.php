<?php

namespace App\Models\Commerce;

use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    public const STATUS_PENDING = 'PENDING';
    public const STATUS_PACKED = 'PACKED';
    public const STATUS_SHIPPED = 'SHIPPED';
    public const STATUS_OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY';
    public const STATUS_DELIVERED = 'DELIVERED';
    public const STATUS_FAILED = 'FAILED';
    public const STATUS_CANCELLED = 'CANCELLED';

    protected $fillable = [
        'order_id',
        'provider',
        'shipment_id',
        'tracking_number',
        'status',
        'delivery_charge',
        'estimated_delivery_at',
        'shipped_at',
        'delivered_at',
        'provider_payload',
    ];

    protected $casts = [
        'delivery_charge' => 'decimal:2',
        'estimated_delivery_at' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'provider_payload' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
