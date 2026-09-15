<?php

namespace App\Models\Commerce;

use Illuminate\Database\Eloquent\Model;

class Refund extends Model
{
    public const STATUS_INITIATED = 'INITIATED';
    public const STATUS_PROCESSING = 'PROCESSING';
    public const STATUS_COMPLETED = 'COMPLETED';
    public const STATUS_FAILED = 'FAILED';

    protected $fillable = [
        'order_id',
        'commerce_payment_id',
        'order_return_id',
        'amount',
        'status',
        'provider_refund_id',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function payment()
    {
        return $this->belongsTo(CommercePayment::class, 'commerce_payment_id');
    }

    public function orderReturn()
    {
        return $this->belongsTo(OrderReturn::class, 'order_return_id');
    }
}
