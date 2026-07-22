<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaStorage
{
    public static function diskName(): string
    {
        $preferred = config('media.disk', 's3');

        if ($preferred !== 's3') {
            return 'public';
        }

        $s3 = config('filesystems.disks.s3', []);
        $configured = !empty($s3['key']) && !empty($s3['secret']) && !empty($s3['bucket']);
        $adapterReady = class_exists(\League\Flysystem\AwsS3V3\AwsS3V3Adapter::class);

        return ($configured && $adapterReady) ? 's3' : 'public';
    }

    public static function usingS3(): bool
    {
        return static::diskName() === 's3';
    }

    /**
     * Store an uploaded file and return the relative path.
     */
    public static function store(UploadedFile $file, string $directory): string
    {
        $disk = static::diskName();
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin');
        $name = Str::uuid()->toString().'.'.$ext;

        return $file->storeAs($directory, $name, [
            'disk' => $disk,
            'visibility' => 'public',
        ]);
    }

    /**
     * Public URL for a stored path (or passthrough absolute URLs).
     */
    public static function url(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://', '//'])) {
            return $path;
        }

        // Legacy paths written as /storage/...
        if (Str::startsWith($path, '/storage/')) {
            return url($path);
        }

        if (Str::startsWith($path, 'storage/')) {
            return url('/'.$path);
        }

        return Storage::disk(static::diskName())->url($path);
    }
}
