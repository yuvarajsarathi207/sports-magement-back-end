<?php

namespace App\Models\Commerce;

use App\Models\SportsCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_ARCHIVED = 'archived';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'product_category_id',
        'brand_id',
        'sports_category_id',
        'sku',
        'base_price',
        'discount_price',
        'tax_percent',
        'status',
        'weight',
        'dimensions',
        'has_variants',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'tax_percent' => 'decimal:2',
        'weight' => 'decimal:3',
        'has_variants' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(ProductCategory::class, 'product_category_id');
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function sportsCategory()
    {
        return $this->belongsTo(SportsCategory::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function effectivePrice(): float
    {
        if ($this->discount_price !== null && (float) $this->discount_price > 0) {
            return (float) $this->discount_price;
        }

        return (float) $this->base_price;
    }
}
