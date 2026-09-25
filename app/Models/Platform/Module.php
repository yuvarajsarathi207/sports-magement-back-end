<?php

namespace App\Models\Platform;

use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    protected $fillable = [
        'code',
        'name',
        'icon',
        'route_prefix',
        'sort_order',
        'is_active',
        'required_permission',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}
