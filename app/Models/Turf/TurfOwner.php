<?php

namespace App\Models\Turf;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TurfOwner extends Model
{
    protected $fillable = [
        'user_id',
        'business_name',
        'gstin',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function turfs(): HasMany
    {
        return $this->hasMany(Turf::class);
    }
}
