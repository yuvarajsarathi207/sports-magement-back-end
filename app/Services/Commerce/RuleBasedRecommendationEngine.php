<?php

namespace App\Services\Commerce;

use App\Models\Commerce\Product;
use App\Models\Commerce\ProductView;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Support\Collection;

class RuleBasedRecommendationEngine implements RecommendationEngineInterface
{
    public function recommend(User $user, int $limit = 8): Collection
    {
        $sportIds = $this->resolveSportIds($user);
        $viewedIds = ProductView::where('user_id', $user->id)
            ->orderByDesc('viewed_at')
            ->limit(20)
            ->pluck('product_id')
            ->all();

        $query = Product::query()
            ->with(['images', 'brand', 'category', 'sportsCategory', 'variants'])
            ->where('status', Product::STATUS_ACTIVE);

        if (!empty($sportIds)) {
            $query->whereIn('sports_category_id', $sportIds);
        }

        $products = $query->latest('id')->limit($limit * 3)->get();

        // Prefer matching sports, then recently viewed affinity, then newest
        $ranked = $products->sortByDesc(function (Product $product) use ($sportIds, $viewedIds) {
            $score = 0;
            if ($product->sports_category_id && in_array($product->sports_category_id, $sportIds, true)) {
                $score += 100;
            }
            if (in_array($product->id, $viewedIds, true)) {
                $score += 40;
            }
            if ($product->variants->contains(fn ($v) => $v->available_quantity > 0)) {
                $score += 10;
            }

            return $score;
        })->values();

        if ($ranked->count() < $limit) {
            $extra = Product::with(['images', 'brand', 'category', 'sportsCategory', 'variants'])
                ->where('status', Product::STATUS_ACTIVE)
                ->whereNotIn('id', $ranked->pluck('id'))
                ->latest('id')
                ->limit($limit - $ranked->count())
                ->get();
            $ranked = $ranked->concat($extra);
        }

        return $ranked->take($limit)->values();
    }

    protected function resolveSportIds(User $user): array
    {
        if ($user->isPlayer()) {
            return Tournament::query()
                ->whereHas('subscriptions', fn ($q) => $q->where('player_id', $user->id))
                ->orWhereHas('interests', fn ($q) => $q->where('player_id', $user->id))
                ->pluck('sports_category_id')
                ->filter()
                ->unique()
                ->values()
                ->all();
        }

        if ($user->isOrganizer()) {
            return Tournament::query()
                ->where('organizer_id', $user->id)
                ->pluck('sports_category_id')
                ->filter()
                ->unique()
                ->values()
                ->all();
        }

        return [];
    }
}
