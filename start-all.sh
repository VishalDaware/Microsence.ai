#!/bin/bash
# Complete startup script for the entire system

echo "======================================"
echo "Starting Soil Health Monitoring System"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "backend/index.js" ]; then
    echo "Error: Please run this script from the root project directory"
    exit 1
fi

echo -e "${BLUE}Starting Node.js Backend (port 5000)...${NC}"
cd backend
npm start &
NODE_PID=$!
echo -e "${GREEN}✓ Node.js started (PID: $NODE_PID)${NC}"

sleep 2

echo -e "${BLUE}Starting Python ML Service (port 5001)...${NC}"
python ml_service.py &
PYTHON_PID=$!
echo -e "${GREEN}✓ Python ML Service started (PID: $PYTHON_PID)${NC}"

cd ..

sleep 2

echo -e "${BLUE}Starting Frontend Dashboard (port 5173)...${NC}"
cd dashboard
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

cd ..

echo ""
echo "======================================"
echo -e "${GREEN}✓ All services started!${NC}"
echo "======================================"
echo ""
echo "Access the application at:"
echo -e "  ${BLUE}Frontend${NC}:      http://localhost:5173"
echo -e "  ${BLUE}Node.js API${NC}:   http://localhost:5000"
echo -e "  ${BLUE}ML Service${NC}:    http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all processes
wait $NODE_PID $PYTHON_PID $FRONTEND_PID
