<?php

namespace App\Models\Turf;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Turf extends Model
{
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING_APPROVAL = 'pending_approval';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_SUSPENDED = 'suspended';

    protected $fillable = [
        'turf_owner_id',
        'name',
        'description',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'district',
        'pincode',
        'lat',
        'lng',
        'status',
        'slot_duration_minutes',
        'is_published',
    ];

    protected $casts = [
        'lat' => 'decimal:7',
        'lng' => 'decimal:7',
        'is_published' => 'boolean',
        'slot_duration_minutes' => 'integer',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(TurfOwner::class, 'turf_owner_id');
    }

    public function courts(): HasMany
    {
        return $this->hasMany(Court::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true)->where('status', self::STATUS_PUBLISHED);
    }
}
