<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'full_name',
        'mobile',
        'house_number',
        'street',
        'area',
        'landmark',
        'city',
        'district',
        'state',
        'country',
        'postal_code',
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

    public function toShippingArray(): array
    {
        return [
            'full_name' => $this->full_name,
            'mobile' => $this->mobile,
            'house_number' => $this->house_number,
            'street' => $this->street,
            'area' => $this->area,
            'landmark' => $this->landmark,
            'city' => $this->city,
            'district' => $this->district,
            'state' => $this->state,
            'country' => $this->country,
            'postal_code' => $this->postal_code,
            'address_type' => $this->address_type,
        ];
    }
}
