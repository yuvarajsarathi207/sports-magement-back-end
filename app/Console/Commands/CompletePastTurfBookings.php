<?php

namespace App\Console\Commands;

use App\Services\Turf\BookingService;
use Illuminate\Console\Command;

class CompletePastTurfBookings extends Command
{
    protected $signature = 'turf:complete-past';

    protected $description = 'Mark confirmed turf bookings as completed once their slots have ended';

    public function handle(BookingService $bookings): int
    {
        $count = $bookings->completePastBookings();
        $this->info("Completed {$count} past booking(s).");

        return self::SUCCESS;
    }
}
