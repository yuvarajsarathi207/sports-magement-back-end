<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Commerce\RecommendationEngineInterface;
use App\Services\Commerce\RuleBasedRecommendationEngine;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(RecommendationEngineInterface::class, RuleBasedRecommendationEngine::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
