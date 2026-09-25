<?php

namespace Tests\Feature\Turf;

use App\Models\Turf\Booking;
use App\Models\Turf\Court;
use App\Models\Turf\Turf;
use App\Models\Turf\TurfAvailabilityRule;
use App\Models\Turf\TurfOwner;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TurfBookingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PlatformRbacSeeder::class);
    }

    public function test_cannot_double_book_same_slot(): void
    {
        $ownerUser = User::factory()->create(['role' => 'turf_owner']);
        $ownerUser->assignRoleByName('turf_owner');
        $owner = TurfOwner::create(['user_id' => $ownerUser->id, 'business_name' => 'Test Turfs', 'status' => 'active']);

        $turf = Turf::create([
            'turf_owner_id' => $owner->id,
            'name' => 'Arena',
            'address_line1' => '1 Main',
            'city' => 'Chennai',
            'state' => 'TN',
            'status' => Turf::STATUS_PUBLISHED,
            'is_published' => true,
            'slot_duration_minutes' => 60,
        ]);

        $court = Court::create([
            'turf_id' => $turf->id,
            'name' => 'Court 1',
            'base_price' => 100,
            'is_active' => true,
        ]);

        $tomorrow = Carbon::tomorrow();
        TurfAvailabilityRule::create([
            'court_id' => $court->id,
            'day_of_week' => $tomorrow->dayOfWeek,
            'open_time' => '06:00',
            'close_time' => '22:00',
            'is_closed' => false,
        ]);

        $player1 = User::factory()->create(['role' => 'player']);
        $player1->assignRoleByName('player');
        $player2 = User::factory()->create(['role' => 'player']);
        $player2->assignRoleByName('player');

        $starts = $tomorrow->copy()->setTime(10, 0)->toIso8601String();
        $ends = $tomorrow->copy()->setTime(11, 0)->toIso8601String();

        $this->actingAs($player1, 'sanctum')
            ->postJson('/api/turf/bookings', [
                'court_id' => $court->id,
                'starts_at' => $starts,
                'ends_at' => $ends,
                'idempotency_key' => 'test-key-1',
            ])
            ->assertCreated();

        $this->actingAs($player2, 'sanctum')
            ->postJson('/api/turf/bookings', [
                'court_id' => $court->id,
                'starts_at' => $starts,
                'ends_at' => $ends,
                'idempotency_key' => 'test-key-2',
            ])
            ->assertStatus(422);

        $this->assertEquals(1, Booking::where('status', Booking::STATUS_HELD)->orWhere('status', Booking::STATUS_CONFIRMED)->count());
    }

    public function test_modules_available_endpoint(): void
    {
        $user = User::factory()->create(['role' => 'player']);
        $user->assignRoleByName('player');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/modules/available')
            ->assertOk()
            ->assertJsonStructure(['modules']);
    }
}
