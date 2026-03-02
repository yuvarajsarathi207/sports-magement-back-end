#!/bin/bash
#
# Tournament Management API – Hostinger deployment script
# Run from project root (e.g. public_html/sports-magement-back-end on Hostinger).
# No Docker required.
#
# chmod +x hostinger-deploy.sh
# Usage:
#   ./hostinger-deploy.sh          # Full setup (first deploy)
#   ./hostinger-deploy.sh fix      # Fix 500 error (permissions + cache + key)
#   ./hostinger-deploy.sh migrate  # Run migrations only
#   ./hostinger-deploy.sh cache    # Clear and rebuild caches
#   ./hostinger-deploy.sh swagger  # Regenerate API docs
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()  { echo -e "${GREEN}✓${NC} $1"; }
err() { echo -e "${RED}✗${NC} $1"; }
info() { echo -e "${YELLOW}→${NC} $1"; }

# Ensure we're in project root (parent of public/)
if [ ! -f "artisan" ]; then
    err "Run this script from the project root (where artisan lives)."
    exit 1
fi

# Create/update .env from Hostinger example if missing
env_setup() {
    if [ ! -f ".env" ]; then
        if [ -f ".env.hostinger.example" ]; then
            cp .env.hostinger.example .env
            ok "Created .env from .env.hostinger.example – edit .env with your DB and APP_URL"
        else
            cp .env.example .env
            ok "Created .env from .env.example – set DB_HOST=127.0.0.1 and your DB credentials"
        fi
    else
        info ".env exists, skipping"
    fi
}

# Storage and cache permissions (use 777 on shared hosting if 775 fails)
permissions() {
    info "Setting storage/cache permissions..."
    mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views
    mkdir -p storage/logs storage/api-docs bootstrap/cache
    chmod -R 775 storage bootstrap/cache 2>/dev/null || true
    chmod -R 777 storage bootstrap/cache 2>/dev/null || true
    ok "Permissions set"
}

# Fix 500 error: permissions, key, clear caches
run_fix() {
    echo "=========================================="
    echo "  Fixing common 500 error causes"
    echo "=========================================="
    if [ ! -f ".env" ]; then
        err ".env missing. Run: cp .env.hostinger.example .env && edit .env"
        exit 1
    fi
    if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
        info "Generating APP_KEY..."
        php artisan key:generate --force
        ok "APP_KEY set"
    fi
    info "Setting permissions (777 for storage/bootstrap/cache on shared host)..."
    chmod -R 777 storage bootstrap/cache 2>/dev/null || true
    ok "Permissions set"
    info "Clearing and rebuilding caches..."
    php artisan config:clear 2>/dev/null || true
    php artisan cache:clear 2>/dev/null || true
    php artisan route:clear 2>/dev/null || true
    php artisan view:clear 2>/dev/null || true
    php artisan config:cache
    php artisan route:cache 2>/dev/null || true
    php artisan view:cache 2>/dev/null || true
    ok "Caches rebuilt"
    echo ""
    ok "Done. If still 500, check the log:"
    echo "  tail -50 storage/logs/laravel.log"
    echo ""
    echo "Or temporarily set in .env: APP_DEBUG=true (then reload and check browser for error; set back to false after.)"
    echo ""
}

# Full setup (first deploy)
full_setup() {
    echo "=========================================="
    echo "  Hostinger deployment – full setup"
    echo "=========================================="
    env_setup
    info "Installing dependencies..."
    composer install --no-dev --optimize-autoloader --no-interaction
    if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
        php artisan key:generate --force
        ok "Application key generated"
    fi
    permissions
    info "Running migrations..."
    php artisan migrate --force
    ok "Migrations done"
    info "Seeding database..."
    php artisan db:seed --force
    ok "Database seeded"
    info "Generating Swagger docs..."
    php artisan l5-swagger:generate
    ok "Swagger generated"
    info "Caching config and routes..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    ok "Caches built"
    echo ""
    echo "=========================================="
    ok "Deployment complete."
    echo "=========================================="
    echo "  On Hostinger, set document root to:"
    echo "  public_html/sports-magement-back-end/public"
    echo ""
    echo "  API:        https://keepplaying.in/api"
    echo "  Swagger:    https://keepplaying.in/api/documentation"
    echo ""
}

# Migrations only
run_migrate() {
    php artisan migrate --force
    ok "Migrations done"
}

# Clear and rebuild caches
run_cache() {
    php artisan config:clear
    php artisan cache:clear
    php artisan route:clear
    php artisan view:clear
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    ok "Caches cleared and rebuilt"
}

# Regenerate Swagger
run_swagger() {
    php artisan l5-swagger:generate
    ok "Swagger docs generated"
}

case "${1:-}" in
    fix)     run_fix ;;
    migrate) run_migrate ;;
    cache)   run_cache ;;
    swagger) run_swagger ;;
    "")      full_setup ;;
    *)
        err "Unknown command: $1"
        echo ""
        echo "Usage: ./hostinger-deploy.sh [fix | migrate | cache | swagger]"
        echo "  (no argument = full setup)"
        exit 1
        ;;
esac
