<?php

namespace App\Models\Commerce;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class OrderReturn extends Model
{
    public const STATUS_REQUESTED = 'REQUESTED';
    public const STATUS_APPROVED = 'APPROVED';
    public const STATUS_REJECTED = 'REJECTED';
    public const STATUS_COMPLETED = 'COMPLETED';

    protected $fillable = [
        'order_id',
        'user_id',
        'status',
        'reason',
        'items',
        'resolved_at',
    ];

    protected $casts = [
        'items' => 'array',
        'resolved_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function refunds()
    {
        return $this->hasMany(Refund::class);
    }
}
