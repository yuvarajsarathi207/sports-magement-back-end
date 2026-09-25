<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureModuleAccess
{
    public function handle(Request $request, Closure $next, string $moduleCode): Response
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $permission = 'module.' . $moduleCode . '.access';
        if (!$user->hasPermission($permission)) {
            return response()->json([
                'message' => 'You do not have access to this module.',
                'module' => $moduleCode,
            ], 403);
        }

        return $next($request);
    }
}
