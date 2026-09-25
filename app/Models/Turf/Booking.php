<?php

namespace App\Models\Turf;

use App\Models\Platform\PaymentIntent;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Str;

class Booking extends Model
{
    public const STATUS_HELD = 'held';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'uuid',
        'user_id',
        'turf_id',
        'status',
        'subtotal',
        'tax',
        'total',
        'currency',
        'idempotency_key',
        'hold_expires_at',
        'confirmed_at',
        'cancelled_at',
        'cancel_reason',
        'meta',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'meta' => 'array',
        'hold_expires_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $booking) {
            if (!$booking->uuid) {
                $booking->uuid = (string) Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function turf(): BelongsTo
    {
        return $this->belongsTo(Turf::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(BookingItem::class);
    }

    public function paymentIntents(): MorphMany
    {
        return $this->morphMany(PaymentIntent::class, 'payable');
    }

    public function isActiveHold(): bool
    {
        return $this->status === self::STATUS_HELD
            && $this->hold_expires_at
            && $this->hold_expires_at->isFuture();
    }
}
