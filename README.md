# Tournament Management API

A Laravel-based REST API for managing tournaments, designed for Android mobile applications. This API supports both organizers and players with role-based access control.

## Features

- User authentication (Register/Login) with role-based access (Organizer/Player)
- Tournament management (Create, List, View, Update, Publish)
- Player interactions (Express Interest, Subscribe, Payment)
- Sports category management
- Swagger/OpenAPI documentation
- PostgreSQL database
- Docker containerization

## Tech Stack

- Laravel 10
- PostgreSQL 15
- Docker & Docker Compose
- Laravel Sanctum (API Authentication)
- L5-Swagger (API Documentation)

## Prerequisites

- Docker
- Docker Compose

## Installation

### Quick Setup (Recommended)

Run the unified management script:

```bash
./manage.sh setup
```

This will:
- Configure `.env` file for Docker
- Build and start Docker containers
- Install dependencies
- Generate application key
- Fix permissions
- Run migrations
- Seed database
- Generate Swagger documentation

### Manual Setup

1. Copy the environment file:
```bash
cp .env.example .env
```

2. Build and start the Docker containers:
```bash
docker-compose up -d --build
```

3. Install PHP dependencies:
```bash
./manage.sh composer install
```

4. Generate application key:
```bash
./manage.sh artisan key:generate
```

5. Run database migrations:
```bash
./manage.sh migrate
```

6. Seed the database:
```bash
./manage.sh seed
```

7. Generate Swagger documentation:
```bash
./manage.sh swagger
```

## Access Points

- **API Base URL**: `http://localhost:8000/api`
- **Swagger Documentation**: `http://localhost:8000/api/documentation`

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

## Management Script

The project includes a unified management script (`manage.sh`) for common tasks:

### Available Commands

```bash
./manage.sh setup          # Complete project setup (first time)
./manage.sh start          # Start Docker containers
./manage.sh stop           # Stop Docker containers
./manage.sh restart        # Restart Docker containers
./manage.sh build          # Build Docker containers
./manage.sh env            # Update .env file with Docker config
./manage.sh permissions    # Fix storage permissions
./manage.sh cache          # Clear all Laravel caches
./manage.sh swagger        # Fix and regenerate Swagger docs
./manage.sh migrate        # Run database migrations
./manage.sh seed           # Seed database
./manage.sh logs           # Show application logs
./manage.sh shell          # Open shell in app container
./manage.sh composer [cmd] # Run composer command
./manage.sh artisan [cmd]  # Run artisan command
./manage.sh help           # Show help message
```

### Examples

```bash
# Setup project for first time
./manage.sh setup

# Run migrations
./manage.sh migrate

# Clear caches
./manage.sh cache

# Fix Swagger
./manage.sh swagger

# Run custom artisan command
./manage.sh artisan route:list

# Run custom composer command
./manage.sh composer require package/name
```

### Docker Commands (Direct)

If you prefer using docker-compose directly:

- Start containers: `docker-compose up -d`
- Stop containers: `docker-compose down`
- View logs: `docker-compose logs -f app`
- Execute commands: `docker-compose exec app <command>`
- Database access: `docker-compose exec db psql -U kp_user -d kp_tournament`

## Development

### Running Migrations
```bash
./manage.sh migrate
# or
./manage.sh artisan migrate
```

### Running Migrations with Rollback
```bash
./manage.sh artisan migrate:rollback
```

### Creating New Migrations
```bash
./manage.sh artisan make:migration create_table_name
```

### Generating Swagger Documentation
```bash
./manage.sh swagger
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
