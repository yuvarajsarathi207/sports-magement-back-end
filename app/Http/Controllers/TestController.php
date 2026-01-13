<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TestController extends Controller
{
    /**
     * Test endpoint to verify authentication
     */
    public function testAuth(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'authenticated' => false,
                'message' => 'User not authenticated',
                'token_present' => $request->bearerToken() !== null,
                'authorization_header' => $request->header('Authorization'),
            ], 401);
        }
        
        return response()->json([
            'authenticated' => true,
            'user' => $user,
            'token_present' => $request->bearerToken() !== null,
        ]);
    }
}

