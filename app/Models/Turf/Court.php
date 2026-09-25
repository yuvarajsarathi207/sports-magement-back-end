<?php

namespace App\Models\Turf;

use App\Models\SportsCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Court extends Model
{
    protected $fillable = [
        'turf_id',
        'name',
        'sports_category_id',
        'capacity',
        'is_active',
        'base_price',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'base_price' => 'decimal:2',
        'capacity' => 'integer',
    ];

    public function turf(): BelongsTo
    {
        return $this->belongsTo(Turf::class);
    }

    public function sport(): BelongsTo
    {
        return $this->belongsTo(SportsCategory::class, 'sports_category_id');
    }

    public function availabilityRules(): HasMany
    {
        return $this->hasMany(TurfAvailabilityRule::class);
    }

    public function exceptions(): HasMany
    {
        return $this->hasMany(TurfAvailabilityException::class);
    }

    public function priceRules(): HasMany
    {
        return $this->hasMany(TurfPriceRule::class);
    }

    public function bookingItems(): HasMany
    {
        return $this->hasMany(BookingItem::class);
    }
}
