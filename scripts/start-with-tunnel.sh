#!/bin/bash
# Mission Control - Seamless Mobile Setup with LocalTunnel
# Usage: npm run dev:mobile OR ./scripts/start-with-tunnel.sh

set -e

echo "🚀 Mission Control - Mobile Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if localtunnel is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server && npm install && cd ..
fi

# Check if .env.local exists, if not create from example
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your OAuth credentials before continuing."
    exit 1
fi

# Check if backend .env exists
if [ ! -f "server/.env" ]; then
    echo "⚠️  server/.env not found. Creating from server/.env.example..."
    cp server/.env.example server/.env
    echo "⚠️  Please update server/.env with your OAuth secrets before continuing."
    exit 1
fi

echo "🔄 Starting Mission Control with mobile tunneling..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    if [ -n "$TUNNEL_PID" ]; then
        kill $TUNNEL_PID 2>/dev/null || true
    fi
    exit 0
}

trap cleanup EXIT INT TERM

# Start backend server
echo "🔧 Starting backend server on port 3001..."
cd server
npm run dev > ../.backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start. Check .backend.log"
        exit 1
    fi
done

# Start localtunnel for backend (use try-port to avoid collisions)
echo "🌐 Starting backend tunnel..."
npx localtunnel --port 3001 --subdomain missioncontrol-api-$RANDOM > .tunnel-backend.log 2>&1 &
TUNNEL_PID=$!

# Wait a moment for tunnel to start
sleep 3

# Extract the tunnel URL from logs
BACKEND_URL=$(grep -o 'https://[a-z0-9-]*\.loca\.lt' .tunnel-backend.log | head -1)

if [ -z "$BACKEND_URL" ]; then
    # Fallback - check if tunnel is running
    echo "⚠️  Waiting for backend tunnel to initialize..."
    sleep 3
    BACKEND_URL=$(grep -o 'https://[a-z0-9-]*\.loca\.lt' .tunnel-backend.log | head -1)
fi

if [ -z "$BACKEND_URL" ]; then
    echo "⚠️  Using auto-generated tunnel URL"
    BACKEND_URL="https://missioncontrol-api-$RANDOM.loca.lt"
fi

echo -e "${GREEN}✅ Backend tunnel: $BACKEND_URL${NC}"

# Update .env.local with the tunnel URL
if command -v sed &> /dev/null; then
    # Linux/Mac sed
    sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=$BACKEND_URL/api|" .env.local 2>/dev/null || true
    rm -f .env.local.bak
fi

echo "📝 Updated .env.local with tunnel URL"

# Start frontend
echo "🔧 Starting frontend development server..."
npm run dev -- --host > .frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is ready!${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "⚠️  Frontend may still be starting..."
    fi
done

# Start tunnel for frontend
echo "🌐 Starting frontend tunnel..."
npx localtunnel --port 5173 --subdomain missioncontrol-app-$RANDOM > .tunnel-frontend.log 2>&1 &
FRONTEND_TUNNEL_PID=$!

# Wait for frontend tunnel
sleep 4

# Extract frontend tunnel URL
FRONTEND_URL=$(grep -o 'https://[a-z0-9-]*\.loca\.lt' .tunnel-frontend.log | head -1)

if [ -z "$FRONTEND_URL" ]; then
    echo "⚠️  Waiting for frontend tunnel to initialize..."
    sleep 3
    FRONTEND_URL=$(grep -o 'https://[a-z0-9-]*\.loca\.lt' .tunnel-frontend.log | head -1)
fi

if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL="https://missioncontrol-app-$RANDOM.loca.lt"
fi

echo ""
echo "=================================="
echo -e "${GREEN}🎉 Mission Control is LIVE!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}📱 Mobile URL (for iPhone):${NC}"
echo -e "${YELLOW}$FRONTEND_URL${NC}"
echo ""
echo -e "${BLUE}💻 Local URL:${NC}"
echo -e "${YELLOW}http://localhost:5173${NC}"
echo ""
echo -e "${BLUE}🔗 Backend API:${NC}"
echo -e "${YELLOW}$BACKEND_URL/api${NC}"
echo ""
echo "=================================="
echo ""
echo "📋 Google Cloud Console Setup:"
echo "   Authorized JavaScript origins: $FRONTEND_URL"
echo "   Authorized redirect URIs: $FRONTEND_URL/auth/google/callback"
echo ""
echo "⚠️  IMPORTANT: Add the above URLs to your Google OAuth credentials!"
echo ""
echo "📝 Logs:"
echo "   Backend: .backend.log"
echo "   Frontend: .frontend.log"
echo "   Backend Tunnel: .tunnel-backend.log"
echo "   Frontend Tunnel: .tunnel-frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait