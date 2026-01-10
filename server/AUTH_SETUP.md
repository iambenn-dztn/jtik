# Authentication Setup Guide

## Environment Variables

Add these to your `.env` file:

```bash
# JWT Secrets (change these in production!)
JWT_SECRET=your-super-secret-jwt-key-change-me-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-me-in-production
```

## Initial Admin Setup

### 1. Create an admin account

```bash
curl -X POST http://localhost:3001/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "YourSecurePassword123!"
  }'
```

**IMPORTANT**: For security, disable or remove the `/api/auth/setup` endpoint in production after creating your admin account.

## Authentication Flow

### 1. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "YourSecurePassword123!"
  }'
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

### 2. Access Protected Routes

Use the `accessToken` in the Authorization header:

```bash
curl -X GET http://localhost:3001/api/shopee/customers \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Refresh Access Token

When your access token expires (after 15 minutes):

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Logout

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 5. Get Current User Info

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Protected Endpoints

All the following endpoints now require authentication:

- `GET /api/shopee/customers` - List customers
- `DELETE /api/shopee/customers/:id` - Delete customer
- `GET /api/shopee/customers/export` - Export customers
- `GET /api/shopee/accounts` - List accounts
- `POST /api/shopee/accounts` - Create account
- `PUT /api/shopee/accounts/:id` - Update account
- `DELETE /api/shopee/accounts/:id` - Delete account
- `POST /api/shopee/refresh-cookie` - Refresh Shopee cookie

## Public Endpoints

These endpoints don't require authentication:

- `POST /api/shopee/transform-link` - Transform Shopee link
- `POST /api/shopee/save-info` - Save customer info
- `GET /api/health` - Health check

## Token Expiration

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days

## Security Best Practices

1. **Change JWT secrets** in production - use long, random strings
2. **Use HTTPS** in production to protect tokens
3. **Store tokens securely** on the client:
   - Access token: Memory or sessionStorage (never localStorage)
   - Refresh token: httpOnly cookie (preferred) or secure storage
4. **Disable `/api/auth/setup`** endpoint after creating admin
5. **Implement rate limiting** on auth endpoints
6. **Add token refresh logic** to frontend to auto-refresh before expiry

## MongoDB Collections

The authentication system uses:

- `admins` collection: Stores admin users with hashed passwords and refresh tokens

## Client Integration Example

```typescript
// Login
const login = async (username: string, password: string) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  // Store tokens
  sessionStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);

  return data;
};

// Make authenticated request
const getCustomers = async () => {
  const accessToken = sessionStorage.getItem("accessToken");

  const response = await fetch("/api/shopee/customers", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    // Token expired, refresh it
    await refreshAccessToken();
    return getCustomers(); // Retry
  }

  return response.json();
};

// Refresh token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();
  sessionStorage.setItem("accessToken", data.accessToken);

  return data.accessToken;
};

// Logout
const logout = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  sessionStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};
```
