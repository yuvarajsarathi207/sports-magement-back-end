<?php

namespace App\Services\Turf;

use App\Models\User;
use App\Models\Turf\Booking;
use App\Notifications\TurfBookingStatusNotification;
use Illuminate\Support\Facades\Log;

class TurfNotificationService
{
    public function bookingCreated(Booking $booking): void
    {
        $booking->loadMissing(['user', 'turf.owner.user', 'items.court']);
        $this->notifyUser($booking->user, $booking, 'created', 'Your turf slot is held. Complete payment to confirm.');
        $ownerUser = $booking->turf?->owner?->user;
        if ($ownerUser) {
            $this->notifyUser($ownerUser, $booking, 'owner_new', 'New booking request on ' . $booking->turf->name);
        }
    }

    public function bookingConfirmed(Booking $booking): void
    {
        $booking->loadMissing(['user', 'turf.owner.user', 'items.court']);
        $this->notifyUser($booking->user, $booking, 'confirmed', 'Your turf booking is confirmed.');
        $ownerUser = $booking->turf?->owner?->user;
        if ($ownerUser) {
            $this->notifyUser($ownerUser, $booking, 'owner_confirmed', 'A booking was confirmed on ' . $booking->turf->name);
        }
    }

    public function bookingCancelled(Booking $booking): void
    {
        $booking->loadMissing(['user', 'turf.owner.user', 'items.court']);
        $this->notifyUser($booking->user, $booking, 'cancelled', 'Your turf booking was cancelled.');
        $ownerUser = $booking->turf?->owner?->user;
        if ($ownerUser) {
            $this->notifyUser($ownerUser, $booking, 'owner_cancelled', 'A booking was cancelled on ' . $booking->turf->name);
        }
    }

    protected function notifyUser(?User $user, Booking $booking, string $event, string $message): void
    {
        if (!$user) {
            return;
        }

        try {
            $user->notify(new TurfBookingStatusNotification($booking, $event, $message));
        } catch (\Throwable $e) {
            Log::warning('Turf notification failed', [
                'user_id' => $user->id,
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
