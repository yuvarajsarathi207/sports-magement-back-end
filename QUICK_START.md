# Quick Start Guide (Hostinger)

## Prerequisites
- PHP 8.1+ and Composer

## Setup Steps

1. **On Hostinger** (in `public_html/sports-magement-back-end`), copy env and run the script:
   ```bash
   cd ~/public_html/sports-magement-back-end
   cp .env.hostinger.example .env
   # Edit .env with your DB credentials and APP_URL=https://keepplaying.in

   chmod +x hostinger-deploy.sh
   ./hostinger-deploy.sh
   ```

   This installs dependencies, generates the app key, runs migrations, seeds the DB, generates Swagger docs, and caches config.

2. **In hPanel** set the domain document root to **`public_html/sports-magement-back-end/public`** (see [DEPLOYMENT.md](DEPLOYMENT.md)).

## Local development (no server)

```bash
./hostinger-deploy.sh   # First-time setup
php artisan serve       # API at http://localhost:8000
```

## Access Points

- **API Base URL**: `https://keepplaying.in/api` (or `http://localhost:8000/api` locally)
- **Swagger UI**: `https://keepplaying.in/api/documentation`

## After deploy – optional commands

```bash
./hostinger-deploy.sh migrate   # Run migrations only
./hostinger-deploy.sh cache     # Rebuild caches
./hostinger-deploy.sh swagger   # Regenerate API docs
```

## Test the API

### Register a User
```bash
curl -X POST https://keepplaying.in/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "1234567890",
    "password": "password123",
    "role": "organizer"
  }'
```

### Login
```bash
curl -X POST https://keepplaying.in/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create Tournament (as Organizer)
```bash
curl -X POST https://keepplaying.in/api/organizer/tournaments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sports_category_id": 1,
    "team_name": "Team Alpha",
    "location": "Stadium A",
    "start_date": "2024-02-01",
    "winning_date": "2024-02-15",
    "slot_count": 16,
    "rules": "Standard tournament rules",
    "entry_fee": 100.00
  }'
```
