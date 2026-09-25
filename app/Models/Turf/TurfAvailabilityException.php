<?php

namespace App\Models\Turf;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TurfAvailabilityException extends Model
{
    protected $fillable = [
        'court_id',
        'exception_date',
        'open_time',
        'close_time',
        'is_closed',
        'reason',
    ];

    protected $casts = [
        'exception_date' => 'date',
        'is_closed' => 'boolean',
    ];

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }
}
