<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('turf_owners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('business_name');
            $table->string('gstin')->nullable();
            $table->string('status', 32)->default('active');
            $table->timestamps();
        });

        Schema::create('turfs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turf_owner_id')->constrained('turf_owners')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('address_line1');
            $table->string('address_line2')->nullable();
            $table->string('city')->index();
            $table->string('state')->index();
            $table->string('district')->nullable();
            $table->string('pincode', 16)->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->string('status', 32)->default('draft')->index();
            $table->unsignedInteger('slot_duration_minutes')->default(60);
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });

        Schema::create('courts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turf_id')->constrained('turfs')->cascadeOnDelete();
            $table->string('name');
            $table->foreignId('sports_category_id')->nullable()->constrained('sports_categories')->nullOnDelete();
            $table->unsignedInteger('capacity')->nullable();
            $table->boolean('is_active')->default(true);
            $table->decimal('base_price', 10, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('turf_availability_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('court_id')->constrained('courts')->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week'); // 0=Sun .. 6=Sat
            $table->time('open_time');
            $table->time('close_time');
            $table->boolean('is_closed')->default(false);
            $table->timestamps();
            $table->unique(['court_id', 'day_of_week'], 'turf_avail_court_dow_unique');
        });

        Schema::create('turf_availability_exceptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('court_id')->constrained('courts')->cascadeOnDelete();
            $table->date('exception_date');
            $table->time('open_time')->nullable();
            $table->time('close_time')->nullable();
            $table->boolean('is_closed')->default(false);
            $table->string('reason')->nullable();
            $table->timestamps();
            $table->unique(['court_id', 'exception_date'], 'turf_exception_court_date_unique');
        });

        Schema::create('turf_price_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('court_id')->constrained('courts')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedTinyInteger('day_of_week')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->decimal('price', 10, 2);
            $table->boolean('is_peak')->default(false);
            $table->boolean('is_weekend')->default(false);
            $table->timestamps();
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('turf_id')->constrained('turfs')->cascadeOnDelete();
            $table->string('status', 32)->default('held')->index();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->string('currency', 3)->default('INR');
            $table->string('idempotency_key')->nullable()->unique();
            $table->timestamp('hold_expires_at')->nullable()->index();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancel_reason')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        Schema::create('booking_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('court_id')->constrained('courts')->cascadeOnDelete();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('line_total', 10, 2);
            $table->string('status', 32)->default('held')->index();
            $table->timestamps();

            $table->index(['court_id', 'starts_at', 'ends_at'], 'booking_items_court_range_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_items');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('turf_price_rules');
        Schema::dropIfExists('turf_availability_exceptions');
        Schema::dropIfExists('turf_availability_rules');
        Schema::dropIfExists('courts');
        Schema::dropIfExists('turfs');
        Schema::dropIfExists('turf_owners');
    }
};
