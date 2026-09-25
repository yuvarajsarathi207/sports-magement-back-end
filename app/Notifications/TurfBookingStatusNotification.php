<?php

namespace App\Notifications;

use App\Models\Turf\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TurfBookingStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Booking $booking,
        public string $event,
        public string $message
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'module' => 'turf',
            'event' => $this->event,
            'message' => $this->message,
            'booking_id' => $this->booking->id,
            'booking_uuid' => $this->booking->uuid,
            'turf_id' => $this->booking->turf_id,
            'turf_name' => $this->booking->turf?->name,
            'status' => $this->booking->status,
            'total' => (float) $this->booking->total,
        ];
    }
}
