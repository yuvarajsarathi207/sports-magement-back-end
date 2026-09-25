<?php

namespace App\Models\Turf;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TurfPriceRule extends Model
{
    protected $fillable = [
        'court_id',
        'name',
        'day_of_week',
        'start_time',
        'end_time',
        'price',
        'is_peak',
        'is_weekend',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'price' => 'decimal:2',
        'is_peak' => 'boolean',
        'is_weekend' => 'boolean',
    ];

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }
}
