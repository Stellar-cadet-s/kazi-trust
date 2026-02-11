# Quick Start Guide - Kazi Trust Platform

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r ../requirements.txt
```

### 2. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Configure Settings

Add to `backend/settings.py`:

```python
# Stellar Contract Service (update with your service URL)
STELLAR_CONTRACT_SERVICE_URL = 'http://localhost:8001'
STELLAR_CONTRACT_API_KEY = 'your-stellar-api-key'

# Intersend API (update with your credentials)
INTERSEND_API_URL = 'https://api.intersend.com/v1'
INTERSEND_API_KEY = 'your-intersend-key'
INTERSEND_API_SECRET = 'your-intersend-secret'
```

### 4. Run Server

```bash
python manage.py runserver
```

## API Usage Examples

### 1. Register User

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "0712345678",
    "password": "securepassword123",
    "email": "employer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "user_type": "employer"
  }'
```

Response:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "phone_number": "0712345678",
    "email": "employer@example.com",
    "user_type": "employer"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 2. Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "0712345678",
    "password": "securepassword123"
  }'
```

### 3. Create Job Listing (Employer)

```bash
curl -X POST http://localhost:8000/api/jobs/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Website Development",
    "description": "Build a responsive website for my business",
    "budget": "50000.00"
  }'
```

Response includes `escrow_contract_id` - use this for M-Pesa payment.

### 4. List Job Listings

```bash
# As Employer - sees own listings
curl -X GET http://localhost:8000/api/jobs/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# As Employee - sees open listings
curl -X GET http://localhost:8000/api/jobs/ \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
```

### 5. Assign Employee to Job

```bash
curl -X PATCH http://localhost:8000/api/jobs/1/ \
  -H "Authorization: Bearer EMPLOYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 2
  }'
```

### 6. Complete Work and Release Payment

```bash
curl -X POST http://localhost:8000/api/jobs/1/complete/ \
  -H "Authorization: Bearer EMPLOYER_TOKEN"
```

This triggers:
1. Stellar escrow release
2. Mobile money payout to employee

### 7. M-Pesa Deposit Callback (Called by M-Pesa)

```bash
curl -X POST http://your-domain.com/api/callbacks/mpesa/deposit/ \
  -H "Content-Type: application/json" \
  -d '{
    "TransID": "RKTQDM7W6S",
    "TransAmount": "50000.00",
    "MSISDN": "254712345678",
    "BillRefNumber": "ESCROW_ABC123XYZ",
    "TransactionType": "Pay Bill"
  }'
```

## USSD Flow

1. User dials USSD code
2. Selects "Register" option
3. Enters details (name, user type)
4. System creates account and generates PIN
5. User can login with phone number + PIN

## Testing Checklist

- [ ] User registration (web)
- [ ] User registration (USSD)
- [ ] Job listing creation
- [ ] M-Pesa deposit callback
- [ ] Employee assignment
- [ ] Work completion
- [ ] Payment release

## Notes

- Stellar contract service must be running for escrow operations
- Intersend API credentials required for mobile money payouts
- M-Pesa callback URL must be configured in M-Pesa settings
- All amounts are in KES (Kenyan Shillings)
