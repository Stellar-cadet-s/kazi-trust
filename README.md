# Kazi Trust – API Reference

Stellar-based job platform with escrow, M-Pesa deposits, and mobile money payouts.

**Base URL:** `http://localhost:8000/api` (or your deployment host)

---

## Table of Contents

1. [Authentication](#authentication)
2. [USSD](#ussd)
3. [Job Listings](#job-listings)
4. [Payment Callbacks](#payment-callbacks)

---

## Authentication

### Register (create account)

**Endpoint:** `POST /api/auth/register/`  
**Auth:** None

**Request (JSON):**

```json
{
    "phone_number": "254700111001",
    "password": "YourSecurePass123!",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "user_type": "employer"
}
```

| Field          | Type   | Required | Description                          |
|----------------|--------|----------|--------------------------------------|
| `phone_number` | string | Yes      | Unique; format `254XXXXXXXXX` or `07XXXXXXXX` |
| `password`     | string | Yes      | Min 6 characters                     |
| `email`        | string | No       | Unique if provided                    |
| `first_name`   | string | No       |                                      |
| `last_name`    | string | No       |                                      |
| `user_type`    | string | No       | `"employer"` or `"employee"` (default: `"employer"`) |

**Response `201 Created`:**

```json
{
    "message": "User registered successfully",
    "user": {
        "id": 1,
        "phone_number": "254700111001",
        "email": "user@example.com",
        "user_type": "employer"
    },
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Error `400` (e.g. duplicate phone):**

```json
{
    "phone_number": ["A user with this phone number already exists."]
}
```

---

### Login

**Endpoint:** `POST /api/auth/login/`  
**Auth:** None

**Request – by phone:**

```json
{
    "phone_number": "254700111001",
    "password": "YourSecurePass123!"
}
```

**Request – by email:**

```json
{
    "email": "user@example.com",
    "password": "YourSecurePass123!"
}
```

**Response `200 OK`:**

```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "phone_number": "254700111001",
        "email": "user@example.com",
        "user_type": "employer"
    }
}
```

**Error `400`:**

```json
{
    "non_field_errors": ["Invalid credentials."]
}
```

---

## USSD

### USSD main handler

**Endpoint:** `POST /api/ussd/`  
**Auth:** None  
**Content-Type:** `application/json` or `application/x-www-form-urlencoded`

**Request (JSON):**

```json
{
    "sessionId": "unique_session_id_123",
    "phoneNumber": "254712345678",
    "text": "1*1*John*Doe*john@example.com"
}
```

| Field         | Type   | Description                    |
|---------------|--------|--------------------------------|
| `sessionId`   | string | Unique per USSD session        |
| `phoneNumber` | string | Caller MSISDN                  |
| `text`        | string | User input; levels split by `*` |

**Response `200 OK` (plain text, USSD format):**

```
CON Welcome to Transparency Platform
1. Register
2. Login
3. Client Services
4. Employee Services
5. Admin Services
```

Other responses use `CON` (continue) or `END` (end session).

---

### USSD registration callback

**Endpoint:** `POST /api/ussd/register-callback/`  
**Auth:** None  

Used when a user completes registration via USSD.

**Request (JSON):**

```json
{
    "phone_number": "254700111003",
    "user_type": "employee"
}
```

| Field          | Type   | Required | Description        |
|----------------|--------|----------|--------------------|
| `phone_number` | string | Yes      | User’s phone       |
| `user_type`    | string | No       | `"employer"` / `"employee"` |

**Response `201 Created` (new user):**

```json
{
    "message": "User registered via USSD",
    "user_id": 3,
    "phone_number": "254700111003",
    "ussd_pin": "123456",
    "user_type": "employee"
}
```

**Response `200 OK` (existing user):**

```json
{
    "message": "User already exists",
    "user_id": 3,
    "phone_number": "254700111003",
    "ussd_pin": "123456"
}
```

---

## Job Listings

All job endpoints require:  
**Header:** `Authorization: Bearer <access_token>`

---

### List jobs

**Endpoint:** `GET /api/jobs/`  
**Auth:** Required  

- **Employer:** own listings only  
- **Employee:** open listings  
- **Admin:** all  

**Request:** No body.

**Response `200 OK`:**

```json
[
    {
        "id": 1,
        "title": "Website Development",
        "description": "Build a responsive company website (5 pages)",
        "budget": "25000.00",
        "status": "open",
        "employer": 1,
        "employer_name": "Test Employer",
        "employee": null,
        "created_at": "2025-02-11T12:00:00Z",
        "updated_at": "2025-02-11T12:00:00Z",
        "assigned_at": null,
        "completed_at": null,
        "escrow_contract_id": "ESCROW_ABC123XYZ"
    }
]
```

---

### Create job listing

**Endpoint:** `POST /api/jobs/`  
**Auth:** Required (employer only)

**Request (JSON):**

```json
{
    "title": "Website Development",
    "description": "Build a responsive company website (5 pages)",
    "budget": "25000.00"
}
```

| Field         | Type   | Required | Description   |
|---------------|--------|----------|---------------|
| `title`       | string | Yes      | Job title     |
| `description` | string | Yes      | Job details   |
| `budget`      | string | Yes      | Decimal, e.g. `"25000.00"` |

**Response `201 Created`:**

```json
{
    "id": 1,
    "title": "Website Development",
    "description": "Build a responsive company website (5 pages)",
    "budget": "25000.00",
    "status": "open",
    "employer": 1,
    "employer_name": "Test Employer",
    "employee": null,
    "created_at": "2025-02-11T12:00:00Z",
    "updated_at": "2025-02-11T12:00:00Z",
    "assigned_at": null,
    "completed_at": null,
    "escrow_contract_id": "ESCROW_ABC123XYZ"
}
```

**Error `403` (non-employer):**

```json
{
    "error": "Only employers can create job listings"
}
```

---

### Get job by ID

**Endpoint:** `GET /api/jobs/{id}/`  
**Auth:** Required  

**Request:** No body.

**Response `200 OK`:** Same object shape as in list/create (single job).

**Error `403`:** Not allowed to view this listing.  
**Error `404`:** Job not found.

---

### Update job (assign employee / status)

**Endpoint:** `PATCH /api/jobs/{id}/`  
**Auth:** Required (employer for own listing)

**Assign employee (job must be `open`):**

```json
{
    "employee_id": 2
}
```

**Update status only:**

```json
{
    "status": "in_progress"
}
```

Allowed statuses: `open`, `assigned`, `in_progress`, `completed`, `cancelled`.

**Response `200 OK`:** Updated job object (same shape as get job).

**Error `403`:** Not your listing.  
**Error `404`:** Job or employee not found.

---

### Complete work (release escrow & payout)

**Endpoint:** `POST /api/jobs/{job_id}/complete/`  
**Auth:** Required (employer only)

**Request:** No body.

**Response `200 OK`:**

```json
{
    "message": "Work completed and funds released",
    "job_id": 1,
    "escrow_status": "released",
    "payout_status": "completed",
    "amount": "25000.00"
}
```

**Error `400`:** Job not in `in_progress` or escrow not funded.  
**Error `403`:** Not the employer.  
**Error `404`:** Job or escrow not found.

---

## Payment Callbacks

### M-Pesa deposit callback

**Endpoint:** `POST /api/callbacks/mpesa/deposit/`  
**Auth:** None (called by M-Pesa)

**Request (JSON) – typical M-Pesa payload:**
```json
{
    "TransactionType": "Pay Bill",
    "TransID": "RKTQDM7W6S",
    "TransTime": "20191122063845",
    "TransAmount": "25000.00",
    "BusinessShortCode": "174379",
    "BillRefNumber": "ESCROW_ABC123XYZ",
    "InvoiceNumber": "",
    "OrgAccountBalance": "19.00",
    "ThirdPartyTransID": "",
    "MSISDN": "254708374149",
    "FirstName": "John",
    "MiddleName": "Doe",
    "LastName": "Smith"
}
```

Important fields:

| Field           | Description                          |
|-----------------|--------------------------------------|
| `TransID`       | M-Pesa transaction ID               |
| `TransAmount`   | Amount paid                          |
| `MSISDN`        | Payer phone (e.g. 254XXXXXXXXX)      |
| `BillRefNumber` | Must be job’s `escrow_contract_id`   |

**Response `200 OK`:**

```json
{
    "message": "Deposit processed successfully",
    "contract_id": "ESCROW_ABC123XYZ",
    "amount": 25000.0,
    "status": "funded"
}
```

**Error `400`:** Invalid bill reference.  
**Error `404`:** Escrow contract not found.

---

## Running the test script

From project root:

```bash
cd backend
chmod +x test.sh
./test.sh http://localhost:8000
```

If omitted, base URL defaults to `http://localhost:8000/api` (script appends `/api` when you pass root URL). To test another host:

```bash
./test.sh https://your-domain.com
```

Script will:

1. Register employer and employee  
2. Login and capture tokens  
3. Create a job listing  
4. List jobs, get job by ID  
5. Assign employee and update status  
6. Simulate M-Pesa deposit callback  
7. Call complete-work endpoint  
8. Hit USSD handler and register-callback  

Ensure the Django server is running (`python manage.py runserver`) before executing `test.sh`.

**Re-running tests:** The script uses fixed phone numbers (`254700111001`, `254700111002`). If you run it again on the same database, registration may return 400 (duplicate phone). Use a fresh DB or change the phone numbers in `test.sh` for repeated runs.
