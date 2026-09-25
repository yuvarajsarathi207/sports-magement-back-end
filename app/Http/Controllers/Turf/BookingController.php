<?php

namespace App\Http\Controllers\Turf;

use App\Http\Controllers\Controller;
use App\Models\Turf\Booking;
use App\Services\Platform\AuditLogger;
use App\Services\Turf\BookingService;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function __construct(
        private BookingService $bookings,
        private AuditLogger $audit
    ) {
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user->hasPermission('turf.booking.create')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'court_id' => 'required|integer|exists:courts,id',
            'starts_at' => 'required|date',
            'ends_at' => 'nullable|date|after:starts_at',
            'idempotency_key' => 'nullable|string|max:64',
        ]);

        if ($request->header('Idempotency-Key')) {
            $data['idempotency_key'] = $request->header('Idempotency-Key');
        }

        $result = $this->bookings->createBooking($user, $data);
        $this->audit->log('turf.booking.created', $user, Booking::find($result['id']), null, $result, $request);

        return response()->json($result, 201);
    }

    public function index(Request $request)
    {
        $query = Booking::with(['items.court', 'turf', 'paymentIntents'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $bookings = $query->paginate(20);

        return response()->json([
            'data' => $bookings->getCollection()->map(fn (Booking $b) => $this->bookings->payloadWithPayment($b)),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id)
    {
        $booking = Booking::with(['items.court', 'turf', 'paymentIntents', 'user'])->findOrFail($id);
        $user = $request->user();
        $allowed = $booking->user_id === $user->id
            || $user->isAdmin()
            || $this->bookings->managesBookingVenue($user, $booking);

        if (!$allowed) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($this->bookings->payloadWithPayment($booking));
    }

    public function cancel(Request $request, int $id)
    {
        $booking = Booking::with(['items.court', 'turf.owner', 'paymentIntents'])->findOrFail($id);
        $user = $request->user();

        $owns = $booking->user_id === $user->id;
        $manages = $this->bookings->managesBookingVenue($user, $booking);

        if (!$owns && !$manages && !$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $updated = $this->bookings->cancelBooking(
            $booking,
            $user,
            $request->input('reason'),
            $request->boolean('refund', true)
        );
        $this->audit->log('turf.booking.cancelled', $user, $updated, null, ['reason' => $request->input('reason')], $request);

        return response()->json($this->bookings->payloadWithPayment($updated->load('paymentIntents')));
    }

    public function confirmPayment(Request $request, int $id)
    {
        $booking = Booking::with(['items.court', 'turf', 'paymentIntents'])->findOrFail($id);
        $user = $request->user();

        $isOwner = $booking->user_id === $user->id;
        $isStaff = $user->isAdmin() || $this->bookings->managesBookingVenue($user, $booking);

        if (!$isOwner && !$isStaff) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Staff can force-confirm manual/offline payments
        if ($isStaff && $request->boolean('force_manual')) {
            $updated = $this->bookings->forceConfirmManual($booking, $user);
            $this->audit->log('turf.booking.force_confirmed', $user, $updated, null, null, $request);

            return response()->json($this->bookings->payloadWithPayment($updated->load('paymentIntents')));
        }

        $result = $this->bookings->syncAndConfirmPayment($booking);

        return response()->json($result);
    }
}
