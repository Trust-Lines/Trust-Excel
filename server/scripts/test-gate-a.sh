#!/bin/bash
# GATE A: Projects V2 Permission System Test Script
# Tests the three required scenarios: allowed edit, column filtering, forbidden edit

set -e

echo "🚀 GATE A: V2 Permission System STRICT Validation"
echo "================================================="
echo "Tests: 1) Allowed Edit  2) Column Filtering  3) Forbidden Edit  4) Hidden Field Verification"

# Configuration
BASE_URL="http://localhost:3001/api"
PROJECT_ID="proj-test-001"
ITEM_ID="item-test-001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}$1${NC}"
    echo "----------------------------------------"
}

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Check if server is running
print_section "🔍 Pre-flight Checks"
if curl -s "$BASE_URL/health" > /dev/null; then
    echo "✅ Backend server is running"
else
    echo "❌ Backend server is not running. Please start it first:"
    echo "   npm run start:dev"
    exit 1
fi

# Check environment configuration
print_section "⚙️  Environment Configuration"
echo "Checking V2 permissions configuration..."

# You'll need to replace these with actual auth tokens
ADMIN_TOKEN="your-admin-token-here"
FINANCE_TOKEN="your-finance-token-here"
MILLWORK_TOKEN="your-millwork-token-here"

if [ "$ADMIN_TOKEN" = "your-admin-token-here" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Please update the auth tokens in this script${NC}"
    echo "This script requires valid JWT tokens for testing."
    echo "You can get tokens by logging in and copying from browser dev tools."
    echo ""
    echo "To continue with manual testing, see the curl commands below:"
fi

# Test 1: Allowed Edit (Shadow Mode)
print_section "Test 1: ✅ ALLOWED EDIT (Finance User)"
echo "Testing: FINANCE user updates project item status"
echo "Expected: Update succeeds, standardized V2 logs permission decisions"

cat << 'EOF'
# Manual test command:
curl -X PATCH http://localhost:3001/api/projects/items/YOUR_ITEM_ID \
  -H "Authorization: Bearer YOUR_FINANCE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "READY"}'

# Expected Standardized V2 Shadow Mode Logs:
PERM_V2 decision: {"userId":"finance-user-id","role":"FINANCE","tableId":"operational-board-grid","field":"status","action":"edit","allowed":true,"reason":"Field edit allowed"}
📅 [RTD AUTO-SET] Status READY + existing RTD is null → Setting RTD to today

# Validation: Look for consistent PERM_V2 decision: format
EOF

echo ""

# Test 2: Column Filtering
print_section "Test 2: 🔒 HIDDEN COLUMN FILTERED (Millwork User)"
echo "Testing: MILLWORK user fetches project items (pfUsd, pfTl should be filtered)"
echo "Expected: Response excludes financial columns, standardized logs, performance metrics"

cat << 'EOF'
# Manual test command:
curl -X GET http://localhost:3001/api/projects/YOUR_PROJECT_ID/items \
  -H "Authorization: Bearer YOUR_MILLWORK_TOKEN"

# Expected Standardized V2 Column Filtering Logs:
PERM_V2 decision: {"userId":"millwork-user-id","role":"MILLWORK","tableId":"operational-board-grid","field":"projectNo","action":"view","allowed":true,"reason":"Column visible for role"}
PERM_V2 decision: {"userId":"millwork-user-id","role":"MILLWORK","tableId":"operational-board-grid","field":"pfUsd","action":"view","allowed":false,"reason":"Column hidden for role MILLWORK"}
PERM_V2 decision: {"userId":"millwork-user-id","role":"MILLWORK","tableId":"operational-board-grid","field":"pfTl","action":"view","allowed":false,"reason":"Column hidden for role MILLWORK"}
PERM_V2 filtering: {"itemId":"item-789","hiddenFields":["pfUsd","pfTl","paymentRule"],"originalKeyCount":15,"filteredKeyCount":12,"action":"API_response_filtered"}
PERF: findProjectItems with V2 filtering - db: 45ms, filter: 12ms, total: 57ms (3 items)

# Expected Response (pfUsd, pfTl, paymentRule filtered out):
[{
  "id": "item-123",
  "projectNo": "PRJ-2026-001",
  "type": "MILLWORK",
  "status": "ORDERED"
  // Note: pfUsd, pfTl, paymentRule are NOT returned
}]

# Validation: Look for PERM_V2 decision: and PERF: logs
EOF

echo ""

# Test 3: Forbidden Edit (Enforce Mode)
print_section "Test 3: ⛔ FORBIDDEN EDIT (Millwork User)"
echo "Testing: MILLWORK user tries to edit financial fields (enforce mode)"
echo "Expected: 403 Forbidden response with standardized logs"

cat << 'EOF'
# First, enable enforce mode in .env:
PERMISSIONS_V2_MODE=enforce

# Manual test command:
curl -X PATCH http://localhost:3001/api/projects/items/YOUR_ITEM_ID \
  -H "Authorization: Bearer YOUR_MILLWORK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pfUsd": 1500.00, "poSignStatus": "SIGNED"}'

# Expected Standardized V2 Permission Logs:
PERM_V2 decision: {"userId":"millwork-user-id","role":"MILLWORK","tableId":"operational-board-grid","field":"pfUsd","action":"edit","allowed":false,"reason":"Field pfUsd is hidden for role MILLWORK"}
PERM_V2 decision: {"userId":"millwork-user-id","role":"MILLWORK","tableId":"operational-board-grid","field":"poSignStatus","action":"edit","allowed":false,"reason":"Field poSignStatus is read-only for role MILLWORK"}

# Expected Response: 403 Forbidden
{
  "statusCode": 403,
  "message": "Fields are hidden or read-only for role MILLWORK: pfUsd, poSignStatus"
}

# Validation: Look for PERM_V2 decision: logs with allowed:false
EOF

# Test 4: Hidden Field Verification (Raw JSON)
print_section "Test 4: 🔍 HIDDEN FIELD VERIFICATION (Client User)"
echo "Testing: CLIENT user fetches items - hidden fields must NOT appear in raw JSON"
echo "Expected: Financial/sensitive fields completely absent from response payload"

cat << 'EOF'
# Manual test command:
curl -s -X GET http://localhost:3001/api/projects/YOUR_PROJECT_ID/items \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN"

# Expected Standardized V2 Column Filtering Logs:
PERM_V2 decision: {"userId":"client-user-id","role":"CLIENT","tableId":"operational-board-grid","field":"projectNo","action":"view","allowed":true,"reason":"Column visible for role"}
PERM_V2 decision: {"userId":"client-user-id","role":"CLIENT","tableId":"operational-board-grid","field":"type","action":"view","allowed":false,"reason":"Column hidden for role CLIENT"}
PERM_V2 decision: {"userId":"client-user-id","role":"CLIENT","tableId":"operational-board-grid","field":"pfUsd","action":"view","allowed":false,"reason":"Column hidden for role CLIENT"}
PERM_V2 filtering: {"itemId":"item-789","hiddenFields":["type","vendor","pfUsd","pfTl","poSignStatus","status"],"originalKeyCount":15,"filteredKeyCount":8,"action":"API_response_filtered"}

# Expected Response (MOST fields hidden - CLIENT sees minimal data):
[{
  "id": "item-789",
  "projectId": "proj-456",
  "projectNo": "PRJ-2026-001",
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-02-05T10:00:00Z",
  "vendor": { "id": "v2", "name": "Millwork Co" },
  "customType": null
  // CRITICAL VALIDATION: These fields MUST NOT exist in response:
  // type, pfUsd, pfTl, poSignStatus, status, paymentRule, std, etd, rtd, ftd
}]

# Critical Validation Commands:
# 1. Check that hidden fields are completely absent (should find 0 matches)
curl -s -X GET http://localhost:3001/api/projects/YOUR_PROJECT_ID/items \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN" | \
  jq '.[0]' | grep -E '"(pfUsd|pfTl|poSignStatus|status|type)"' && \
  echo "❌ FAIL: Hidden fields found in response" || \
  echo "✅ PASS: Hidden fields properly filtered from response"

# 2. Count response keys (CLIENT should see ~7 keys, ADMIN sees ~17)
curl -s -X GET http://localhost:3001/api/projects/YOUR_PROJECT_ID/items \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN" | \
  jq '.[0] | keys | length'

# 3. Validate performance logging
# Look for: PERF: findProjectItems with V2 filtering - db: Xms, filter: Yms, total: Zms
EOF

echo ""

# Configuration Instructions
print_section "📋 Configuration Steps"
echo "1. Set up environment variables in .env:"
echo "   PERMISSIONS_V2_MODE=shadow  # or 'enforce' for test 3"
echo "   PERMISSIONS_V2_ENABLED_TABLES=operational-board-grid"
echo ""
echo "2. Get auth tokens:"
echo "   - Login as different users via /api/auth/login"
echo "   - Copy JWT tokens from response or browser dev tools"
echo ""
echo "3. Create test data:"
echo "   - Create a test project with items"
echo "   - Use project and item IDs in the commands above"
echo ""
echo "4. Watch server logs to see V2 permission decisions"

# Summary
print_section "🎯 STRICT Success Criteria for GATE A"
echo "Core Functionality:"
echo "✅ V2 permission system activates when PERMISSIONS_V2_MODE != 'off'"
echo "✅ Shadow mode logs decisions without blocking updates"
echo "✅ Column filtering removes hidden fields from API responses"
echo "✅ Enforce mode blocks unauthorized field updates with 403"
echo "✅ Existing Projects functionality preserved when V2 disabled"
echo ""
echo "NEW Validation Requirements:"
echo "✅ Standardized Logging: All V2 decisions use 'PERM_V2 decision:' format"
echo "✅ Hidden Field Verification: Hidden fields completely absent from raw JSON"
echo "✅ Performance Tracking: Duration logged for DB queries and filtering"
echo "✅ 4 Test Scenarios: All scenarios validated with proper logging"
echo ""
echo "Audit & Performance:"
echo "✅ All authorization decisions logged with userId, role, field, action, result"
echo "✅ Performance impact measured (filtering adds ~10-20ms overhead)"
echo "✅ Field filtering tracking shows before/after key counts"

print_section "🔧 Useful Debug Commands"
echo "# Check user roles and permissions:"
echo "psql -d your_db -c \"SELECT u.email, r.name as role FROM \\\"User\\\" u JOIN \\\"Role\\\" r ON u.\\\"roleId\\\" = r.id;\""
echo ""
echo "# Check column visibility settings:"
echo "psql -d your_db -c \"SELECT r.name, cv.\\\"columnKey\\\", cv.\\\"isHidden\\\", cv.\\\"isReadOnly\\\" FROM \\\"Role\\\" r JOIN \\\"RoleColumnVisibility\\\" cv ON r.id = cv.\\\"roleId\\\";\""
echo ""
echo "# Validate standardized V2 logging format:"
echo "tail -f logs/app.log | grep \"PERM_V2 decision:\" | jq ."
echo ""
echo "# Check performance logging:"
echo "tail -f logs/app.log | grep \"PERF: findProjectItems\""
echo ""
echo "# Validate hidden field filtering:"
echo "tail -f logs/app.log | grep \"PERM_V2 filtering:\""
echo ""
echo "# Monitor all GATE A activity:"
echo "tail -f logs/app.log | grep -E \"(PERM_V2|PERF:)\""

echo -e "\n${GREEN}🎉 GATE A test script ready!${NC}"
echo "Run the manual commands above with your auth tokens to test V2 integration."