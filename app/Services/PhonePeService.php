<?php

namespace App\Services;

use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class PhonePeService
{
    public function activeEnv(): string
    {
        return PlatformSetting::phonepeEnv();
    }

    public function credentials(?string $env = null): array
    {
        $env = $env ?: $this->activeEnv();
        $bucket = config("services.phonepe.{$env}", []);

        return [
            'client_id' => $bucket['client_id'] ?? null,
            'client_secret' => $bucket['client_secret'] ?? null,
            'merchant_id' => $bucket['merchant_id'] ?? config('services.phonepe.merchant_id'),
            'client_version' => config('services.phonepe.client_version', '1'),
        ];
    }

    public function isConfigured(?string $env = null): bool
    {
        $creds = $this->credentials($env);

        return filled($creds['client_id'])
            && filled($creds['client_secret'])
            && filled($creds['merchant_id']);
    }

    public function createPayment(string $merchantOrderId, int $amountInPaise, string $redirectUrl, array $meta = []): array
    {
        if (!$this->isConfigured()) {
            throw new RuntimeException('PhonePe is not configured for ' . $this->activeEnv() . '. Add credentials in .env.');
        }

        if ($amountInPaise < 100) {
            throw new RuntimeException('PhonePe amount must be at least 100 paise (₹1).');
        }

        $creds = $this->credentials();
        $token = $this->getAccessToken();
        $payload = [
            'merchantOrderId' => $merchantOrderId,
            'amount' => $amountInPaise,
            'expireAfter' => 1200,
            'metaInfo' => [
                'udf1' => (string) ($meta['udf1'] ?? ''),
                'udf2' => (string) ($meta['udf2'] ?? ''),
                'udf3' => (string) ($meta['udf3'] ?? ''),
                'udf4' => (string) ($meta['udf4'] ?? ''),
                'udf5' => (string) ($meta['udf5'] ?? ''),
            ],
            'paymentFlow' => [
                'type' => 'PG_CHECKOUT',
                'message' => $meta['message'] ?? 'Keep Playing payment',
                'merchantUrls' => [
                    'redirectUrl' => $redirectUrl,
                ],
            ],
        ];

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Authorization' => 'O-Bearer ' . $token,
        ])->post($this->baseUrl() . '/checkout/v2/pay', $payload);

        if (!$response->successful()) {
            Log::error('PhonePe create payment failed', [
                'env' => $this->activeEnv(),
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
            ]);
            throw new RuntimeException('Failed to initiate PhonePe payment.');
        }

        $data = $response->json();

        return [
            'orderId' => $data['orderId'] ?? null,
            'redirectUrl' => $data['redirectUrl'] ?? null,
            'state' => $data['state'] ?? null,
            'raw' => $data,
        ];
    }

    public function getOrderStatus(string $merchantOrderId): array
    {
        if (!$this->isConfigured()) {
            throw new RuntimeException('PhonePe is not configured.');
        }

        $creds = $this->credentials();
        $token = $this->getAccessToken();
        $url = $this->baseUrl() . '/checkout/v2/order/' . urlencode($merchantOrderId) . '/status';

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Authorization' => 'O-Bearer ' . $token,
            'X-MERCHANT-ID' => $creds['merchant_id'],
        ])->get($url);

        if (!$response->successful()) {
            Log::error('PhonePe status check failed', [
                'env' => $this->activeEnv(),
                'merchant_order_id' => $merchantOrderId,
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
            ]);
            throw new RuntimeException('Failed to verify PhonePe payment status.');
        }

        $data = $response->json();

        return [
            'state' => strtoupper((string) ($data['state'] ?? 'UNKNOWN')),
            'orderId' => $data['orderId'] ?? null,
            'amount' => $data['amount'] ?? null,
            'raw' => $data,
        ];
    }

    public function mapStateToPaymentStatus(string $state): string
    {
        return match (strtoupper($state)) {
            'COMPLETED', 'SUCCESS' => 'completed',
            'FAILED', 'PAYMENT_ERROR', 'ERROR' => 'failed',
            default => 'pending',
        };
    }

    protected function getAccessToken(): string
    {
        $env = $this->activeEnv();
        $cacheKey = 'phonepe_oauth_token_' . $env;

        $cached = Cache::get($cacheKey);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $creds = $this->credentials($env);
        $oauthUrl = $env === 'production'
            ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
            : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';

        $response = Http::asForm()->post($oauthUrl, [
            'client_id' => $creds['client_id'],
            'client_version' => $creds['client_version'],
            'client_secret' => $creds['client_secret'],
            'grant_type' => 'client_credentials',
        ]);

        if (!$response->successful()) {
            Log::error('PhonePe OAuth failed', [
                'env' => $env,
                'oauth_url' => $oauthUrl,
                'client_id' => $creds['client_id'],
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
            ]);
            throw new RuntimeException('Failed to authenticate with PhonePe for ' . $env . '. Check credentials in .env.');
        }

        $data = $response->json();
        $token = $data['access_token'] ?? null;
        if (!$token) {
            throw new RuntimeException('PhonePe OAuth response missing access_token.');
        }

        $expiresAt = (int) ($data['expires_at'] ?? 0);
        $ttl = $expiresAt > 0
            ? max(60, $expiresAt - time() - 60)
            : 300;

        Cache::put($cacheKey, $token, $ttl);

        return $token;
    }

    protected function baseUrl(): string
    {
        return $this->activeEnv() === 'production'
            ? 'https://api.phonepe.com/apis/pg'
            : 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    }
}
