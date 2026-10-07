#!/bin/bash
# GATE B: Projects-Only Admin UI Test Script
# Tests the new admin endpoints for Projects permissions management

set -e

echo "🚀 GATE B: Projects Admin UI Test"
echo "================================="

# Configuration
BASE_URL="http://localhost:3001/api/admin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}$1${NC}"
    echo "----------------------------------------"
}

# Check if server is running
print_section "🔍 Pre-flight Checks"
if curl -s "$BASE_URL/../health" > /dev/null; then
    echo "✅ Backend server is running"
else
    echo "❌ Backend server is not running. Please start it first:"
    echo "   npm run start:dev"
    exit 1
fi

# Note about auth tokens
print_section "🔑 Authentication Required"
echo "This script requires a valid ADMIN user JWT token."
echo "Replace YOUR_ADMIN_TOKEN with actual token from login."
echo ""

# Test 1: Get Projects Roles Permissions
print_section "Test 1: GET Projects Roles Permissions"
echo "Testing: GET /admin/permissions/projects/roles"
echo "Expected: All roles with Projects-specific permissions"

cat << 'EOF'
# Manual test command:
curl -X GET http://localhost:3001/api/admin/permissions/projects/roles \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Expected Response Structure:
{
  "roles": [
    {
      "id": "role-id",
      "name": "FINANCE",
      "description": "FINANCE role permissions",
      "pageAccess": {
        "projectsPage": true
      },
      "tableActions": {
        "canView": true,
        "canCreate": false,
        "canEdit": true,
        "canDelete": false,
        "canExport": true,
        "canApprove": true
      },
      "columnPermissions": {
        "projectNo": { "isVisible": true, "isReadOnly": false, "requiresApproval": false },
        "pfUsd": { "isVisible": true, "isReadOnly": false, "requiresApproval": false },
        "poSignStatus": { "isVisible": true, "isReadOnly": false, "requiresApproval": false },
        // ... more columns
      }
    }
    // ... more roles
  ]
}

# Validation: Should return operational-board-grid specific permissions only
EOF

echo ""

# Test 2: Update Role Actions
print_section "Test 2: PATCH Role Table Actions"
echo "Testing: PATCH /admin/permissions/projects/roles/:roleId/actions"
echo "Expected: Updates table actions + invalidates cache"

cat << 'EOF'
# Manual test command (Example: Update MILLWORK role actions):
curl -X PATCH http://localhost:3001/api/admin/permissions/projects/roles/MILLWORK_ROLE_ID/actions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "canView": true,
    "canCreate": false,
    "canEdit": true,
    "canDelete": false,
    "canExport": false,
    "canApprove": false
  }'

# Expected Response:
{
  "roleId": "role-id",
  "roleName": "MILLWORK",
  "updatedActions": {
    "canView": true,
    "canCreate": false,
    "canEdit": true,
    "canDelete": false,
    "canExport": false,
    "canApprove": false
  },
  "success": true
}

# Expected Logs:
🔧 [GATE B] Updating Projects role actions: {"roleId":"role-id","actions":{...}}
🔄 [GATE B] Permission cache invalidated after actions update
✅ [GATE B] Projects role actions updated successfully

# Validation: pagePermissions JSON should be updated with operationalBoardView and canAddItems
EOF

echo ""

# Test 3: Update Role Columns
print_section "Test 3: PATCH Role Column Permissions"
echo "Testing: PATCH /admin/permissions/projects/roles/:roleId/columns"
echo "Expected: Updates column permissions + invalidates cache"

cat << 'EOF'
# Manual test command (Example: Hide financial columns for MILLWORK role):
curl -X PATCH http://localhost:3001/api/admin/permissions/projects/roles/MILLWORK_ROLE_ID/columns \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "columnPermissions": {
      "projectNo": { "isVisible": true, "isReadOnly": false, "requiresApproval": false },
      "type": { "isVisible": true, "isReadOnly": false, "requiresApproval": false },
      "vendor": { "isVisible": true, "isReadOnly": true, "requiresApproval": false },
      "status": { "isVisible": true, "isReadOnly": false, "requiresApproval": false },
      "pfUsd": { "isVisible": false, "isReadOnly": false, "requiresApproval": false },
      "pfTl": { "isVisible": false, "isReadOnly": false, "requiresApproval": false },
      "poSignStatus": { "isVisible": true, "isReadOnly": true, "requiresApproval": false }
    }
  }'

# Expected Response:
{
  "roleId": "role-id",
  "roleName": "MILLWORK",
  "updatedColumns": ["projectNo", "type", "vendor", "status", "pfUsd", "pfTl", "poSignStatus"],
  "rulesCreated": 3,
  "success": true
}

# Expected Logs:
🔧 [GATE B] Updating Projects role columns: {"roleId":"role-id","columnPermissions":{...}}
🔄 [GATE B] Permission cache invalidated after columns update
✅ [GATE B] Projects role columns updated successfully

# Validation: RoleColumnVisibility table should have records for hidden/readonly columns only
EOF

echo ""

# Test 4: Frontend UI Navigation
print_section "Test 4: Frontend UI Integration"
echo "Testing: Admin UI with Projects Permissions tab"

cat << 'EOF'
# Manual test steps:
1. Open http://localhost:3000
2. Login as ADMIN user
3. Navigate: Settings > Manage Users > Roles & Permissions
4. Click "Projects Permissions" tab (new tab)

# Expected UI Structure:
Tab A: Page Access
  - Shows all roles with Projects page access status
  - Read-only view (controlled by legacy system)

Tab B: Table Actions
  - Checkboxes for each role × action combination
  - Actions: View, Create, Edit, Delete, Export, Approve
  - Real-time updates via PATCH /admin/permissions/projects/roles/:roleId/actions

Tab C: Column Rules
  - Role selector dropdown
  - Grouped columns by category (Project Info, Financial Data, etc.)
  - Checkboxes for: Visible, Read Only, Requires Approval
  - Real-time updates via PATCH /admin/permissions/projects/roles/:roleId/columns

# Validation Checklist:
✅ New "Projects Permissions" tab appears
✅ All 3 sub-tabs render without errors
✅ Data loads from GET /admin/permissions/projects/roles
✅ Table Actions checkboxes update permissions
✅ Column Rules update column visibility
✅ Console logs show success/error messages (check browser dev tools)
✅ Permission cache invalidation logs appear in backend
EOF

echo ""

# Success Criteria
print_section "🎯 Success Criteria for GATE B"
echo "Backend API Endpoints:"
echo "✅ GET /admin/permissions/projects/roles - Returns operational-board-grid specific data"
echo "✅ PATCH /admin/permissions/projects/roles/:roleId/actions - Updates table actions"
echo "✅ PATCH /admin/permissions/projects/roles/:roleId/columns - Updates column permissions"
echo "✅ Permission cache invalidated immediately after PATCH operations"
echo ""
echo "Frontend UI:"
echo "✅ Settings > Manage Users > Roles & Permissions > Projects Permissions tab"
echo "✅ Tab A: Page Access (read-only, shows current status)"
echo "✅ Tab B: Table Actions (interactive checkboxes for CRUD operations)"
echo "✅ Tab C: Column Rules (role-specific column visibility controls)"
echo ""
echo "Configuration:"
echo "✅ PERMISSIONS_V2_MODE stays OFF in .env.example (legacy system active)"
echo "✅ Projects-only scope maintained (no other tables touched)"

print_section "🔧 Useful Debug Commands"
echo "# Test API endpoint directly:"
echo "curl -X GET http://localhost:3001/api/admin/permissions/projects/roles \\"
echo "  -H \"Authorization: Bearer YOUR_TOKEN\""
echo ""
echo "# Check browser console for detailed error logs:"
echo "# - API Response Status and Content-Type"
echo "# - First 200 chars of non-JSON responses"
echo "# - apiFetch request logs with URL construction"
echo ""
echo "# Check role permissions in database:"
echo "psql -d your_db -c \"SELECT r.name, rta.actions FROM \\\"Role\\\" r LEFT JOIN \\\"RoleTableAccess\\\" rta ON r.id = rta.\\\"roleId\\\";\""
echo ""
echo "# Check column visibility settings:"
echo "psql -d your_db -c \"SELECT r.name, cv.\\\"columnKey\\\", cv.\\\"isHidden\\\", cv.\\\"isReadOnly\\\", cv.\\\"requiresApproval\\\" FROM \\\"Role\\\" r JOIN \\\"RoleColumnVisibility\\\" cv ON r.id = cv.\\\"roleId\\\" WHERE cv.\\\"tableId\\\" = (SELECT id FROM \\\"TableRegistry\\\" WHERE key = 'operational-board-grid');\""
echo ""
echo "# Monitor backend logs:"
echo "tail -f logs/app.log | grep -E \"(GATE B|apiFetch)\""

print_section "🔧 Troubleshooting 'Unexpected token <' Errors"
echo "If you see 'Unexpected token <' or JSON parsing errors:"
echo ""
echo "1. Check that backend is running on port 3001:"
echo "   curl http://localhost:3001/api/health"
echo ""
echo "2. Check Vite proxy is working (restart frontend after vite.config.ts changes):"
echo "   npm run dev (restart if you just added proxy config)"
echo ""
echo "3. Verify API routes are accessible:"
echo "   curl -I http://localhost:3001/api/admin/permissions/projects/roles"
echo ""
echo "4. Check browser Network tab for actual HTTP responses"
echo "5. Look for detailed error logs in browser console"

echo -e "\n${GREEN}🎉 GATE B test script ready!${NC}"
echo "Use the manual commands above with your ADMIN auth token to test Projects Admin UI."