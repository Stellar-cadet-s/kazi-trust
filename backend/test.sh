#!/bin/bash

# USSD Testing Script
# Base URL
BASE_URL="https://58c8-197-136-143-2.ngrok-free.app/api/ussd/"

echo "================================"
echo "USSD ENDPOINT TESTING SCRIPT"
echo "================================"
echo ""

# Helper function to make requests
make_request() {
    local description=$1
    local session_id=$2
    local phone=$3
    local text=$4
    
    echo "----------------------------------------"
    echo "TEST: $description"
    echo "SessionID: $session_id"
    echo "Phone: $phone"
    echo "Text: $text"
    echo "----------------------------------------"
    
    curl -X POST "$BASE_URL" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "sessionId=$session_id" \
        -d "phoneNumber=$phone" \
        -d "text=$text"
    
    echo -e "\n\n"
    sleep 1
}

# ================================
# 1. WELCOME SCREEN
# ================================
make_request "Welcome Screen - Initial Access" \
    "session_001" \
    "+254712345678" \
    ""

# ================================
# 2. REGISTRATION FLOW - CLIENT
# ================================
echo "=== CLIENT REGISTRATION FLOW ==="

make_request "Step 1: Select Register" \
    "session_002" \
    "+254712345679" \
    "1"

make_request "Step 2: Select Client Type" \
    "session_002" \
    "+254712345679" \
    "1*1"

make_request "Step 3: Enter First Name" \
    "session_002" \
    "+254712345679" \
    "1*1*John"

make_request "Step 4: Enter Last Name" \
    "session_002" \
    "+254712345679" \
    "1*1*John*Doe"

make_request "Step 5: Enter Email" \
    "session_002" \
    "+254712345679" \
    "1*1*John*Doe*john@example.com"

# ================================
# 3. REGISTRATION FLOW - EMPLOYEE
# ================================
echo "=== EMPLOYEE REGISTRATION FLOW ==="

make_request "Employee Registration - Select Register" \
    "session_003" \
    "+254712345680" \
    "1"

make_request "Employee Registration - Select Employee Type" \
    "session_003" \
    "+254712345680" \
    "1*2"

make_request "Employee Registration - Enter First Name" \
    "session_003" \
    "+254712345680" \
    "1*2*Jane"

make_request "Employee Registration - Enter Last Name" \
    "session_003" \
    "+254712345680" \
    "1*2*Jane*Smith"

make_request "Employee Registration - Skip Email" \
    "session_003" \
    "+254712345680" \
    "1*2*Jane*Smith*#"

# ================================
# 4. LOGIN FLOW
# ================================
echo "=== LOGIN FLOW ==="

make_request "Login - Select Login Option" \
    "session_004" \
    "+254712345679" \
    "2"

make_request "Login - Enter Phone Number" \
    "session_004" \
    "+254712345679" \
    "2*+254712345679"

make_request "Login - Enter PIN (use actual PIN from registration)" \
    "session_004" \
    "+254712345679" \
    "2*+254712345679*1234"

# ================================
# 5. CLIENT SERVICES MENU
# ================================
echo "=== CLIENT SERVICES ==="

make_request "Client Menu - Access" \
    "session_005" \
    "+254712345679" \
    "3"

make_request "Client Menu - Select Create Task" \
    "session_005" \
    "+254712345679" \
    "3*1"

# ================================
# 6. CREATE TASK FLOW (CLIENT)
# ================================
echo "=== CREATE TASK FLOW ==="

make_request "Create Task - Enter Title" \
    "session_006" \
    "+254712345679" \
    "3*1*Clean Office"

make_request "Create Task - Enter Description" \
    "session_006" \
    "+254712345679" \
    "3*1*Clean Office*Need office cleaning for 3 rooms"

make_request "Create Task - Enter Budget" \
    "session_006" \
    "+254712345679" \
    "3*1*Clean Office*Need office cleaning for 3 rooms*2500"

# ================================
# 7. VIEW CLIENT TASKS
# ================================
echo "=== VIEW CLIENT TASKS ==="

make_request "View My Tasks" \
    "session_007" \
    "+254712345679" \
    "3*2"

# ================================
# 8. EMPLOYEE SERVICES MENU
# ================================
echo "=== EMPLOYEE SERVICES ==="

make_request "Employee Menu - Access" \
    "session_008" \
    "+254712345680" \
    "4"

make_request "Employee Menu - View Available Tasks" \
    "session_008" \
    "+254712345680" \
    "4*1"

# ================================
# 9. ACCEPT TASK FLOW (EMPLOYEE)
# ================================
echo "=== ACCEPT TASK FLOW ==="

make_request "Accept Task - Select Option" \
    "session_009" \
    "+254712345680" \
    "4*2"

make_request "Accept Task - Enter Task ID (use ID from task creation)" \
    "session_009" \
    "+254712345680" \
    "4*2*1"

# ================================
# 10. UPDATE TASK STATUS (EMPLOYEE)
# ================================
echo "=== UPDATE TASK STATUS ==="

make_request "Update Status - Select Option" \
    "session_010" \
    "+254712345680" \
    "4*3"

make_request "Update Status - Select Task" \
    "session_010" \
    "+254712345680" \
    "4*3*1"

make_request "Update Status - Mark In Progress" \
    "session_010" \
    "+254712345680" \
    "4*3*1*1"

make_request "Update Status - Mark Completed" \
    "session_011" \
    "+254712345680" \
    "4*3*1*2"

# ================================
# 11. VERIFY TASK (CLIENT)
# ================================
echo "=== VERIFY TASK ==="

make_request "Verify Task - Select Option" \
    "session_012" \
    "+254712345679" \
    "3*3"

make_request "Verify Task - Select Task to Verify" \
    "session_012" \
    "+254712345679" \
    "3*3*1"

# ================================
# 12. RATE EMPLOYEE (CLIENT)
# ================================
echo "=== RATE EMPLOYEE ==="

make_request "Rate Employee - Select Option" \
    "session_013" \
    "+254712345679" \
    "3*4"

make_request "Rate Employee - Select Task" \
    "session_013" \
    "+254712345679" \
    "3*4*1"

make_request "Rate Employee - Provide Rating" \
    "session_013" \
    "+254712345679" \
    "3*4*1*5"

# ================================
# 13. VIEW TRANSACTION HISTORY (CLIENT)
# ================================
echo "=== VIEW TRANSACTION HISTORY ==="

make_request "View Transaction History" \
    "session_014" \
    "+254712345679" \
    "3*5"

# ================================
# 14. VIEW EARNINGS (EMPLOYEE)
# ================================
echo "=== VIEW EARNINGS ==="

make_request "View Earnings" \
    "session_015" \
    "+254712345680" \
    "4*5"

# ================================
# 15. ADMIN SERVICES
# ================================
echo "=== ADMIN SERVICES ==="

make_request "Admin Menu - Access" \
    "session_016" \
    "+254712345681" \
    "5"

make_request "Admin - View All Users" \
    "session_016" \
    "+254712345681" \
    "5*1"

make_request "Admin - View All Tasks" \
    "session_016" \
    "+254712345681" \
    "5*2"

# ================================
# 16. NAVIGATION TESTS
# ================================
echo "=== NAVIGATION TESTS ==="

make_request "Return to Main Menu from Client" \
    "session_017" \
    "+254712345679" \
    "3*6"

make_request "Return to Main Menu from Employee" \
    "session_018" \
    "+254712345680" \
    "4*6"

# ================================
# 17. ERROR HANDLING TESTS
# ================================
echo "=== ERROR HANDLING ==="

make_request "Invalid Main Menu Option" \
    "session_019" \
    "+254712345679" \
    "9"

make_request "Invalid Client Menu Option" \
    "session_020" \
    "+254712345679" \
    "3*9"

make_request "Invalid Task ID" \
    "session_021" \
    "+254712345680" \
    "4*2*9999"

# ================================
# 18. JSON FORMAT TESTS
# ================================
echo "=== JSON FORMAT TESTS ==="

echo "JSON Format - Welcome Screen"
curl -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -d '{
        "sessionId": "session_json_001",
        "phoneNumber": "+254712345682",
        "text": ""
    }'
echo -e "\n\n"

echo "JSON Format - Registration"
curl -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -d '{
        "sessionId": "session_json_002",
        "phoneNumber": "+254712345682",
        "text": "1*1*Alice*Johnson*alice@example.com"
    }'
echo -e "\n\n"

echo "================================"
echo "TESTING COMPLETE"
echo "================================"
