<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tournaments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organizer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('sports_category_id')->constrained('sports_categories')->onDelete('cascade');
            $table->string('team_name');
            $table->string('location');
            $table->text('location_details')->nullable();
            $table->date('start_date');
            $table->date('winning_date');
            $table->integer('slot_count');
            $table->text('template')->nullable();
            $table->text('rules');
            $table->decimal('entry_fee', 10, 2);
            $table->text('price_details')->nullable();
            $table->string('ball_type')->nullable();
            $table->enum('status', ['draft', 'open', 'active', 'expired', 'published'])->default('draft');
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournaments');
    }
};

