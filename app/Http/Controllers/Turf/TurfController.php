<?php

namespace App\Http\Controllers\Turf;

use App\Http\Controllers\Controller;
use App\Models\Turf\Booking;
use App\Models\Turf\Court;
use App\Models\Turf\Turf;
use App\Services\Platform\AuditLogger;
use App\Services\Platform\PaymentService;
use App\Services\Turf\BookingService;
use Illuminate\Http\Request;

class TurfController extends Controller
{
    public function __construct(private BookingService $bookings)
    {
    }

    public function index(Request $request)
    {
        $query = Turf::published()->with(['courts.sport', 'owner']);

        if ($request->filled('city')) {
            $query->where('city', 'like', '%' . $request->city . '%');
        }
        if ($request->filled('state')) {
            $query->where('state', $request->state);
        }
        if ($request->filled('sport_id')) {
            $query->whereHas('courts', fn ($q) => $q->where('sports_category_id', $request->sport_id));
        }
        if ($request->filled('min_price')) {
            $query->whereHas('courts', fn ($q) => $q->where('base_price', '>=', (float) $request->min_price));
        }
        if ($request->filled('max_price')) {
            $query->whereHas('courts', fn ($q) => $q->where('base_price', '<=', (float) $request->max_price));
        }

        $turfs = $query->orderBy('name')->paginate(min((int) $request->get('per_page', 20), 50));

        return response()->json($turfs);
    }

    public function show(int $id)
    {
        $turf = Turf::published()
            ->with(['courts.sport', 'courts.availabilityRules', 'owner'])
            ->findOrFail($id);

        return response()->json($turf);
    }

    public function availability(Request $request, int $id)
    {
        $request->validate([
            'date' => 'required|date|after_or_equal:today',
            'court_id' => 'nullable|integer',
        ]);

        $turf = Turf::published()->findOrFail($id);
        $courts = $turf->courts()->where('is_active', true);
        if ($request->filled('court_id')) {
            $courts->where('id', $request->court_id);
        }

        $result = [];
        foreach ($courts->get() as $court) {
            $result[] = [
                'court_id' => $court->id,
                'court_name' => $court->name,
                'sports_category_id' => $court->sports_category_id,
                'availability' => $this->bookings->availability($court, $request->date),
            ];
        }

        return response()->json([
            'turf_id' => $turf->id,
            'date' => $request->date,
            'courts' => $result,
        ]);
    }
}
