#!/bin/bash
# Crisis Compass: Local Testing Guide
# Run all tests to verify the API infrastructure works

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Crisis Compass: API Integration Testing Script      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Verify directory structure${NC}"
if [ -d "backend" ] && [ -f "backend/server.js" ] && [ -f "backend/etl.js" ]; then
  echo -e "${GREEN}✅ Backend directory structure OK${NC}"
else
  echo "❌ Backend directory missing"
  exit 1
fi
echo

echo -e "${BLUE}Step 2: Check Node.js installation${NC}"
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}✅ Node.js ${NODE_VERSION} installed${NC}"
else
  echo "❌ Node.js not found"
  exit 1
fi
echo

echo -e "${BLUE}Step 3: Verify dependencies${NC}"
if [ -d "node_modules" ]; then
  echo -e "${GREEN}✅ Dependencies installed${NC}"
else
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install > /dev/null 2>&1
  echo -e "${GREEN}✅ Dependencies installed${NC}"
fi
echo

echo -e "${BLUE}Step 4: Validate JSON files${NC}"
if python3 -m json.tool resources.json > /dev/null 2>&1; then
  echo -e "${GREEN}✅ resources.json valid${NC}"
else
  echo "❌ resources.json invalid"
  exit 1
fi
echo

echo -e "${BLUE}Step 5: Run ETL with mock data${NC}"
if node backend/etl.js 2>&1 | grep -q "✨ ETL complete"; then
  echo -e "${GREEN}✅ ETL script working${NC}"
else
  echo "❌ ETL script failed"
  exit 1
fi
echo

echo -e "${BLUE}Step 6: Verify generated resources.json${NC}"
RESOURCE_COUNT=$(node -e "console.log(require('./resources.json').length)")
if [ "$RESOURCE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Generated ${RESOURCE_COUNT} resources${NC}"
else
  echo "❌ No resources generated"
  exit 1
fi
echo

echo -e "${BLUE}Step 7: Test API server startup${NC}"
(sleep 2 && curl -s http://localhost:3000/api/health > /tmp/health.json && pkill -f "node backend/server.js") &
timeout 5 node backend/server.js > /dev/null 2>&1 || true

if [ -f /tmp/health.json ]; then
  STATUS=$(cat /tmp/health.json | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  if [ "$STATUS" = "ok" ]; then
    echo -e "${GREEN}✅ API health check successful${NC}"
  else
    echo "❌ API health check failed"
    exit 1
  fi
else
  echo "❌ API server failed to start"
  exit 1
fi
echo

echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ All tests passed! Your API infrastructure is ready.${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo
echo "Next steps:"
echo "  1. npm start           # Start the API server"
echo "  2. curl http://localhost:3000/api/resources"
echo "  3. Register for real API keys (SAMHSA, HUD)"
echo "  4. Update backend/etl.js with real endpoints"
echo "  5. Deploy to production"
echo
echo "Documentation:"
echo "  • docs/LAUNCH_CHECKLIST.md      → Overview"
echo "  • docs/API_IMPLEMENTATION.md    → Quick-start"
echo "  • docs/DEPLOYMENT.md            → Deployment options"
echo "  • docs/API_INTEGRATION_GUIDE.md → Technical details"
