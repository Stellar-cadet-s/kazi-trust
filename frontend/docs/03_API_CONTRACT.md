# API Contract Documentation

Backend API endpoints consumed by the frontend.

## Base URL

```
http://localhost:8000
```

## Authentication

All authenticated endpoints require:
```
Authorization: Bearer <token>
```

## Endpoints

### Auth

#### POST /api/auth/login
Login user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "employer",
    "verified": true
  },
  "token": "jwt-token"
}
```

#### POST /api/auth/register
Register new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+254700000000",
  "role": "employer"
}
```

#### GET /api/auth/me
Get current user.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "employer"
}
```

### Workers

#### GET /api/workers
List workers.

**Query Params:**
- `search` (optional): Search term
- `verified` (optional): Filter by verification status

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Sarah Johnson",
      "skills": ["cleaning", "cooking"],
      "rating": 4.8,
      "reviewCount": 24,
      "location": "Nairobi",
      "verified": true
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

#### GET /api/workers/{id}
Get worker details.

### Contracts

#### GET /api/contracts
List user's contracts.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "House Cleaning",
      "description": "Weekly cleaning",
      "amount": 5000,
      "status": "active",
      "employerId": "uuid",
      "workerId": "uuid",
      "startDate": "2024-01-15",
      "location": "Nairobi"
    }
  ]
}
```

#### POST /api/contracts
Create contract.

**Request:**
```json
{
  "title": "House Cleaning",
  "description": "Weekly cleaning",
  "amount": 5000,
  "startDate": "2024-01-15",
  "location": "Nairobi"
}
```

#### GET /api/contracts/{id}
Get contract details.

#### PATCH /api/contracts/{id}/status
Update contract status.

**Request:**
```json
{
  "status": "completed"
}
```

### Escrow (Server-Side Stellar)

#### POST /api/escrow/lock
Lock funds in escrow.

**Request:**
```json
{
  "contractId": "uuid",
  "amount": 5000
}
```

#### POST /api/escrow/release
Release funds to worker.

**Request:**
```json
{
  "contractId": "uuid"
}
```

## Error Format

All errors follow this structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error
