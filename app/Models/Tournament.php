<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tournament extends Model
{
    use HasFactory;

    protected $fillable = [
        'organizer_id',
        'sports_category_id',
        'team_name',
        'location',
        'location_details',
        'start_date',
        'winning_date',
        'slot_count',
        'template',
        'rules',
        'entry_fee',
        'price_details',
        'ball_type',
        'status',
        'is_published',
    ];

    protected $casts = [
        'start_date' => 'date',
        'winning_date' => 'date',
        'entry_fee' => 'decimal:2',
        'is_published' => 'boolean',
    ];

    public function organizer()
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function sportsCategory()
    {
        return $this->belongsTo(SportsCategory::class);
    }

    public function interests()
    {
        return $this->hasMany(TournamentInterest::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}

