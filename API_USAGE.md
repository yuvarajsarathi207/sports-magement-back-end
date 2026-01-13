# API Usage Guide

## Authentication

All protected endpoints require authentication using Laravel Sanctum tokens.

### Getting a Token

1. **Register a new user:**
   ```bash
   POST /api/register
   Content-Type: application/json
   
   {
     "name": "John Doe",
     "email": "john@example.com",
     "mobile": "1234567890",
     "password": "password123",
     "role": "player"
   }
   ```

2. **Login:**
   ```bash
   POST /api/login
   Content-Type: application/json
   
   {
     "email": "john@example.com",
     "password": "password123"
   }
   ```

   Response:
   ```json
   {
     "user": { ... },
     "token": "6|YuxRBo5pyMcpMOraGyRKfNZnqKsVuwQ7dG5jKu4Dab7b101f"
   }
   ```

### Using the Token

Include the token in the `Authorization` header with the `Bearer` prefix:

```
Authorization: Bearer 6|YuxRBo5pyMcpMOraGyRKfNZnqKsVuwQ7dG5jKu4Dab7b101f
```

**Important:** Always include the word "Bearer" followed by a space before your token.

### Example API Call

```bash
curl -X GET "http://localhost:8000/api/player/dashboard" \
  -H "Authorization: Bearer 6|YuxRBo5pyMcpMOraGyRKfNZnqKsVuwQ7dG5jKu4Dab7b101f" \
  -H "Accept: application/json"
```

### In Swagger UI

1. Click the **"Authorize"** button (top right)
2. Enter your token: `6|YuxRBo5pyMcpMOraGyRKfNZnqKsVuwQ7dG5jKu4Dab7b101f`
   - Swagger UI will automatically add "Bearer " prefix
3. Click **"Authorize"** then **"Close"**
4. All protected endpoints will now use this token

### Token Format

- **Full format:** `Bearer 6|YuxRBo5pyMcpMOraGyRKfNZnqKsVuwQ7dG5jKu4Dab7b101f`
- **In Swagger UI:** Just enter the token part (without "Bearer")
- **In cURL/Postman:** Include the full "Bearer {token}" format

### Logout

To invalidate the token:

```bash
POST /api/logout
Authorization: Bearer {your-token}
```

## Protected Endpoints

All endpoints under `/api/organizer/*` and `/api/player/*` require authentication.

## Error Responses

- **401 Unauthenticated:** Token is missing or invalid
  ```json
  {
    "message": "Unauthenticated."
  }
  ```

- **403 Forbidden:** User doesn't have the required role
  ```json
  {
    "message": "Unauthorized"
  }
  ```

