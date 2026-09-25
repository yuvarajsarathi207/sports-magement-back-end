<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Models\Turf\Booking;
use App\Models\Turf\Turf;
use App\Models\Turf\TurfAvailabilityRule;
use App\Models\Turf\TurfOwner;
use App\Models\User;
use App\Services\Platform\AuditLogger;
use App\Services\Turf\BookingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminTurfController extends Controller
{
    public function __construct(
        private AuditLogger $audit,
        private BookingService $bookings
    ) {
        $this->middleware('auth:sanctum');
    }

    protected function ensureAdmin(): void
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Unauthorized');
        }
    }

    public function dashboard()
    {
        $this->ensureAdmin();

        $today = now()->startOfDay();

        $todaysBookings = Booking::query()
            ->whereHas('items', fn ($q) => $q->whereDate('starts_at', $today))
            ->count();

        $confirmedUpcoming = Booking::query()
            ->where('status', Booking::STATUS_CONFIRMED)
            ->whereHas('items', fn ($q) => $q->where('starts_at', '>', now()))
            ->count();

        $revenue = (float) Booking::query()
            ->where('status', Booking::STATUS_CONFIRMED)
            ->sum('total');

        $pendingVenues = Turf::with(['owner.user'])
            ->where('status', Turf::STATUS_PENDING_APPROVAL)
            ->latest('id')
            ->limit(8)
            ->get();

        $attentionBookings = Booking::with(['user:id,name,email', 'turf:id,name,city'])
            ->whereIn('status', [Booking::STATUS_HELD, Booking::STATUS_CONFIRMED])
            ->latest('id')
            ->limit(8)
            ->get();

        return response()->json([
            'stats' => [
                'venues' => Turf::count(),
                'pending_approval' => Turf::where('status', Turf::STATUS_PENDING_APPROVAL)->count(),
                'todays_bookings' => $todaysBookings,
                'confirmed_upcoming' => $confirmedUpcoming,
                'revenue' => $revenue,
            ],
            'pending_venues' => $pendingVenues,
            'attention_bookings' => $attentionBookings,
        ]);
    }

    public function index(Request $request)
    {
        $this->ensureAdmin();

        $query = Turf::with(['owner.user', 'courts.sport'])->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('city')) {
            $query->where('city', 'like', '%' . $request->city . '%');
        }
        if ($request->has('published')) {
            $query->where('is_published', $request->boolean('published'));
        }

        return response()->json($query->paginate(min((int) $request->get('per_page', 30), 100)));
    }

    public function show(int $id)
    {
        $this->ensureAdmin();

        $turf = Turf::with(['owner.user', 'courts.sport', 'courts.availabilityRules'])->findOrFail($id);

        return response()->json(['turf' => $turf]);
    }

    public function store(Request $request)
    {
        $this->ensureAdmin();

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'address_line1' => 'required|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'district' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:16',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'slot_duration_minutes' => 'nullable|integer|min:15|max:240',
            'owner_user_id' => 'nullable|integer|exists:users,id',
            'business_name' => 'nullable|string|max:255',
            'publish' => 'nullable|boolean',
            'court_name' => 'nullable|string|max:255',
            'court_base_price' => 'nullable|numeric|min:0',
            'sports_category_id' => 'nullable|integer|exists:sports_categories,id',
        ]);

        $owner = $this->resolveOwner($data);

        $turf = DB::transaction(function () use ($data, $owner, $request) {
            $publish = (bool) ($data['publish'] ?? false);

            $turf = $owner->turfs()->create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'address_line1' => $data['address_line1'],
                'address_line2' => $data['address_line2'] ?? null,
                'city' => $data['city'],
                'state' => $data['state'],
                'district' => $data['district'] ?? null,
                'pincode' => $data['pincode'] ?? null,
                'lat' => $data['lat'] ?? null,
                'lng' => $data['lng'] ?? null,
                'slot_duration_minutes' => $data['slot_duration_minutes'] ?? 60,
                'status' => $publish ? Turf::STATUS_PUBLISHED : Turf::STATUS_DRAFT,
                'is_published' => $publish,
            ]);

            if (!empty($data['court_name'])) {
                $court = $turf->courts()->create([
                    'name' => $data['court_name'],
                    'sports_category_id' => $data['sports_category_id'] ?? null,
                    'base_price' => $data['court_base_price'] ?? 0,
                    'is_active' => true,
                ]);

                for ($d = 0; $d <= 6; $d++) {
                    TurfAvailabilityRule::create([
                        'court_id' => $court->id,
                        'day_of_week' => $d,
                        'open_time' => '06:00',
                        'close_time' => '22:00',
                        'is_closed' => false,
                    ]);
                }
            }

            $this->audit->log('admin.turf.created', Auth::user(), $turf, null, $turf->toArray(), $request);

            return $turf->load(['owner.user', 'courts']);
        });

        return response()->json(['turf' => $turf], 201);
    }

    public function update(Request $request, int $id)
    {
        $this->ensureAdmin();
        $turf = Turf::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'address_line1' => 'sometimes|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'sometimes|string|max:100',
            'state' => 'sometimes|string|max:100',
            'district' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:16',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'slot_duration_minutes' => 'nullable|integer|min:15|max:240',
            'status' => 'nullable|in:draft,pending_approval,published,suspended',
            'is_published' => 'nullable|boolean',
        ]);

        $before = $turf->toArray();
        $turf->update($data);

        if (array_key_exists('is_published', $data) && $data['is_published']) {
            $turf->update(['status' => Turf::STATUS_PUBLISHED]);
        }

        $this->audit->log('admin.turf.updated', Auth::user(), $turf, $before, $turf->fresh()->toArray(), $request);

        return response()->json(['turf' => $turf->fresh(['owner.user', 'courts'])]);
    }

    public function publish(int $id)
    {
        $this->ensureAdmin();
        $turf = Turf::withCount(['courts' => fn ($q) => $q->where('is_active', true)])->findOrFail($id);

        if ($turf->courts_count < 1) {
            return response()->json(['message' => 'Add at least one active court before publishing.'], 422);
        }

        $turf->update([
            'status' => Turf::STATUS_PUBLISHED,
            'is_published' => true,
        ]);

        return response()->json(['turf' => $turf->fresh(['owner.user', 'courts'])]);
    }

    public function unpublish(int $id)
    {
        $this->ensureAdmin();
        $turf = Turf::findOrFail($id);
        $turf->update([
            'status' => Turf::STATUS_DRAFT,
            'is_published' => false,
        ]);

        return response()->json(['turf' => $turf->fresh(['owner.user', 'courts'])]);
    }

    public function approveTurf(Request $request, int $id)
    {
        $this->ensureAdmin();
        $turf = Turf::withCount(['courts' => fn ($q) => $q->where('is_active', true)])->findOrFail($id);

        if ($turf->courts_count < 1) {
            return response()->json(['message' => 'Add at least one active court before approving.'], 422);
        }

        $before = $turf->toArray();
        $turf->update([
            'status' => Turf::STATUS_PUBLISHED,
            'is_published' => true,
        ]);
        $this->audit->log('admin.turf.approved', Auth::user(), $turf, $before, $turf->toArray(), $request);

        return response()->json(['turf' => $turf->fresh(['owner.user', 'courts'])]);
    }

    public function rejectTurf(Request $request, int $id)
    {
        $this->ensureAdmin();
        $data = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $turf = Turf::findOrFail($id);
        $before = $turf->toArray();
        $turf->update([
            'status' => Turf::STATUS_DRAFT,
            'is_published' => false,
        ]);
        $this->audit->log('admin.turf.rejected', Auth::user(), $turf, $before, [
            'reason' => $data['reason'] ?? null,
        ], $request);

        return response()->json([
            'turf' => $turf->fresh(['owner.user', 'courts']),
            'reason' => $data['reason'] ?? null,
        ]);
    }

    public function suspendTurf(Request $request, int $id)
    {
        $this->ensureAdmin();
        $turf = Turf::findOrFail($id);
        $before = $turf->toArray();
        $turf->update([
            'status' => Turf::STATUS_SUSPENDED,
            'is_published' => false,
        ]);
        $this->audit->log('admin.turf.suspended', Auth::user(), $turf, $before, $turf->toArray(), $request);

        return response()->json(['turf' => $turf->fresh(['owner.user', 'courts'])]);
    }

    public function storeCourt(Request $request, int $turfId)
    {
        $this->ensureAdmin();
        $turf = Turf::findOrFail($turfId);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sports_category_id' => 'nullable|integer|exists:sports_categories,id',
            'capacity' => 'nullable|integer|min:1',
            'base_price' => 'required|numeric|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $court = DB::transaction(function () use ($turf, $data) {
            $court = $turf->courts()->create([
                'name' => $data['name'],
                'sports_category_id' => $data['sports_category_id'] ?? null,
                'capacity' => $data['capacity'] ?? null,
                'base_price' => $data['base_price'],
                'is_active' => $data['is_active'] ?? true,
            ]);

            for ($d = 0; $d <= 6; $d++) {
                TurfAvailabilityRule::create([
                    'court_id' => $court->id,
                    'day_of_week' => $d,
                    'open_time' => '06:00',
                    'close_time' => '22:00',
                    'is_closed' => false,
                ]);
            }

            return $court->load('availabilityRules');
        });

        return response()->json(['court' => $court], 201);
    }

    public function delete(int $id)
    {
        $this->ensureAdmin();
        $turf = Turf::withCount('bookings')->findOrFail($id);

        if ($turf->bookings_count > 0) {
            return response()->json(['message' => 'Cannot delete a turf that has bookings. Unpublish instead.'], 422);
        }

        $this->audit->log('admin.turf.deleted', Auth::user(), $turf, $turf->toArray(), null, request());
        $turf->courts()->delete();
        $turf->delete();

        return response()->json(['message' => 'Turf deleted']);
    }

    public function owners(Request $request)
    {
        $this->ensureAdmin();

        $query = TurfOwner::with('user:id,name,email,role')->orderBy('business_name');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $owners = $query->get();

        $candidates = User::query()
            ->where(function ($q) {
                $q->whereIn('role', ['turf_owner', 'organizer', 'admin'])
                    ->orWhereHas('roles', fn ($r) => $r->where('name', 'turf_owner'));
            })
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return response()->json([
            'owners' => $owners,
            'candidates' => $candidates,
        ]);
    }

    public function approveOwner(Request $request, int $id)
    {
        $this->ensureAdmin();
        $owner = TurfOwner::with('user')->findOrFail($id);
        $before = $owner->toArray();
        $owner->update(['status' => 'active']);
        $this->audit->log('admin.turf_owner.approved', Auth::user(), $owner, $before, $owner->toArray(), $request);

        return response()->json(['owner' => $owner->fresh('user')]);
    }

    public function suspendOwner(Request $request, int $id)
    {
        $this->ensureAdmin();
        $owner = TurfOwner::with('user')->findOrFail($id);
        $before = $owner->toArray();
        $owner->update(['status' => 'suspended']);
        $this->audit->log('admin.turf_owner.suspended', Auth::user(), $owner, $before, $owner->toArray(), $request);

        return response()->json(['owner' => $owner->fresh('user')]);
    }

    public function activateOwner(Request $request, int $id)
    {
        $this->ensureAdmin();
        $owner = TurfOwner::with('user')->findOrFail($id);
        $before = $owner->toArray();
        $owner->update(['status' => 'active']);
        $this->audit->log('admin.turf_owner.activated', Auth::user(), $owner, $before, $owner->toArray(), $request);

        return response()->json(['owner' => $owner->fresh('user')]);
    }

    public function listBookings(Request $request)
    {
        $this->ensureAdmin();

        $query = Booking::with(['items.court', 'turf', 'user', 'paymentIntents'])
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('turf_id')) {
            $query->where('turf_id', (int) $request->input('turf_id'));
        }
        if ($request->filled('city')) {
            $city = $request->string('city');
            $query->whereHas('turf', fn ($q) => $q->where('city', 'like', '%' . $city . '%'));
        }

        $bookings = $query->paginate(min((int) $request->get('per_page', 30), 100));

        return response()->json([
            'data' => $bookings->getCollection()->map(fn (Booking $b) => $this->bookings->payloadWithPayment($b)),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    public function cancelBooking(Request $request, int $id)
    {
        $this->ensureAdmin();
        $booking = Booking::with(['items.court', 'turf.owner', 'paymentIntents', 'user'])->findOrFail($id);
        $updated = $this->bookings->cancelBooking(
            $booking,
            Auth::user(),
            $request->input('reason'),
            $request->boolean('refund', true)
        );
        $this->audit->log('admin.turf.booking.cancelled', Auth::user(), $updated, null, [
            'reason' => $request->input('reason'),
        ], $request);

        return response()->json($this->bookings->payloadWithPayment($updated->load('paymentIntents')));
    }

    public function confirmBooking(Request $request, int $id)
    {
        $this->ensureAdmin();
        $booking = Booking::with(['items.court', 'turf', 'paymentIntents', 'user'])->findOrFail($id);
        $updated = $this->bookings->forceConfirmManual($booking, Auth::user());
        $this->audit->log('admin.turf.booking.force_confirmed', Auth::user(), $updated, null, null, $request);

        return response()->json($this->bookings->payloadWithPayment($updated->load('paymentIntents')));
    }

    public function markNoShow(Request $request, int $id)
    {
        $this->ensureAdmin();
        $booking = Booking::with(['items.court', 'turf'])->findOrFail($id);
        $updated = $this->bookings->markNoShow($booking);
        $this->audit->log('admin.turf.booking.no_show', Auth::user(), $updated, null, null, $request);

        return response()->json($this->bookings->payload($updated));
    }

    public function markCompleted(Request $request, int $id)
    {
        $this->ensureAdmin();
        $booking = Booking::with(['items.court', 'turf'])->findOrFail($id);
        $updated = $this->bookings->markCompleted($booking);
        $this->audit->log('admin.turf.booking.completed', Auth::user(), $updated, null, null, $request);

        return response()->json($this->bookings->payload($updated));
    }

    public function getSettings()
    {
        $this->ensureAdmin();

        return response()->json($this->turfSettingsPayload());
    }

    public function updateSettings(Request $request)
    {
        $this->ensureAdmin();

        $data = $request->validate([
            'turf_enabled' => 'sometimes|boolean',
            'turf_booking_hold_minutes' => 'sometimes|integer|min:1|max:1440',
            'turf_cancellation_hours' => 'sometimes|integer|min:0|max:168',
            'turf_require_owner_approval' => 'sometimes|boolean',
        ]);

        foreach ($data as $key => $value) {
            PlatformSetting::setValue($key, $value);
        }

        $this->audit->log('admin.turf.settings.updated', Auth::user(), null, null, $data, $request);

        return response()->json($this->turfSettingsPayload());
    }

    protected function turfSettingsPayload(): array
    {
        return [
            'turf_enabled' => (string) PlatformSetting::getValue('turf_enabled', '1') === '1',
            'turf_booking_hold_minutes' => (int) PlatformSetting::getValue('turf_booking_hold_minutes', 10),
            'turf_cancellation_hours' => (int) PlatformSetting::getValue('turf_cancellation_hours', 2),
            'turf_require_owner_approval' => (string) PlatformSetting::getValue('turf_require_owner_approval', '1') === '1',
        ];
    }

    protected function resolveOwner(array $data): TurfOwner
    {
        if (!empty($data['owner_user_id'])) {
            $user = User::findOrFail($data['owner_user_id']);

            return TurfOwner::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'business_name' => $data['business_name'] ?? ($user->name . ' Turfs'),
                    'status' => 'active',
                ]
            );
        }

        // Platform-managed venue under the admin account
        $admin = Auth::user();

        return TurfOwner::firstOrCreate(
            ['user_id' => $admin->id],
            [
                'business_name' => $data['business_name'] ?? 'Platform Venues',
                'status' => 'active',
            ]
        );
    }
}
