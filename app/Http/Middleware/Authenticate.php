<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * Since this is an API-only project, always return null to get JSON responses.
     */
    protected function redirectTo(Request $request): ?string
    {
        // API-only project - always return JSON responses, never redirect
        return null;
    }
}
