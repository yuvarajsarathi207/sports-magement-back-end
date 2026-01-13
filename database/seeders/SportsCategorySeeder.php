<?php

namespace Database\Seeders;

use App\Models\SportsCategory;
use Illuminate\Database\Seeder;

class SportsCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Football', 'description' => 'Association football tournaments'],
            ['name' => 'Basketball', 'description' => 'Basketball tournaments'],
            ['name' => 'Cricket', 'description' => 'Cricket tournaments'],
            ['name' => 'Tennis', 'description' => 'Tennis tournaments'],
            ['name' => 'Volleyball', 'description' => 'Volleyball tournaments'],
            ['name' => 'Badminton', 'description' => 'Badminton tournaments'],
            ['name' => 'Table Tennis', 'description' => 'Table tennis tournaments'],
            ['name' => 'Baseball', 'description' => 'Baseball tournaments'],
        ];

        foreach ($categories as $category) {
            SportsCategory::create($category);
        }
    }
}

