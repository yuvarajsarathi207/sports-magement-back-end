<?php

namespace App\Models\Commerce;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class CommercePayment extends Model
{
    public const STATUS_INITIATED = 'INITIATED';
    public const STATUS_PENDING = 'PENDING';
    public const STATUS_SUCCESS = 'SUCCESS';
    public const STATUS_FAILED = 'FAILED';
    public const STATUS_CANCELLED = 'CANCELLED';
    public const STATUS_REFUND_INITIATED = 'REFUND_INITIATED';
    public const STATUS_REFUNDED = 'REFUNDED';
    public const STATUS_PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED';

    public const PROVIDER_PHONEPE = 'phonepe';
    public const PROVIDER_COD = 'cod';

    protected $fillable = [
        'order_id',
        'user_id',
        'provider',
        'status',
        'amount',
        'currency',
        'merchant_order_id',
        'transaction_id',
        'idempotency_key',
        'provider_payload',
        'provider_response',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'provider_payload' => 'array',
        'provider_response' => 'array',
        'paid_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
