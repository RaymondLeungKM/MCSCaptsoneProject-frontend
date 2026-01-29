#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🚀 Preschool Vocabulary Platform - Quick Start   ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Python
echo -e "${YELLOW}Checking Python...${NC}"
if command_exists python; then
    PYTHON_VERSION=$(python --version 2>&1)
    echo -e "${GREEN}✓${NC} Python found: $PYTHON_VERSION"
else
    echo -e "${RED}✗${NC} Python not found. Please install Python 3.8+"
    exit 1
fi

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js found: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check PostgreSQL
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if command_exists psql; then
    POSTGRES_VERSION=$(psql --version)
    echo -e "${GREEN}✓${NC} PostgreSQL found: $POSTGRES_VERSION"
else
    echo -e "${YELLOW}⚠${NC}  PostgreSQL CLI not in PATH (but might be running)"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Starting Services...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if backend is already running
echo -e "${YELLOW}Checking backend...${NC}"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend already running on http://localhost:8000"
    BACKEND_RUNNING=true
else
    echo -e "${YELLOW}⚠${NC}  Backend not running. Start it with:"
    echo -e "   ${BLUE}cd backend && source venv/bin/activate && python main.py${NC}"
    BACKEND_RUNNING=false
fi

# Check if frontend is already running
echo -e "${YELLOW}Checking frontend...${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend already running on http://localhost:3000"
    FRONTEND_RUNNING=true
else
    echo -e "${YELLOW}⚠${NC}  Frontend not running. Start it with:"
    echo -e "   ${BLUE}npm run dev${NC}"
    FRONTEND_RUNNING=false
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Status Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$BACKEND_RUNNING" = true ] && [ "$FRONTEND_RUNNING" = true ]; then
    echo -e "${GREEN}✓${NC} Both services are running!"
    echo ""
    echo -e "${GREEN}🎉 Your app is ready!${NC}"
    echo ""
    echo -e "  Frontend: ${BLUE}http://localhost:3000${NC}"
    echo -e "  Backend:  ${BLUE}http://localhost:8000${NC}"
    echo -e "  API Docs: ${BLUE}http://localhost:8000/docs${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Visit http://localhost:3000"
    echo "  2. Register a new account"
    echo "  3. Create a child profile"
    echo "  4. Start learning!"
elif [ "$BACKEND_RUNNING" = true ]; then
    echo -e "${YELLOW}⚠${NC}  Backend is running, but frontend is not"
    echo ""
    echo -e "Start the frontend with:"
    echo -e "  ${BLUE}npm run dev${NC}"
elif [ "$FRONTEND_RUNNING" = true ]; then
    echo -e "${YELLOW}⚠${NC}  Frontend is running, but backend is not"
    echo ""
    echo -e "Start the backend with:"
    echo -e "  ${BLUE}cd backend && source venv/bin/activate && python main.py${NC}"
else
    echo -e "${YELLOW}⚠${NC}  Neither service is running"
    echo ""
    echo -e "Terminal 1 - Start Backend:"
    echo -e "  ${BLUE}cd backend${NC}"
    echo -e "  ${BLUE}source venv/bin/activate${NC}"
    echo -e "  ${BLUE}python main.py${NC}"
    echo ""
    echo -e "Terminal 2 - Start Frontend:"
    echo -e "  ${BLUE}npm run dev${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Quick Reference${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo ""
echo -e "  Check backend logs:"
echo -e "    ${BLUE}cd backend && tail -f logs/app.log${NC} (if logging enabled)"
echo ""
echo -e "  Test API endpoints:"
echo -e "    ${BLUE}curl http://localhost:8000/health${NC}"
echo ""
echo -e "  Database console:"
echo -e "    ${BLUE}cd backend && python${NC}"
echo -e "    ${BLUE}>>> from app.db.session import SessionLocal${NC}"
echo ""
echo -e "  Clear browser data:"
echo -e "    Open DevTools → Application → Storage → Clear site data"
echo ""
echo -e "${YELLOW}Troubleshooting:${NC}"
echo ""
echo -e "  If backend won't start:"
echo -e "    • Check if port 8000 is in use: ${BLUE}lsof -i :8000${NC}"
echo -e "    • Check PostgreSQL is running"
echo -e "    • Check .env file exists in backend/"
echo ""
echo -e "  If frontend shows errors:"
echo -e "    • Clear localStorage: DevTools → Application → Local Storage"
echo -e "    • Check .env.local exists"
echo -e "    • Restart dev server"
echo ""
echo -e "${GREEN}📚 Documentation:${NC}"
echo -e "  • API_MIGRATION_COMPLETE.md - What's been updated"
echo -e "  • API_INTEGRATION.md - How to use the API"
echo -e "  • INTEGRATION_COMPLETE.md - Setup guide"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
