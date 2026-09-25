<?php

namespace App\Services\Commerce;

use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Rule-based recommender. Swap implementation later for ML without changing API.
 */
interface RecommendationEngineInterface
{
    public function recommend(User $user, int $limit = 8): Collection;
}
