<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@tournamenthub.com'],
            [
                'name' => 'Platform Admin',
                'mobile' => '9000000001',
                'role' => 'admin',
                'password' => Hash::make('Admin@12345'),
            ]
        );
    }
}
