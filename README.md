# Tournament Management API

A Laravel-based REST API for managing tournaments, designed for Android mobile applications. This API supports both organizers and players with role-based access control.

## Features

- User authentication (Register/Login) with role-based access (Organizer/Player)
- Tournament management (Create, List, View, Update, Publish)
- Player interactions (Express Interest, Subscribe, Payment)
- Sports category management
- Swagger/OpenAPI documentation
- PostgreSQL or MySQL database

## Tech Stack

- Laravel 10
- PostgreSQL or MySQL
- Laravel Sanctum (API Authentication)
- L5-Swagger (API Documentation)

## Prerequisites

- **PHP 8.1+** and **Composer**

## Installation (Hostinger / no Docker)

1. Copy the environment file and set your database and `APP_URL`:
   ```bash
   cp .env.hostinger.example .env
   # Edit .env with your DB credentials and https://keepplaying.in
   ```

2. Run the deployment script (full setup: install, key, permissions, migrate, seed, swagger, cache):
   ```bash
   chmod +x hostinger-deploy.sh
   ./hostinger-deploy.sh
   ```

3. Point your domain’s **document root** to the `public/` folder. See **[DEPLOYMENT.md](DEPLOYMENT.md)** for Hostinger steps.

**Local development** (no web server):

```bash
php artisan serve
# API: http://localhost:8000/api
# Swagger: http://localhost:8000/api/documentation
```

**After first deploy** you can run:

```bash
./hostinger-deploy.sh migrate   # Run migrations only
./hostinger-deploy.sh cache     # Rebuild caches
./hostinger-deploy.sh swagger   # Regenerate API docs
```

## Access Points

- **API Base URL**: `https://keepplaying.in/api` (production) or `http://localhost:8000/api` (local)
- **Swagger Documentation**: `https://keepplaying.in/api/documentation` or `http://localhost:8000/api/documentation`

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user (requires authentication)

### Sports Categories
- `GET /api/sports-categories` - List all sports categories

### Organizer Endpoints (requires authentication)
- `GET /api/organizer/dashboard` - Get organizer dashboard
- `GET /api/organizer/tournaments` - List all tournaments
- `POST /api/organizer/tournaments` - Create a new tournament
- `GET /api/organizer/tournaments/{id}` - View tournament details
- `PUT /api/organizer/tournaments/{id}` - Update tournament
- `POST /api/organizer/tournaments/{id}/publish` - Publish tournament

### Player Endpoints (requires authentication)
- `GET /api/player/dashboard` - Get player dashboard
- `GET /api/player/profile` - Get player profile
- `PUT /api/player/profile` - Update player profile
- `GET /api/player/tournaments` - List published tournaments
- `GET /api/player/tournaments/{id}` - View tournament basic details
- `POST /api/player/tournaments/{id}/interest` - Express interest in tournament
- `POST /api/player/tournaments/{id}/subscribe` - Subscribe to tournament
- `GET /api/player/tournaments/{id}/details` - Get full tournament details (requires subscription)
- `POST /api/player/subscriptions/{id}/pay` - Pay for subscription

## Database Schema

### Users
- id, name, email, mobile, role (organizer/player), password, timestamps

### Sports Categories
- id, name, description, timestamps

### Tournaments
- id, organizer_id, sports_category_id, team_name, location, location_details, start_date, winning_date, slot_count, template, rules, entry_fee, price_details, ball_type, status (draft/open/active/expired/published), is_published, timestamps

### Tournament Interests
- id, tournament_id, player_id, timestamps

### Subscriptions
- id, tournament_id, player_id, status (pending/active/cancelled), timestamps

### Payments
- id, subscription_id, tournament_id, player_id, amount, status (pending/completed/failed/refunded), payment_method, transaction_id, payment_details, timestamps

## Hostinger deployment script

Single script for Hostinger (or any PHP host without Docker):

```bash
./hostinger-deploy.sh          # Full setup (first deploy)
./hostinger-deploy.sh migrate  # Run migrations only
./hostinger-deploy.sh cache    # Clear and rebuild caches
./hostinger-deploy.sh swagger  # Regenerate Swagger docs
```

Run from the project root (where `artisan` lives). See **[DEPLOYMENT.md](DEPLOYMENT.md)** for full Hostinger steps.

## Development

### Running Migrations
```bash
php artisan migrate
# or
./hostinger-deploy.sh migrate
```

### Running Migrations with Rollback
```bash
php artisan migrate:rollback
```

### Creating New Migrations
```bash
php artisan make:migration create_table_name
```

### Generating Swagger Documentation
```bash
php artisan l5-swagger:generate
# or
./hostinger-deploy.sh swagger
```

## Testing

To test the API, you can use:
- Swagger UI at `http://localhost:8000/api/documentation`
- Postman
- cURL
- Any HTTP client

## Authentication

The API uses Laravel Sanctum for authentication. Include the token in the Authorization header:

```
Authorization: Bearer {your-token}
```

## Notes

- The payment flow is simplified. In production, integrate with a proper payment gateway.
- Location details are hidden from players until they subscribe.
- Tournament statuses: draft → open → active → expired (or published directly)

## License

MIT
