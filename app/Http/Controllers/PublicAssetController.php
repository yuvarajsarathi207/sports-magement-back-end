<?php

namespace App\Http\Controllers;

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

    public function manifest(): BinaryFileResponse
    {
        return $this->file('manifest.webmanifest', 'application/manifest+json');
    }

    public function serviceWorker(): BinaryFileResponse
    {
        return $this->file('sw.js', 'application/javascript; charset=UTF-8');
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

        return response()->file($real, ['Content-Type' => $mime]);
    }
}
