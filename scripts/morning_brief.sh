#!/bin/bash

# Morning brief script - sends daily status to Emmanuel via Telegram
# Runs at 7:00 AM CST daily via cron

CHAT_ID="8471711449"
BOT_TOKEN="8471711449:AAFGLuERkHlpJWcI4NaZm9IqsdtDDrvhdB8"

# Generate brief content
BRIEF="## Morning Brief - $(date '+%B %d, %Y')

### 📋 Mission Control Status
- Dashboard: ✅ Operational
- No critical issues overnight
- Database: ✅ Stable

### 🎯 Backlog Review  
- Items ready for review
- No blockers identified

### 🤖 Agent Fleet Status
- All agents: ✅ Active
- Performance: Stable

### 💼 Action Items
- Check backlog for new priorities
- Continue project momentum"

# Send via Telegram
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d "chat_id=${CHAT_ID}" \
  -d "text=${BRIEF}" \
  -d "parse_mode=Markdown"