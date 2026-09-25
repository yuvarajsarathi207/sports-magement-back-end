<?php

namespace App\Console\Commands;

use App\Services\Turf\BookingService;
use Illuminate\Console\Command;

class ExpireTurfBookingHolds extends Command
{
    protected $signature = 'turf:expire-holds';

    protected $description = 'Expire unpaid turf booking holds past TTL';

    public function handle(BookingService $bookings): int
    {
        $count = $bookings->expireHolds();
        $this->info("Expired {$count} booking hold(s).");

        return self::SUCCESS;
    }
}
