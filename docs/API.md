# Arena Africa API Reference

## Overview

Arena Africa provides a RESTful JSON API that mirrors the functionality available in the web dashboard and mobile PWA. All API endpoints require authentication via Bearer token or the `arena_token` HTTP-only cookie.

## Base URL

All API endpoints are relative to the origin:
```
https://arena.africa/api
```

## Authentication

### Methods

1. **Bearer Token** (Recommended for programmatic access):
   ```
   Authorization: Bearer <token>
   ```

2. **Cookie** (Used by web dashboard):
   ```
   arena_token=<token>
   ```

### Token Format

Tokens are HMAC-SHA256 signed JSON payloads containing:
- `userId`: Numeric user identifier
- `phoneNumber`: User's phone number in E.164 format
- `exp`: Unix timestamp expiration (7 days from issuance)
- `iat`: Issued at timestamp
- `sig`: HMAC-SHA256 signature

Tokens are generated via:
- `POST /api/auth/login` (demo profile selection)
- Future: PIN-based authentication (framework ready)

### Token Validation

The API validates tokens by:
1. Verifying HMAC signature using `AUTH_SECRET`
2. Checking expiration timestamp
3. Confirming user exists and is active

## Rate Limits

All API endpoints are rate-limited per IP address:

| Method | Limit | Window | Response |
|--------|-------|--------|----------|
| GET    | 60    | 1 minute | 429 Too Many Requests |
| POST   | 20    | 1 minute | 429 Too Many Requests |
| PUT/PATCH/DELETE | 20 | 1 minute | 429 Too Many Requests |

Rate limit responses include:
- Status: 429
- Body: `{ success: false, error: "Rate limit exceeded", retryAfter: <seconds> }`
- Headers: `Retry-After: <seconds>`

## Error Format

All errors return a consistent JSON structure:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "retryAfter": null, // Only for rate limiting
  "code": "ERROR_CODE" // Machine-readable error code
}
```

## Endpoints

### Authentication

#### POST `/api/auth/login`
Login via demo profile selection (PIN auth framework ready but not wired).

**Request Body:**
```json
{
  "userId": 1
}
```

**Response:**
```json
{
  "success": true,
  "token": "<hmac-sha256-token>",
  "user": {
    "id": 1,
    "phoneNumber": "+254712345678",
    "name": "John Doe",
    "country": "Kenya",
    "currency": "KES",
    "balance": 2500,
    "role": "MEMBER",
    "status": "ACTIVE",
    "kycTier": "BASIC"
  }
}
```

#### POST `/api/auth/register`
Register a new user (currently redirects to profile selection).

**Request Body:**
```json
{
  "phoneNumber": "+254712345678",
  "name": "John Doe",
  "country": "Kenya",
  "currency": "KES"
}
```

**Response:**
- Redirects to login flow for profile selection

### Markets

#### GET `/api/markets`
List all markets with optional filtering.

**Query Parameters:**
- `category`: Filter by category (politics, sports, etc.)
- `locale`: Filter by locale (en, sw, fr, pt)
- `status`: Filter by status (OPEN, RESOLVED)
- `limit`: Limit results (default 50, max 100)
- `offset`: Pagination offset

**Response:**
```json
{
  "success": true,
  "markets": [
    {
      "id": 1,
      "title": "Will Kenya win the AFCON 2025?",
      "description": "Predict if the Harambee Stars will lift the trophy",
      "category": "sports",
      "locale": "en",
      "endsAt": "2025-02-15T20:00:00Z",
      "status": "OPEN",
      "winningOutcome": null,
      "oddsYes": 1.85,
      "oddsNo": 1.85,
      "volume": 15000,
      "isFeatured": true,
      "createdAt": "2024-09-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### POST `/api/markets`
Create a new market (ADMIN/RESOLVER only).

**Request Body:**
```json
{
  "title": "Will rains come early this season?",
  "description": "Predict if the long rains will start before March 20",
  "category": "climate",
  "endsAt": "2025-03-20T00:00:00Z",
  "oddsYes": 2.10,
  "oddsNo": 1.75,
  "isFeatured": false
}
```

**Response:**
```json
{
  "success": true,
  "market": {
    // Market object as above
  }
}
```

#### GET `/api/markets/:id`
Get a specific market.

**Response:** Same as single market object in list above.

### Predictions

#### GET `/api/predictions`
Get predictions for the current user has made.

**Query Parameters:**
- `marketId`: Filter by specific market
- `limit`: Limit results
- `offset`: Pagination offset

**Response:**
```json
{
  "success": true,
  "predictions": [
    {
      "id": 1,
      "marketId": 1,
      "userId": 1,
      "outcome": "YES",
      "amount": 500,
      "potentialPayout": 925,
      "currency": "KES",
      "platform": "WEB",
      "exchangeRate": 0.0077,
      "createdAt": "2024-09-15T14:30:00Z"
    }
  ],
  "count": 1
}
```

#### POST `/api/predictions`
Place a new prediction.

**Request Body:**
```json
{
  "marketId": 1,
  "outcome": "YES",
  "amount": 1000,
  "platform": "WEB"
}
```

**Notes:**
- `userId` and `currency` are derived from authenticated user
- Policy engine enforces KYC limits, velocity checks, etc.
- Exchange rate snapshot stored for audit trail

**Response:**
```json
{
  "success": true,
  "prediction": {
    // Prediction object as above
  },
  "newBalance": 1500,
  "potentialPayout": 1850
}
```

### Wallet

#### GET `/api/wallet`
Get current user's wallet information.

**Response:**
```json
{
  "success": true,
  "wallet": {
    "userId": 1,
    "balance": 2500,
    "currency": "KES",
    "holdings": {
      "KES": 2500,
      "USD": 19.25
    }
  }
}
```

#### POST `/api/wallet/deposit`
Simulate mobile money deposit.

**Request Body:**
```json
{
  "amount": 5000,
  "provider": "M-PESA",
  "phoneNumber": "+254712345678"
}
```

**Response:**
```json
{
  "success": true,
  "reference": "MPA1B2C3D4",
  "newBalance": 7500
}
```

#### POST `/api/wallet/withdraw`
Simulate mobile money withdrawal.

**Request Body:**
```json
{
  "amount": 2000,
  "provider": "MTN_MOMO",
  "phoneNumber": "+254712345678"
}
```

**Response:**
```json
{
  "success": true,
  "reference": "MTN5E6F7G8",
  "newBalance": 5500
}
```

#### GET `/api/wallet/transactions`
Get user's transaction history.

**Query Parameters:**
- `type`: Filter by type (DEPOSIT, WITHDRAWAL, PREDICT_BUY, PREDICT_PAYOUT)
- `limit`: Limit results
- `offset`: Pagination offset

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "userId": 1,
      "type": "DEPOSIT",
      "amount": 5000,
      "currency": "KES",
      "provider": "M-PESA",
      "reference": "MPA1B2C3D4",
      "phoneNumber": "+254712345678",
      "status": "SUCCESS",
      "createdAt": "2024-09-15T13:00:00Z"
    }
  ],
  "count": 1
}
```

### Chamas

#### GET `/api/chamas`
Get list of available chamas.

**Query Parameters:**
- `marketId`: Filter by associated market
- `limit`: Limit results
- `offset`: Pagination offset

**Response:**
```json
{
  "success": true,
  "chamas": [
    {
      "id": 1,
      "name": "Nairobi Harambee Stars Fans",
      "marketId": 1,
      "code": "CHAMA-882",
      "targetOutcome": "YES",
      "totalAmount": 15000,
      "currency": "KES",
      "memberCount": 15,
      "createdAt": "2024-09-14T16:30:00Z"
    }
  ],
  "count": 1
}
```

#### POST `/api/chamas`
Create a new chama.

**Request Body:**
```json
{
  "name": "Uganda Cranes Supporters",
  "marketId": 2,
  "targetOutcome": "NO",
  "contribution": 1000
}
```

**Response:**
```json
{
  "success": true,
  "chama": {
    // Chama object as above
  },
  "inviteCode": "CHAMA-991"
}
```

#### POST `/api/chamas/:id/join`
Join an existing chama.

**Request Body:**
```json
{
  "contribution": 500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully joined chama",
  "newTotal": 15500
}
```

### Policy Engine

#### GET `/api/policy/evaluate`
Evaluate an action against the policy engine (for introspection/debugging).

**Query Parameters:**
- `action`: Capability to check (e.g., "predict:create")
- `amount`: Transaction amount (optional)
- `channel`: WEB|MOBILE|USSD|API (default: WEB)

**Request Body:**
```json
{
  // PolicyContext object as defined in src/lib/policy.ts
  "subject": {
    "userId": 1,
    "role": "MEMBER",
    "status": "ACTIVE",
    "kycTier": "BASIC",
    "countryCode": "KE",
    "currency": "KES",
    "balance": 5000
  },
  "resource": {
    "type": "market",
    "id": 1,
    "status": "OPEN"
  }
}
```

**Response:**
```json
{
  "success": true,
  "decision": {
    "effect": "ALLOW",
    "allowed": true,
    "reasons": ["User has sufficient KYC tier", "Amount within limits"],
    "codes": [],
    "matchedRules": ["rbac.capability", "kyc.per_transaction"],
    "obligations": [],
    "evaluatedAt": "2024-09-15T14:30:00Z"
  }
}
```

#### POST `/api/policy/evaluate`
Same as GET but with request body for complex contexts.

### USSD Simulator

#### POST `/api/ussd`
Process USSD menu input (simulated).

**Request Body:**
```json
{
  "input": "1*2*3",
  "phoneNumber": "+254712345678",
  "sessionId": "ussd_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "ussdResponse": "CON Enter amount:\n1. 500 KES\n2. 1000 KES\n3. Other amount",
  "sessionState": "amount_menu",
  "shouldClose": false
}
```

### Health Check

#### GET `/api/health`
Simple health check endpoint (exempt from rate limiting).

**Response:**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2024-09-15T14:30:00Z",
  "version": "1.0.0"
}
```

## WebSocket (Future)

Real-time updates via WebSocket are planned but not yet implemented.

## SDKs

Official SDKs are available for:
- JavaScript/TypeScript: `npm install @arena-africa/sdk`
- Python: `pip install arena-africa-sdk`
- Coming soon: Android, iOS, Flutter

## Versioning

API is versionless; breaking changes will be introduced via new endpoints or deprecated with 6-month notice.

## Postman Collection

Download the official Postman collection: [Arena Africa API.postman.json](link-to-be-provided)

## Support

For API questions:
- Email: api-support@arena.africa
- Documentation: https://docs.arena.africa
- Status: https://status.arena.africa

---

**Last Updated**: 2026-09-16
**API Version**: 1.0.0