<?php

namespace App\Services\Commerce;

use App\Models\Commerce\ProductView;
use App\Models\User;

class RecommendationService
{
    public function __construct(protected RecommendationEngineInterface $engine)
    {
    }

    public function forUser(User $user, int $limit = 8): array
    {
        $products = $this->engine->recommend($user, $limit);

        return [
            'items' => $products,
            'engine' => class_basename($this->engine),
        ];
    }

    public function trackView(User $user, int $productId): void
    {
        ProductView::create([
            'user_id' => $user->id,
            'product_id' => $productId,
            'viewed_at' => now(),
        ]);
    }
}
