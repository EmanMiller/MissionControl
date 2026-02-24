#!/bin/bash
# Mission Control Update Script
cd /Users/emmanuelmiller/MissionControl

echo "🔄 Updating Mission Control..."
echo "📡 Pulling latest changes..."
git pull origin main

echo "🔨 Building frontend..."
npm run build

echo "♻️  Restarting services..."
pm2 restart all

echo ""
echo "✅ Mission Control updated and restarted!"
echo "🌐 Available at: http://localhost:5173"
pm2 status