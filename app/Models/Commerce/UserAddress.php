<?php

namespace App\Models\Commerce;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserAddress extends Model
{
    use SoftDeletes;

    public const TYPE_HOME = 'HOME';
    public const TYPE_WORK = 'WORK';
    public const TYPE_OTHER = 'OTHER';

    protected $fillable = [
        'user_id',
        'name',
        'mobile',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'country',
        'pincode',
        'address_type',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function toSnapshot(): array
    {
        return [
            'name' => $this->name,
            'mobile' => $this->mobile,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'pincode' => $this->pincode,
            'address_type' => $this->address_type,
        ];
    }
}
