#!/bin/bash
# Mission Control Startup Script
cd /Users/emmanuelmiller/MissionControl

echo "🚀 Starting Mission Control v2.0..."
echo "📍 Directory: $(pwd)"

# Check if PM2 processes are running
if pm2 list | grep -q "mission-control"; then
    echo "⚡ Mission Control is already running!"
    pm2 status
else
    echo "🔧 Starting Mission Control daemon..."
    pm2 start ecosystem.config.cjs
fi

echo ""
echo "✅ Mission Control is ready!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "📊 Check status: pm2 status"
echo "📝 View logs:   pm2 logs"
echo "🛑 Stop:        pm2 stop all"
echo ""