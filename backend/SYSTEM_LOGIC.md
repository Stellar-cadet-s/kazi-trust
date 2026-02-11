# Kazi Trust Platform - System Logic Documentation

## Overview

Kazi Trust is a job marketplace platform built on Stellar blockchain that facilitates secure escrow transactions between employers and employees. The platform uses M-Pesa for deposits and mobile money for payouts, with Stellar smart contracts managing the escrow.

## Architecture

### Components

1. **Django REST API** - Backend API handling business logic
2. **Stellar Rust Contracts** - Smart contracts for escrow management
3. **M-Pesa Integration** - For receiving deposits from employers
4. **Intersend API** - For mobile money payouts to employees
5. **USSD Interface** - For user registration and basic operations

## User Flow

### 1. User Registration

#### Via Web/Mobile App (Password + Phone)
- **Endpoint**: `POST /api/auth/register/`
- **Payload**:
  ```json
  {
    "phone_number": "0712345678",
    "password": "securepassword",
    "email": "user@example.com",  // Optional
    "first_name": "John",
    "last_name": "Doe",
    "user_type": "employer"  // or "employee"
  }
  ```
- **Process**:
  1. Validates phone number uniqueness
  2. Creates user account
  3. Returns JWT tokens for authentication

#### Via USSD
- **Endpoint**: `POST /api/ussd/register-callback/`
- **Process**:
  1. USSD handler collects user details
  2. Calls registration callback endpoint
  3. System creates user and generates USSD PIN
  4. PIN sent to user via SMS/USSD

### 2. Job Listing Creation

**Endpoint**: `POST /api/jobs/`
**Authentication**: Required (JWT token)
**User Type**: Employer only

**Process**:
1. Employer creates job listing with:
   - Title
   - Description
   - Budget (amount to pay employee)

2. System automatically:
   - Creates a Stellar escrow contract
   - Generates unique contract ID (format: `ESCROW_XXXXXXXX`)
   - Links contract to job listing
   - Sets status to `pending_deposit`

**Response**:
```json
{
  "id": 1,
  "title": "Website Development",
  "description": "Build a responsive website",
  "budget": "50000.00",
  "status": "open",
  "escrow_contract_id": "ESCROW_ABC123XYZ",
  ...
}
```

### 3. M-Pesa Deposit Flow

**Endpoint**: `POST /api/callbacks/mpesa/deposit/`
**Authentication**: None (public callback from M-Pesa)

**Process**:
1. Employer initiates M-Pesa payment:
   - Uses Pay Bill number
   - Bill Reference: `ESCROW_XXXXXXXX` (from job listing)
   - Amount: Job budget amount

2. M-Pesa processes payment and sends callback:
   ```json
   {
     "TransID": "RKTQDM7W6S",
     "TransAmount": "50000.00",
     "MSISDN": "254712345678",
     "BillRefNumber": "ESCROW_ABC123XYZ",
     ...
   }
   ```

3. System processes callback:
   - Finds escrow contract by contract ID
   - Creates MpesaDeposit record
   - Calls Stellar contract to fund escrow
   - Updates escrow status to `funded`
   - Updates job listing status

**Stellar Contract Interaction**:
- System calls Stellar contract service to fund the escrow
- Contract holds funds until work completion
- Balance is tracked on Stellar blockchain

### 4. Employee Assignment

**Endpoint**: `PATCH /api/jobs/{id}/`
**Authentication**: Required
**User Type**: Employer

**Process**:
1. Employer selects employee from available applicants
2. Updates job listing with employee ID
3. System:
   - Updates job status to `assigned`
   - Links employee to escrow contract
   - Updates escrow status to `in_progress`

### 5. Work Completion & Payment Release

**Endpoint**: `POST /api/jobs/{job_id}/complete/`
**Authentication**: Required
**User Type**: Employer only

**Process**:
1. Employer marks work as complete
2. System validates:
   - Job is in `in_progress` status
   - Escrow is `funded`
   - Employee is assigned

3. **Stellar Contract Release**:
   - Calls Stellar contract to release escrow
   - Contract transfers funds from escrow to employee's Stellar account
   - Updates escrow status to `released`

4. **Mobile Money Payout**:
   - Creates MobileMoneyPayout record
   - Calls Intersend API to send money to employee's phone
   - Updates payout status

**Flow Diagram**:
```
Employer clicks "Work Complete"
    ↓
Update Job Status → "completed"
    ↓
Call Stellar Contract → Release Escrow
    ↓
Stellar Contract transfers to Employee Account
    ↓
Call Intersend API → Send Mobile Money
    ↓
Money arrives in Employee's M-Pesa/Wallet
```

## Data Models

### CustomUser
- `phone_number` - Unique identifier
- `email` - Optional
- `user_type` - `employer` or `employee`
- `stellar_account_id` - Stellar account (optional)
- `ussd_pin` - For USSD authentication

### JobListing
- `employer` - Foreign key to CustomUser
- `employee` - Foreign key to CustomUser (assigned later)
- `title`, `description`, `budget`
- `status` - `open`, `assigned`, `in_progress`, `completed`, `cancelled`
- `escrow_contract_id` - Reference to Stellar contract

### EscrowContract
- `contract_id` - Stellar contract ID
- `job_listing` - One-to-one with JobListing
- `employer`, `employee`
- `amount` - Escrowed amount
- `status` - `pending_deposit`, `funded`, `in_progress`, `completed`, `released`

### MpesaDeposit
- `escrow_contract` - Foreign key
- `transaction_reference` - M-Pesa transaction ID
- `amount`, `phone_number`
- `status` - `pending`, `completed`, `failed`

### MobileMoneyPayout
- `escrow_contract` - One-to-one with EscrowContract
- `employee` - Recipient
- `phone_number`, `amount`
- `transaction_reference` - Intersend transaction ID
- `status` - `pending`, `processing`, `completed`, `failed`

## API Endpoints Summary

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login with email/phone + password

### USSD
- `POST /api/ussd/` - Main USSD handler
- `POST /api/ussd/register-callback/` - USSD registration callback

### Job Listings
- `GET /api/jobs/` - List all job listings (filtered by user type)
- `POST /api/jobs/` - Create new job listing (employer only)
- `GET /api/jobs/{id}/` - Get job listing details
- `PATCH /api/jobs/{id}/` - Update job listing (assign employee, change status)
- `POST /api/jobs/{id}/complete/` - Mark work complete and release payment

### Callbacks
- `POST /api/callbacks/mpesa/deposit/` - M-Pesa deposit callback

## Stellar Contract Integration

### Contract Operations

1. **Create Escrow**
   - Endpoint: `POST /api/escrow/create`
   - Creates new escrow contract on Stellar
   - Returns contract ID

2. **Fund Escrow**
   - Endpoint: `POST /api/escrow/fund`
   - Transfers funds to escrow contract
   - Called after M-Pesa deposit

3. **Release Escrow**
   - Endpoint: `POST /api/escrow/release`
   - Releases funds to employee
   - Called when work is completed

4. **Get Status**
   - Endpoint: `GET /api/escrow/{contract_id}`
   - Returns current contract status

## Mobile Money Integration (Intersend)

### Payout Flow

1. System calls Intersend API:
   ```json
   POST /v1/payouts/send
   {
     "phone_number": "254712345678",
     "amount": "50000.00",
     "currency": "KES",
     "reference": "PAYOUT_XXXXX"
   }
   ```

2. Intersend processes payment
3. Money sent to employee's mobile money account
4. Callback received with transaction status

## Security Considerations

1. **Authentication**: JWT tokens for API access
2. **Callbacks**: Validate M-Pesa callbacks (IP whitelist, signature verification)
3. **Escrow**: Funds held securely in Stellar smart contract
4. **User Data**: Phone numbers and sensitive data encrypted

## Error Handling

- All endpoints return appropriate HTTP status codes
- Errors logged for debugging
- Failed transactions tracked in database
- Retry mechanisms for external API calls

## Configuration

### Django Settings

Add to `settings.py`:
```python
# Stellar Contract Service
STELLAR_CONTRACT_SERVICE_URL = 'http://your-stellar-service:8001'
STELLAR_CONTRACT_API_KEY = 'your-api-key'

# Intersend API
INTERSEND_API_URL = 'https://api.intersend.com/v1'
INTERSEND_API_KEY = 'your-intersend-key'
INTERSEND_API_SECRET = 'your-intersend-secret'
```

## Testing Flow

1. Register as employer
2. Create job listing
3. Make M-Pesa payment (use test credentials)
4. Assign employee
5. Mark work complete
6. Verify payment release

## Future Enhancements

- Dispute resolution system
- Multi-currency support
- Escrow cancellation and refunds
- Employee rating system
- Notification system (SMS/Email)
- Admin dashboard
