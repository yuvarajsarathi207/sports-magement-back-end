<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'sku',
        'description',
        'category_id',
        'brand',
        'price',
        'discount',
        'stock',
        'rating',
        'rating_count',
        'status',
        'is_featured',
        'is_popular',
        'is_new',
        'is_flash_deal',
        'flash_deal_price',
        'flash_deal_ends_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'discount' => 'decimal:2',
        'rating' => 'decimal:2',
        'flash_deal_price' => 'decimal:2',
        'is_featured' => 'boolean',
        'is_popular' => 'boolean',
        'is_new' => 'boolean',
        'is_flash_deal' => 'boolean',
        'flash_deal_ends_at' => 'datetime',
    ];

    protected $appends = ['effective_price', 'primary_image_url'];

    protected static function booted(): void
    {
        static::creating(function (Product $product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name) . '-' . Str::lower(Str::random(4));
            }
        });
    }

    public function category()
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('display_order');
    }

    public function getEffectivePriceAttribute(): float
    {
        if ($this->is_flash_deal && $this->flash_deal_price !== null) {
            if (!$this->flash_deal_ends_at || $this->flash_deal_ends_at->isFuture()) {
                return (float) $this->flash_deal_price;
            }
        }

        $discount = (float) $this->discount;
        if ($discount > 0) {
            return round((float) $this->price * (1 - $discount / 100), 2);
        }

        return (float) $this->price;
    }

    public function getPrimaryImageUrlAttribute(): ?string
    {
        if ($this->relationLoaded('images')) {
            $primary = $this->images->firstWhere('is_primary', true) ?? $this->images->first();
            return $primary?->url;
        }

        $primary = $this->images()->where('is_primary', true)->first()
            ?? $this->images()->first();

        return $primary?->url;
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeSearch($query, ?string $term)
    {
        if (!$term) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
                ->orWhere('sku', 'like', "%{$term}%")
                ->orWhere('brand', 'like', "%{$term}%")
                ->orWhere('description', 'like', "%{$term}%");
        });
    }
}
