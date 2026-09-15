<?php

namespace App\Models\Commerce;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use SoftDeletes;

    public const STATUS_CREATED = 'CREATED';
    public const STATUS_PAYMENT_PENDING = 'PAYMENT_PENDING';
    public const STATUS_CONFIRMED = 'CONFIRMED';
    public const STATUS_PROCESSING = 'PROCESSING';
    public const STATUS_PACKED = 'PACKED';
    public const STATUS_SHIPPED = 'SHIPPED';
    public const STATUS_OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY';
    public const STATUS_DELIVERED = 'DELIVERED';
    public const STATUS_CANCELLED = 'CANCELLED';
    public const STATUS_RETURN_REQUESTED = 'RETURN_REQUESTED';
    public const STATUS_RETURNED = 'RETURNED';
    public const STATUS_REFUND_PENDING = 'REFUND_PENDING';
    public const STATUS_REFUNDED = 'REFUNDED';

    public const PAYMENT_PENDING = 'PENDING';
    public const PAYMENT_SUCCESS = 'SUCCESS';
    public const PAYMENT_FAILED = 'FAILED';
    public const PAYMENT_REFUNDED = 'REFUNDED';
    public const PAYMENT_PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED';

    public const METHOD_COD = 'cod';
    public const METHOD_PHONEPE = 'phonepe';

    protected $fillable = [
        'order_number',
        'user_id',
        'status',
        'payment_status',
        'payment_method',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'coupon_discount',
        'delivery_charge',
        'total_amount',
        'coupon_id',
        'coupon_code',
        'shipping_address',
        'billing_address',
        'shipping_address_id',
        'notes',
        'idempotency_key',
        'cancelled_at',
        'cancellation_reason',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'coupon_discount' => 'decimal:2',
        'delivery_charge' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'shipping_address' => 'array',
        'billing_address' => 'array',
        'cancelled_at' => 'datetime',
    ];

    public static function allowedTransitions(): array
    {
        return [
            self::STATUS_CREATED => [self::STATUS_PAYMENT_PENDING, self::STATUS_CONFIRMED, self::STATUS_CANCELLED],
            self::STATUS_PAYMENT_PENDING => [self::STATUS_CONFIRMED, self::STATUS_CANCELLED],
            self::STATUS_CONFIRMED => [self::STATUS_PROCESSING, self::STATUS_CANCELLED],
            self::STATUS_PROCESSING => [self::STATUS_PACKED, self::STATUS_CANCELLED],
            self::STATUS_PACKED => [self::STATUS_SHIPPED, self::STATUS_CANCELLED],
            self::STATUS_SHIPPED => [self::STATUS_OUT_FOR_DELIVERY, self::STATUS_DELIVERED],
            self::STATUS_OUT_FOR_DELIVERY => [self::STATUS_DELIVERED],
            self::STATUS_DELIVERED => [self::STATUS_RETURN_REQUESTED],
            self::STATUS_RETURN_REQUESTED => [self::STATUS_RETURNED, self::STATUS_REFUND_PENDING, self::STATUS_DELIVERED],
            self::STATUS_RETURNED => [self::STATUS_REFUND_PENDING, self::STATUS_REFUNDED],
            self::STATUS_REFUND_PENDING => [self::STATUS_REFUNDED],
            self::STATUS_CANCELLED => [],
            self::STATUS_REFUNDED => [],
        ];
    }

    public function canTransitionTo(string $newStatus): bool
    {
        $allowed = self::allowedTransitions()[$this->status] ?? [];

        return in_array($newStatus, $allowed, true);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(CommercePayment::class);
    }

    public function shipments()
    {
        return $this->hasMany(Shipment::class);
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    public function returns()
    {
        return $this->hasMany(OrderReturn::class);
    }

    public function refunds()
    {
        return $this->hasMany(Refund::class);
    }
}
