<?php

namespace App\Models\Commerce;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    public const TYPE_PURCHASE = 'PURCHASE';
    public const TYPE_SALE = 'SALE';
    public const TYPE_RESERVATION = 'RESERVATION';
    public const TYPE_RELEASE = 'RELEASE';
    public const TYPE_RETURN = 'RETURN';
    public const TYPE_DAMAGE = 'DAMAGE';
    public const TYPE_ADJUSTMENT = 'ADJUSTMENT';
    public const TYPE_STOCK_IN = 'STOCK_IN';
    public const TYPE_STOCK_OUT = 'STOCK_OUT';

    protected $fillable = [
        'product_variant_id',
        'type',
        'quantity',
        'available_before',
        'available_after',
        'reserved_before',
        'reserved_after',
        'reference_type',
        'reference_id',
        'user_id',
        'notes',
        'idempotency_key',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'available_before' => 'integer',
        'available_after' => 'integer',
        'reserved_before' => 'integer',
        'reserved_after' => 'integer',
    ];

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
