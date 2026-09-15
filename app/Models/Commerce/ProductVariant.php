<?php

namespace App\Models\Commerce;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use SoftDeletes;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_OUT_OF_STOCK = 'out_of_stock';

    protected $fillable = [
        'product_id',
        'sku',
        'name',
        'size',
        'color',
        'price',
        'discount_price',
        'tax_percent',
        'weight',
        'dimensions',
        'status',
        'available_quantity',
        'reserved_quantity',
        'sold_quantity',
        'returned_quantity',
        'damaged_quantity',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'tax_percent' => 'decimal:2',
        'weight' => 'decimal:3',
        'available_quantity' => 'integer',
        'reserved_quantity' => 'integer',
        'sold_quantity' => 'integer',
        'returned_quantity' => 'integer',
        'damaged_quantity' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class);
    }

    public function isSellable(): bool
    {
        return $this->status === self::STATUS_ACTIVE && $this->available_quantity > 0;
    }

    public function effectivePrice(): float
    {
        if ($this->discount_price !== null && (float) $this->discount_price > 0) {
            return (float) $this->discount_price;
        }

        return (float) $this->price;
    }

    public function effectiveTaxPercent(): float
    {
        if ($this->tax_percent !== null) {
            return (float) $this->tax_percent;
        }

        return (float) ($this->product?->tax_percent ?? 0);
    }

    public function displayName(): string
    {
        $parts = array_filter([$this->name, $this->size, $this->color]);

        return implode(' / ', $parts) ?: $this->sku;
    }
}
