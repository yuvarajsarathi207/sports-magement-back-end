<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Media disk
    |--------------------------------------------------------------------------
    |
    | Use "s3" when AWS credentials + bucket are configured. Falls back to
    | "public" automatically if S3 is unavailable.
    |
    */

    'disk' => env('MEDIA_DISK', 's3'),

];
