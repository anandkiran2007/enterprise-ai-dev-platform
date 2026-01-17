#!/bin/bash

# Testing script for Enterprise AI Dashboard
# This script runs various tests and checks

set -e

echo "🧪 Running Dashboard Tests..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the dashboard directory
if [ ! -f "package.json" ]; then
    echo "${RED}❌ Error: Must run from dashboard directory${NC}"
    exit 1
fi

# Function to check command result
check_result() {
    if [ $? -eq 0 ]; then
        echo "${GREEN}✅ $1${NC}"
    else
        echo "${RED}❌ $1${NC}"
        exit 1
    fi
}

# 1. Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Node.js: $NODE_VERSION"
check_result "Node.js version check"

# 2. Check if dependencies are installed
echo ""
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "${YELLOW}⚠️  Dependencies not installed. Running npm install...${NC}"
    npm install
    check_result "Dependencies installation"
else
    echo "${GREEN}✅ Dependencies installed${NC}"
fi

# 3. Type checking
echo ""
echo "🔍 Running TypeScript type check..."
npm run type-check
check_result "TypeScript type check"

# 4. Linting
echo ""
echo "🔍 Running ESLint..."
npm run lint
check_result "ESLint check"

# 5. Build test
echo ""
echo "🏗️  Testing production build..."
npm run build
check_result "Production build"

# 6. Check for common issues
echo ""
echo "🔍 Checking for common issues..."

# Check for console.log statements (should be removed in production)
if grep -r "console.log" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "// eslint-disable" | head -1; then
    echo "${YELLOW}⚠️  Found console.log statements (consider removing for production)${NC}"
else
    echo "${GREEN}✅ No console.log statements found${NC}"
fi

# Check for TODO comments
TODO_COUNT=$(grep -r "TODO" src/ --exclude-dir=node_modules 2>/dev/null | wc -l | tr -d ' ')
if [ "$TODO_COUNT" -gt 0 ]; then
    echo "${YELLOW}⚠️  Found $TODO_COUNT TODO comments${NC}"
else
    echo "${GREEN}✅ No TODO comments found${NC}"
fi

# 7. Check environment variables
echo ""
echo "🔍 Checking environment configuration..."
if [ -f ".env.local" ]; then
    echo "${GREEN}✅ .env.local file found${NC}"
    if grep -q "NEXT_PUBLIC_API_URL" .env.local; then
        echo "${GREEN}✅ NEXT_PUBLIC_API_URL configured${NC}"
    else
        echo "${YELLOW}⚠️  NEXT_PUBLIC_API_URL not found in .env.local${NC}"
    fi
else
    echo "${YELLOW}⚠️  .env.local file not found (optional)${NC}"
fi

# 8. Check API connectivity (if configured)
echo ""
echo "🔍 Checking API connectivity..."
if [ -f ".env.local" ] && grep -q "NEXT_PUBLIC_API_URL" .env.local; then
    API_URL=$(grep "NEXT_PUBLIC_API_URL" .env.local | cut -d '=' -f2)
    if curl -f -s "$API_URL/health" > /dev/null 2>&1; then
        echo "${GREEN}✅ API is reachable at $API_URL${NC}"
    else
        echo "${YELLOW}⚠️  API not reachable at $API_URL (may not be running)${NC}"
    fi
else
    echo "${YELLOW}⚠️  API URL not configured${NC}"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run dev' to start development server"
echo "  2. Open http://localhost:3000 in your browser"
echo "  3. Test each page according to TESTING_GUIDE.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
