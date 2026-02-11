#!/bin/bash
# =============================================================================
# Kazi Trust API - Full Endpoint Test Script
# Usage: ./test.sh [BASE_URL]
# Example: ./test.sh http://localhost:8000
#          ./test.sh https://your-domain.com
# =============================================================================

# Do not exit on first failure; run all tests
set +e

# Accept base with or without /api (e.g. http://localhost:8000 or http://localhost:8000/api)
BASE_INPUT="${1:-https://3cbc-197-136-143-2.ngrok-free.app}"
if [[ "$BASE_INPUT" == *"/api" ]]; then
    API_URL="$BASE_INPUT"
else
    API_URL="${BASE_INPUT%/}/api"
fi
BASE_URL="$API_URL"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Temp files for tokens and IDs
ACCESS_TOKEN_FILE=$(mktemp)
EMPLOYER_TOKEN_FILE=$(mktemp)
EMPLOYEE_TOKEN_FILE=$(mktemp)
JOB_ID_FILE=$(mktemp)
trap "rm -f $ACCESS_TOKEN_FILE $EMPLOYER_TOKEN_FILE $EMPLOYEE_TOKEN_FILE $JOB_ID_FILE" EXIT

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_test() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_ok() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_fail() {
    echo -e "${RED}✗ $1${NC}"
}

curl_silent() {
    curl -s -w "\n%{http_code}" "$@"
}

# =============================================================================
# 1. AUTH - Register Employer
# =============================================================================
print_header "1. POST /api/auth/register/ (Employer)"
print_test "Register employer with phone, password, email"

RESP=$(curl_silent -X POST "$API_URL/auth/register/" \
    -H "Content-Type: application/json" \
    -d '{
        "phone_number": "254700111001",
        "password": "EmployerPass123!",
        "email": "employer@kazi-trust.test",
        "first_name": "Test",
        "last_name": "Employer",
        "user_type": "employer"
    }')

HTTP_BODY=$(echo "$RESP" | head -n -1)
HTTP_CODE=$(echo "$RESP" | tail -n 1)

if [ "$HTTP_CODE" = "201" ]; then
    print_ok "Employer registered (201)"
    echo "$HTTP_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access',''))" 2>/dev/null > "$EMPLOYER_TOKEN_FILE" || true
else
    print_fail "Expected 201, got $HTTP_CODE"
    echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
fi

# =============================================================================
# 2. AUTH - Register Employee
# =============================================================================
print_header "2. POST /api/auth/register/ (Employee)"
print_test "Register employee"

RESP=$(curl_silent -X POST "$API_URL/auth/register/" \
    -H "Content-Type: application/json" \
    -d '{
        "phone_number": "254700111002",
        "password": "EmployeePass123!",
        "email": "employee@kazi-trust.test",
        "first_name": "Test",
        "last_name": "Worker",
        "user_type": "employee"
    }')

HTTP_BODY=$(echo "$RESP" | head -n -1)
HTTP_CODE=$(echo "$RESP" | tail -n 1)

if [ "$HTTP_CODE" = "201" ]; then
    print_ok "Employee registered (201)"
    echo "$HTTP_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access',''))" 2>/dev/null > "$EMPLOYEE_TOKEN_FILE" || true
else
    print_fail "Expected 201, got $HTTP_CODE"
    echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
fi

# =============================================================================
# 3. AUTH - Login (Employer)
# =============================================================================
print_header "3. POST /api/auth/login/"
print_test "Login with phone_number + password"

RESP=$(curl_silent -X POST "$API_URL/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{
        "phone_number": "254700111001",
        "password": "EmployerPass123!"
    }')

HTTP_BODY=$(echo "$RESP" | head -n -1)
HTTP_CODE=$(echo "$RESP" | tail -n 1)

if [ "$HTTP_CODE" = "200" ]; then
    print_ok "Login successful (200)"
    EMPLOYER_TOKEN=$(echo "$HTTP_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access',''))" 2>/dev/null)
    echo "$EMPLOYER_TOKEN" > "$EMPLOYER_TOKEN_FILE"
else
    print_fail "Expected 200, got $HTTP_CODE"
    echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
fi

# =============================================================================
# 4. AUTH - Login with email (alternative)
# =============================================================================
print_header "4. POST /api/auth/login/ (with email)"
print_test "Login with email + password"

RESP=$(curl_silent -X POST "$API_URL/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "employer@kazi-trust.test",
        "password": "EmployerPass123!"
    }')

HTTP_BODY=$(echo "$RESP" | head -n -1)
HTTP_CODE=$(echo "$RESP" | tail -n 1)

if [ "$HTTP_CODE" = "200" ]; then
    print_ok "Email login successful (200)"
else
    print_fail "Expected 200, got $HTTP_CODE"
fi

# =============================================================================
# 5. USSD - Register callback
# =============================================================================
print_header "5. POST /api/ussd/register-callback/"
print_test "USSD registration callback"

RESP=$(curl_silent -X POST "$API_URL/ussd/register-callback/" \
    -H "Content-Type: application/json" \
    -d '{
        "phone_number": "254700111003",
        "user_type": "employee"
    }')

HTTP_BODY=$(echo "$RESP" | head -n -1)
HTTP_CODE=$(echo "$RESP" | tail -n 1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    print_ok "USSD register callback (201/200)"
else
    print_fail "Got $HTTP_CODE"
    echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
fi

# =============================================================================
# 6. JOBS - List (unauthenticated should fail or empty)
# =============================================================================
print_header "6. GET /api/jobs/ (no auth - expect 401)"
print_test "List jobs without token"

RESP=$(curl_silent -X GET "$API_URL/jobs/")
HTTP_BODY=$(echo "$RESP" | head -n -1)
HTTP_CODE=$(echo "$RESP" | tail -n 1)

if [ "$HTTP_CODE" = "401" ]; then
    print_ok "Correctly requires auth (401)"
else
    echo "Got $HTTP_CODE (401 expected for unauthenticated)"
fi

# =============================================================================
# 7. JOBS - List as Employer
# =============================================================================
print_header "7. GET /api/jobs/ (as Employer)"
print_test "List job listings with employer token"

EMPLOYER_TOKEN=$(cat "$EMPLOYER_TOKEN_FILE" 2>/dev/null || echo "")
if [ -z "$EMPLOYER_TOKEN" ]; then
    print_fail "No employer token; skipping authenticated tests"
else
    RESP=$(curl_silent -X GET "$API_URL/jobs/" \
        -H "Authorization: Bearer $EMPLOYER_TOKEN")
    HTTP_BODY=$(echo "$RESP" | head -n -1)
    HTTP_CODE=$(echo "$RESP" | tail -n 1)

    if [ "$HTTP_CODE" = "200" ]; then
        print_ok "List jobs (200)"
        echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
    else
        print_fail "Expected 200, got $HTTP_CODE"
        echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
    fi
fi

# =============================================================================
# 8. JOBS - Create job listing
# =============================================================================
print_header "8. POST /api/jobs/ (Create job listing)"
print_test "Create job as employer"

RESP=$(curl_silent -X POST "$API_URL/jobs/" \
    -H "Authorization: Bearer $EMPLOYER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Website Development",
        "description": "Build a responsive company website (5 pages)",
        "budget": "25000.00"
    }')

HTTP_BODY=$(echo "$RESP" | head -n -1)
HTTP_CODE=$(echo "$RESP" | tail -n 1)

if [ "$HTTP_CODE" = "201" ]; then
    print_ok "Job created (201)"
    JOB_ID=$(echo "$HTTP_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
    echo "$JOB_ID" > "$JOB_ID_FILE"
    echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
else
    print_fail "Expected 201, got $HTTP_CODE"
    echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
fi

# =============================================================================
# 9. JOBS - Get job by ID
# =============================================================================
print_header "9. GET /api/jobs/{id}/"
JOB_ID=$(cat "$JOB_ID_FILE" 2>/dev/null || echo "1")
print_test "Get job by ID ($JOB_ID)"

RESP=$(curl_silent -X GET "$API_URL/jobs/$JOB_ID/" \
    -H "Authorization: Bearer $EMPLOYER_TOKEN")
HTTP_BODY=$(echo "$RESP" | head -n -1)
HTTP_CODE=$(echo "$RESP" | tail -n 1)

if [ "$HTTP_CODE" = "200" ]; then
    print_ok "Get job (200)"
    echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
else
    print_fail "Expected 200, got $HTTP_CODE"
    echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
fi

# =============================================================================
# 10. JOBS - Assign employee (PATCH)
# =============================================================================
print_header "10. PATCH /api/jobs/{id}/ (Assign employee)"
# Get employee user id (from login response we'd need to store it; use id=2 as typical second user)
EMPLOYEE_ID=2
print_test "Assign employee (employee_id=$EMPLOYEE_ID)"

RESP=$(curl_silent -X PATCH "$API_URL/jobs/$JOB_ID/" \
    -H "Authorization: Bearer $EMPLOYER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"employee_id\": $EMPLOYEE_ID}")

HTTP_BODY=$(echo "$RESP" | head -n -1)
HTTP_CODE=$(echo "$RESP" | tail -n 1)

if [ "$HTTP_CODE" = "200" ]; then
    print_ok "Employee assigned (200)"
    echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
else
    print_fail "Got $HTTP_CODE (404 if employee id wrong)"
    echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
fi

# =============================================================================
# 11. JOBS - Update status to in_progress (for complete flow)
# =============================================================================
print_header "11. PATCH /api/jobs/{id}/ (Update status)"
print_test "Set job status to in_progress"

RESP=$(curl_silent -X PATCH "$API_URL/jobs/$JOB_ID/" \
    -H "Authorization: Bearer $EMPLOYER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status": "in_progress"}')

HTTP_BODY=$(echo "$RESP" | head -n -1)
HTTP_CODE=$(echo "$RESP" | tail -n 1)

if [ "$HTTP_CODE" = "200" ]; then
    print_ok "Status updated (200)"
else
    echo "Got $HTTP_CODE"
fi

# =============================================================================
# 12. M-Pesa deposit callback
# =============================================================================
print_header "12. POST /api/callbacks/mpesa/deposit/"
print_test "M-Pesa deposit callback (simulated)"

# Use escrow_contract_id from created job if available; otherwise placeholder
ESCROW_ID="ESCROW_$(echo "$JOB_ID" | tr -d '\n')TEST"
RESP=$(curl_silent -X POST "$API_URL/callbacks/mpesa/deposit/" \
    -H "Content-Type: application/json" \
    -d "{
        \"TransID\": \"TEST$(date +%s)\",
        \"TransAmount\": \"25000.00\",
        \"MSISDN\": \"254700111001\",
        \"BillRefNumber\": \"$ESCROW_ID\",
        \"TransactionType\": \"Pay Bill\",
        \"BusinessShortCode\": \"174379\"
    }")

HTTP_BODY=$(echo "$RESP" | head -n -1)
HTTP_CODE=$(echo "$RESP" | tail -n 1)

# May be 404 if contract not found, or 200 if contract exists
if [ "$HTTP_CODE" = "200" ]; then
    print_ok "M-Pesa callback accepted (200)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "Note: 404 - Escrow contract not found (expected if ref doesn't match a real contract)"
else
    echo "Response $HTTP_CODE: $HTTP_BODY"
fi

# =============================================================================
# 13. Complete work (release escrow)
# =============================================================================
print_header "13. POST /api/jobs/{id}/complete/"
print_test "Mark work complete and release payment"

RESP=$(curl_silent -X POST "$API_URL/jobs/$JOB_ID/complete/" \
    -H "Authorization: Bearer $EMPLOYER_TOKEN")
HTTP_BODY=$(echo "$RESP" | head -n -1)
HTTP_CODE=$(echo "$RESP" | tail -n 1)

if [ "$HTTP_CODE" = "200" ]; then
    print_ok "Work completed (200)"
    echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
else
    print_fail "Got $HTTP_CODE"
    echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
fi

# =============================================================================
# 14. USSD - Main handler (JSON)
# =============================================================================
print_header "14. POST /api/ussd/ (JSON body)"
print_test "USSD handler - welcome screen"

RESP=$(curl_silent -X POST "$API_URL/ussd/" \
    -H "Content-Type: application/json" \
    -d '{
        "sessionId": "test_session_001",
        "phoneNumber": "254700111001",
        "text": ""
    }')

HTTP_BODY=$(echo "$RESP" | head -n -1)
HTTP_CODE=$(echo "$RESP" | tail -n 1)

if [ "$HTTP_CODE" = "200" ]; then
    print_ok "USSD response (200)"
    echo "Response body: $HTTP_BODY"
else
    echo "Got $HTTP_CODE"
fi

# =============================================================================
# 15. GET /api/jobs/ as Employee
# =============================================================================
print_header "15. GET /api/jobs/ (as Employee)"
print_test "List jobs with employee token"

EMPLOYEE_TOKEN=$(cat "$EMPLOYEE_TOKEN_FILE" 2>/dev/null || echo "")
if [ -n "$EMPLOYEE_TOKEN" ]; then
    RESP=$(curl_silent -X GET "$API_URL/jobs/" \
        -H "Authorization: Bearer $EMPLOYEE_TOKEN")
    HTTP_BODY=$(echo "$RESP" | head -n -1)
    HTTP_CODE=$(echo "$RESP" | tail -n 1)
    if [ "$HTTP_CODE" = "200" ]; then
        print_ok "Employee job list (200)"
    else
        echo "Got $HTTP_CODE"
    fi
else
    echo "No employee token; skip"
fi

# =============================================================================
# Summary
# =============================================================================
print_header "Tests complete"
echo "Base URL: $API_URL"
echo "Run with: ./test.sh $1"
echo ""
