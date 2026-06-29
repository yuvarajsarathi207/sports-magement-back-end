<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PublicAssetController extends Controller
{
    private const MIME = [
        'webmanifest' => 'application/manifest+json',
        'json' => 'application/json',
        'js' => 'application/javascript; charset=UTF-8',
        'css' => 'text/css; charset=UTF-8',
        'png' => 'image/png',
        'ico' => 'image/x-icon',
        'svg' => 'image/svg+xml',
        'txt' => 'text/plain; charset=UTF-8',
    ];

    public function manifest(): JsonResponse
    {
        return response()->json([
            'id' => '/',
            'name' => 'Tournament Hub',
            'short_name' => 'Tournaments',
            'description' => 'Browse, join, and manage sports tournaments',
            'start_url' => '/app/',
            'scope' => '/',
            'display' => 'standalone',
            'orientation' => 'portrait',
            'background_color' => '#f0f4f8',
            'theme_color' => '#1e3a5f',
            'icons' => [
                [
                    'src' => url('/icons/icon-192.png'),
                    'sizes' => '192x192',
                    'type' => 'image/png',
                    'purpose' => 'any',
                ],
                [
                    'src' => url('/icons/icon-512.png'),
                    'sizes' => '512x512',
                    'type' => 'image/png',
                    'purpose' => 'any',
                ],
                [
                    'src' => url('/icons/icon-512.png'),
                    'sizes' => '512x512',
                    'type' => 'image/png',
                    'purpose' => 'maskable',
                ],
            ],
        ], 200, [
            'Content-Type' => 'application/manifest+json',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    public function serviceWorker(): BinaryFileResponse
    {
        $response = $this->file('sw.js', 'application/javascript; charset=UTF-8');
        $response->headers->set('Service-Worker-Allowed', '/');

        return $response;
    }

    public function pwaIcon192(): BinaryFileResponse
    {
        return $this->file('icons/icon-192.png', 'image/png');
    }

    public function pwaIcon512(): BinaryFileResponse
    {
        return $this->file('icons/icon-512.png', 'image/png');
    }

    public function asset(Request $request, string $folder, string $path): BinaryFileResponse
    {
        return $this->file($folder . '/' . $path);
    }

    private function file(string $relative, ?string $mime = null): BinaryFileResponse
    {
        $full = public_path($relative);
        $real = realpath($full);
        $publicRoot = realpath(public_path());

        abort_unless($real && $publicRoot && str_starts_with($real, $publicRoot) && is_file($real), 404);

        if (!$mime) {
            $ext = strtolower(pathinfo($real, PATHINFO_EXTENSION));
            $mime = self::MIME[$ext] ?? 'application/octet-stream';
        }

        return response()->file($real, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=604800',
        ]);
    }
}
