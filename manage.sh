#!/bin/bash

# Tournament Management API - Unified Management Script
# Usage: ./manage.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}→${NC} $1"
}

# Update .env file with Docker configuration
update_env() {
    ENV_FILE=".env"

    if [ ! -f "$ENV_FILE" ]; then
        print_info "Creating .env file from .env.example..."
        cp .env.example .env
    else
        print_info "Updating .env file with Docker configuration..."
    fi

    # Update database configuration for Docker
    sed -i 's/^DB_CONNECTION=.*/DB_CONNECTION=pgsql/' "$ENV_FILE"
    sed -i 's/^DB_HOST=.*/DB_HOST=db/' "$ENV_FILE"
    sed -i 's/^DB_PORT=.*/DB_PORT=5432/' "$ENV_FILE"
    sed -i 's/^DB_DATABASE=.*/DB_DATABASE=kp_tournament/' "$ENV_FILE"
    sed -i 's/^DB_USERNAME=.*/DB_USERNAME=kp_user/' "$ENV_FILE"
    sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=kp_password/' "$ENV_FILE"

    # Update app configuration
    sed -i 's|^APP_URL=.*|APP_URL=http://localhost:8000|' "$ENV_FILE"
    sed -i 's/^APP_NAME=.*/APP_NAME="Tournament Management"/' "$ENV_FILE"

    # Add Swagger configuration if not present
    if ! grep -q "L5_SWAGGER_GENERATE_ALWAYS" "$ENV_FILE"; then
        echo "" >> "$ENV_FILE"
        echo "L5_SWAGGER_GENERATE_ALWAYS=true" >> "$ENV_FILE"
        echo "L5_SWAGGER_CONST_HOST=http://localhost:8000" >> "$ENV_FILE"
    fi

    print_success ".env file updated"
}

# Fix storage permissions
fix_permissions() {
    print_info "Fixing Laravel storage permissions..."

    docker-compose exec app bash -c "
        mkdir -p storage/framework/cache/data
        mkdir -p storage/framework/sessions
        mkdir -p storage/framework/views
        mkdir -p storage/logs
        mkdir -p storage/api-docs
        mkdir -p bootstrap/cache
        chmod -R 775 storage bootstrap/cache
        chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || chmod -R 777 storage bootstrap/cache
    "

    print_success "Permissions fixed"
}

# Clear all caches
clear_cache() {
    print_info "Clearing all caches..."
    docker-compose exec app php artisan config:clear
    docker-compose exec app php artisan cache:clear
    docker-compose exec app php artisan route:clear
    docker-compose exec app php artisan view:clear
    print_success "All caches cleared"
}

# Fix Swagger
fix_swagger() {
    print_info "Fixing Swagger configuration..."
    clear_cache
    print_info "Regenerating Swagger documentation..."
    docker-compose exec app php artisan l5-swagger:generate

    if [ -f "storage/api-docs/api-docs.json" ]; then
        print_success "Swagger documentation generated ($(du -h storage/api-docs/api-docs.json | cut -f1))"
    else
        print_error "Swagger documentation file not found"
    fi
}

# Run migrations
migrate() {
    print_info "Running database migrations..."
    docker-compose exec app php artisan migrate --force
    print_success "Migrations completed"
}

# Seed database
seed() {
    print_info "Seeding database..."
    docker-compose exec app php artisan db:seed --force
    print_success "Database seeded"
}

# Show logs
logs() {
    docker-compose logs -f app
}

# Show help
show_help() {
    echo "Tournament Management API - Management Script"
    echo ""
    echo "Usage: ./manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup          - Complete project setup (first time)"
    echo "  start          - Start Docker containers"
    echo "  stop           - Stop Docker containers"
    echo "  restart        - Restart Docker containers"
    echo "  build          - Build Docker containers"
    echo "  env            - Update .env file with Docker config"
    echo "  permissions    - Fix storage permissions"
    echo "  cache          - Clear all Laravel caches"
    echo "  swagger        - Fix and regenerate Swagger docs"
    echo "  migrate        - Run database migrations"
    echo "  seed           - Seed database"
    echo "  logs           - Show application logs"
    echo "  shell          - Open shell in app container"
    echo "  composer       - Run composer command (e.g., ./manage.sh composer install)"
    echo "  artisan        - Run artisan command (e.g., ./manage.sh artisan migrate)"
    echo "  help           - Show this help message"
    echo ""
}

# Main command handler
case "$1" in
    setup)
        echo "=========================================="
        echo "Setting up Tournament Management API..."
        echo "=========================================="
        update_env
        print_info "Building and starting Docker containers..."
        docker-compose up -d --build
        print_info "Waiting for database to be ready..."
        sleep 10
        print_info "Installing PHP dependencies..."
        docker-compose exec -T app composer install --no-interaction
        print_info "Generating application key..."
        docker-compose exec -T app php artisan key:generate --force
        fix_permissions
        migrate
        seed
        fix_swagger
        echo ""
        echo "=========================================="
        print_success "Setup complete!"
        echo "=========================================="
        echo ""
        echo "API Base URL: http://localhost:8000/api"
        echo "Swagger UI: http://localhost:8000/api/documentation"
        ;;
    start)
        docker-compose up -d
        print_success "Containers started"
        ;;
    stop)
        docker-compose down
        print_success "Containers stopped"
        ;;
    restart)
        docker-compose restart
        print_success "Containers restarted"
        ;;
    build)
        docker-compose up -d --build
        print_success "Containers built and started"
        ;;
    env)
        update_env
        ;;
    permissions)
        fix_permissions
        ;;
    cache)
        clear_cache
        ;;
    swagger)
        fix_swagger
        ;;
    migrate)
        migrate
        ;;
    seed)
        seed
        ;;
    logs)
        logs
        ;;
    shell)
        docker-compose exec app bash
        ;;
    composer)
        shift
        docker-compose exec app composer "$@"
        ;;
    artisan)
        shift
        docker-compose exec app php artisan "$@"
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

