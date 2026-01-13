# Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed

## Setup Steps

1. **Run the setup script:**
   ```bash
   ./manage.sh setup
   ```

   Or manually:

2. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Start Docker containers:**
   ```bash
   ./manage.sh build
   ```

4. **Install dependencies:**
   ```bash
   ./manage.sh composer install
   ```

5. **Generate application key:**
   ```bash
   ./manage.sh artisan key:generate
   ```

6. **Run migrations:**
   ```bash
   ./manage.sh migrate
   ```

7. **Seed database:**
   ```bash
   ./manage.sh seed
   ```

8. **Generate Swagger docs:**
   ```bash
   ./manage.sh swagger
   ```
9. **
## Access Points

- **API Base URL**: `http://localhost:8000/api`
- **Swagger UI**: `http://localhost:8000/api/documentation`

## Test the API

### Register a User
```bash
curl -X POST http://localhost:8000/api/register \
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
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create Tournament (as Organizer)
```bash
curl -X POST http://localhost:8000/api/organizer/tournaments \
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

## Common Commands

- View logs: `docker-compose logs -f`
- Stop containers: `docker-compose down`
- Restart containers: `docker-compose restart`
- Access database: `docker-compose exec db psql -U kp_user -d kp_tournament`

