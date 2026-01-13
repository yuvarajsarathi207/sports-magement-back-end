#!/bin/bash

set -e

echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  sleep 0.1
done

echo "Database is ready!"

# Fix permissions for storage and cache directories
echo "Setting up storage permissions..."
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p storage/api-docs
mkdir -p bootstrap/cache

# Set proper permissions
# The container should run as root initially to set permissions
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R 775 storage bootstrap/cache

# Install dependencies if vendor doesn't exist
if [ ! -d "vendor" ]; then
    echo "Installing composer dependencies..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    echo "Generating application key..."
    php artisan key:generate --force
fi

# Run migrations
echo "Running migrations..."
php artisan migrate --force

# Ensure storage directory exists for Swagger docs
mkdir -p storage/api-docs

# Generate Swagger docs
echo "Generating Swagger documentation..."
php artisan l5-swagger:generate

echo "Application is ready!"

exec "$@"

