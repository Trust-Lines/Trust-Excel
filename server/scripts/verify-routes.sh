#!/bin/bash
# Verify that the Projects permissions API routes are accessible

set -e

echo "🔍 Verifying Projects Permissions API Routes"
echo "============================================="

BASE_URL="http://localhost:3001"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if server is running
echo -e "\n${BLUE}1. Checking if backend server is running...${NC}"
if curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server is running${NC}"
else
    echo -e "${RED}❌ Backend server is not running on port 3001${NC}"
    echo "Please start the backend with: npm run start:dev"
    exit 1
fi

# Check API route structure
echo -e "\n${BLUE}2. Testing API route structure...${NC}"
echo "Testing: GET $BASE_URL/api/admin/permissions/projects/roles"

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nCONTENT_TYPE:%{content_type}" \
    "$BASE_URL/api/admin/permissions/projects/roles" 2>/dev/null)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
CONTENT_TYPE=$(echo "$RESPONSE" | grep "CONTENT_TYPE:" | cut -d: -f2)

echo "HTTP Status: $HTTP_STATUS"
echo "Content-Type: $CONTENT_TYPE"

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Route is accessible and returns 200${NC}"
    if [[ "$CONTENT_TYPE" == *"application/json"* ]]; then
        echo -e "${GREEN}✅ Response is JSON${NC}"
    else
        echo -e "${RED}❌ Response is not JSON: $CONTENT_TYPE${NC}"
        echo "First 200 chars of response:"
        echo "$RESPONSE" | head -c 200
    fi
elif [ "$HTTP_STATUS" = "401" ]; then
    echo -e "${GREEN}✅ Route requires authentication (expected for admin endpoint)${NC}"
elif [ "$HTTP_STATUS" = "404" ]; then
    echo -e "${RED}❌ Route not found (404) - check controller routing${NC}"
else
    echo -e "${RED}❌ Unexpected status: $HTTP_STATUS${NC}"
fi

# Test with authentication (if token provided)
echo -e "\n${BLUE}3. API Authentication Test${NC}"
if [ -n "$ADMIN_TOKEN" ]; then
    echo "Testing with provided ADMIN_TOKEN..."

    AUTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        "$BASE_URL/api/admin/permissions/projects/roles" 2>/dev/null)

    AUTH_STATUS=$(echo "$AUTH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    echo "Authenticated Status: $AUTH_STATUS"

    if [ "$AUTH_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Authentication successful${NC}"
    else
        echo -e "${RED}❌ Authentication failed${NC}"
    fi
else
    echo "ℹ️  To test authentication, set ADMIN_TOKEN environment variable:"
    echo "   export ADMIN_TOKEN=your-jwt-token"
    echo "   ./verify-routes.sh"
fi

echo -e "\n${BLUE}4. Summary${NC}"
echo "Backend URL: $BASE_URL"
echo "API Route: /api/admin/permissions/projects/roles"
echo "Controller: @Controller('admin') with global prefix 'api'"

echo -e "\n${BLUE}Next Steps:${NC}"
echo "1. If route returns 404: Check that backend has global prefix 'api'"
echo "2. If authentication fails: Get valid JWT token from login"
echo "3. If frontend still fails: Check Vite proxy configuration"
echo "4. Check browser Network tab for actual requests being made"