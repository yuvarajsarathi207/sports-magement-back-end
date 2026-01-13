<?php

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     title="Tournament Management API",
 *     version="1.0.0",
 *     description="Tournament Management API for Android App. This API provides endpoints for managing tournaments, user authentication, and player interactions.",
 *     @OA\Contact(
 *         email="support@example.com"
 *     ),
 *     @OA\License(
 *         name="MIT",
 *         url="https://opensource.org/licenses/MIT"
 *     )
 * )
 *
 * @OA\Server(
 *     url="http://localhost:8000",
 *     description="API Server"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="sanctum",
 *     type="apiKey",
 *     in="header",
 *     name="Authorization",
 *     description="REQUIRED: Bearer token authentication. Format: 'Bearer {token}'. Example: 'Bearer 6|YuxRBo5pyMcpMOraGyRKfNZnqKsVuwQ7dG5jKu4Dab7b101f'. You MUST include the word 'Bearer' followed by a space before your token."
 * )
 */
class SwaggerController extends Controller
{
    // This controller exists only for Swagger documentation annotations
}

