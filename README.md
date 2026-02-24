# Mission Control v2.0 🚀

> **Next-Generation AI Agent Fleet Management Platform**  
> An advanced dashboard for orchestrating, monitoring, and managing your AI agent workforce with real-time analytics, 3D visualization, and seamless OpenClaw integration.

**Mission Control v2.0** transforms your AI workflow with comprehensive agent management, beautiful 3D team visualization, performance analytics, and advanced task orchestration. Built for teams who need professional-grade AI automation at scale.

**🎯 Now Enhanced with Full Agent Fleet Management**

## ⚡ Quick Start (2 Minutes)

```bash
git clone https://github.com/EmanMiller/MissionControl.git
cd MissionControl
npm install
cd server && npm install && cd ..
npm run dev
```

**That's it!** Mission Control v2.0 opens with **local authentication** and **auto-discovers your OpenClaw agents**.

## 🎉 What's New in v2.0 (Major Release)

### 🤖 **Complete Agent Fleet Management**
- ✅ **3D Team Visualization** - Beautiful voxel office showing your entire AI team
- ✅ **Agent CRUD Operations** - Create, edit, delete, and manage AI agents
- ✅ **Real-time Status Tracking** - Live agent status updates (idle/working/error/offline)
- ✅ **OpenClaw Auto-Sync** - Automatically discovers and syncs your existing agents
- ✅ **Task Assignment System** - Assign specific tasks to specific agents
- ✅ **Performance Analytics** - Track agent efficiency, completion rates, and metrics

### 📊 **Advanced Analytics Dashboard**
- ✅ **Fleet Performance Metrics** - Overall agent utilization and success rates
- ✅ **Task Completion Analytics** - Historical trends and completion insights
- ✅ **Agent Leaderboards** - Top performing agents with detailed stats
- ✅ **Real-time Charts** - Visual progress tracking and activity monitoring

### ⚡ **Real-time Everything**
- ✅ **WebSocket Updates** - Instant status changes across all users
- ✅ **Live Agent Status** - Real-time agent working/idle state changes
- ✅ **Task Progress Updates** - Automatic task status synchronization
- ✅ **Multi-user Support** - Each user gets their own real-time updates

### 🎨 **Enhanced User Experience**
- ✅ **Professional UI/UX** - Polished interface with smooth animations
- ✅ **Mobile Responsive** - Works perfectly on all devices
- ✅ **Error Boundaries** - Graceful error handling and recovery
- ✅ **Loading States** - Professional loading indicators throughout

## ✨ Features Overview

### 🏢 **3D Team Office**
- **Voxel-style 3D Office** - Immersive team visualization
- **Agent Avatars** - Color-coded avatars for each team member and AI agent
- **Real-time Positioning** - Agents appear/disappear based on status
- **Interactive Labels** - Click to view agent details and performance

### 🤖 **Agent Management**
- **Agent Types** - Coding, Research, Analysis, Creative, System agents
- **Capability Tracking** - Define and track what each agent can do
- **Performance Monitoring** - Success rates, response times, task counts
- **Status Management** - Manual and automatic agent status updates

### 📋 **Advanced Task Management**
- **Agent Assignment** - Assign tasks to specific agents
- **Visual Indicators** - See which agent is working on each task
- **Automatic Progression** - Tasks move through pipeline automatically
- **Assignment History** - Track which agents worked on which tasks

### 📊 **Analytics & Insights**
- **Dashboard Metrics** - Agent count, completion rates, efficiency stats
- **Performance Trends** - Historical charts and activity graphs
- **Agent Comparison** - Side-by-side agent performance analysis
- **Export Capabilities** - Download reports and analytics data

### 🔄 **OpenClaw Integration**
- **Auto-Discovery** - Finds existing OpenClaw agents automatically
- **Multi-Endpoint Support** - Tries multiple API endpoints for compatibility
- **Sync Management** - Manual and automatic agent synchronization
- **Status Bridging** - Syncs agent status between systems

## 🚀 Navigation Overview

Mission Control v2.0 provides comprehensive views for different aspects of your AI operation:

- **📋 Tasks** - Enhanced Kanban board with agent assignment
- **👥 Team** - 3D office visualization of your AI workforce
- **⚙️ Manage Agents** - Full CRUD operations for agent management
- **📈 Analytics** - Performance metrics and insights dashboard
- **📅 Calendar** - Schedule and timeline management
- **📁 Projects** - Project organization and tracking
- **✅ Approvals** - Workflow approvals and sign-offs

## 🔐 Authentication & Security

### Local Development (Default)
- **Zero setup** - works immediately with `npm run dev`
- **Local SQLite database** - all data persists locally
- **All features enabled** - full v2.0 functionality without OAuth
- **Multi-user simulation** - test real-time features locally

### Production OAuth
For production deployment with real authentication:

**Google OAuth:**
```bash
# Frontend (.env.local)
VITE_AUTH_MODE=oauth
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Backend (server/.env)
AUTH_MODE=oauth
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**GitHub OAuth:**
```bash
VITE_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## 🤖 OpenClaw Integration

### Automatic Agent Discovery

Mission Control v2.0 automatically discovers your OpenClaw agents:

1. **Configure OpenClaw Connection** - Add your endpoint in Settings
2. **Auto-Sync on First Visit** - Agents appear automatically in Team view
3. **Manual Sync Available** - "Sync OpenClaw" button for on-demand updates
4. **Real-time Status Updates** - Agent status syncs between systems

### Supported OpenClaw Endpoints

Mission Control tries multiple endpoints for maximum compatibility:
- `/api/agents_list` - Primary agent listing endpoint
- `/api/sessions_list` - Active session discovery
- `/api/subagents` - Sub-agent management
- `/api/agents` - Standard agents API

### Agent Types and Capabilities

OpenClaw agents are automatically categorized:
- **Coding Agents** - Purple avatars, development tasks
- **Research Agents** - Green avatars, information gathering
- **General Agents** - Cyan avatars, multi-purpose tasks
- **Analysis Agents** - Orange avatars, data processing
- **Creative Agents** - Pink avatars, content generation

## 📊 Real-time Features

### WebSocket Architecture

Mission Control v2.0 includes a full WebSocket server for real-time updates:

```javascript
// Backend WebSocket Events
broadcastAgentUpdate(userId, {
  type: 'created|status-updated|deleted',
  agent: agentData
});

// Frontend Real-time Listeners
socketService.on('agent-updated', (data) => {
  // Automatic UI updates
});
```

### Multi-User Support

Each user gets their own real-time room:
- **User-specific updates** - Only see your agents and tasks
- **Concurrent collaboration** - Multiple users can work simultaneously
- **Cross-device sync** - Changes appear on all your devices instantly

## 🏗️ Enhanced Architecture

### Frontend (React + Vite + WebSockets)
- **React 18** with modern hooks and concurrent features
- **Socket.io Client** for real-time WebSocket communication
- **Tailwind CSS** with custom animations and transitions
- **Three.js** for 3D team office visualization
- **Chart.js/Recharts** for analytics dashboards
- **Framer Motion** for smooth animations

### Backend (Node.js + Express + Socket.io)
- **Express.js** with ES modules and modern async/await
- **Socket.io Server** for real-time WebSocket communication
- **SQLite/PostgreSQL** with enhanced schema for agents
- **JWT Authentication** with user-specific room management
- **OpenClaw Integration** with multi-endpoint discovery

### Enhanced Database Schema
```sql
-- Users table (unchanged)
users: id, email, name, provider, openclaw_endpoint, openclaw_token

-- Enhanced tasks table
tasks: id, user_id, assigned_agent_id, status, processing_metrics

-- New agents table
agents: id, user_id, openclaw_id, name, type, status, capabilities, performance_stats

-- Analytics and session tracking
sessions: user_id, agent_updates, task_assignments
```

## 📋 Enhanced API Endpoints

### Agent Management
- `GET /api/agents` - Get user's AI agents
- `POST /api/agents` - Create new agent
- `PUT /api/agents/:id/status` - Update agent status
- `DELETE /api/agents/:id` - Delete agent
- `POST /api/openclaw/sync-agents` - Sync from OpenClaw

### Analytics
- `GET /api/analytics/dashboard` - Overall dashboard metrics
- `GET /api/analytics/agents/:id` - Agent-specific analytics
- `POST /api/analytics/agents/:id/update-stats` - Update performance stats

### Real-time WebSocket Events
- `agent-updated` - Agent status/data changes
- `task-updated` - Task assignment/status changes
- `join-user-room` - Subscribe to user-specific updates

## 🧪 Testing

Run the enhanced test suite:

```bash
npm run test-system
```

New tests validate:
- ✅ Agent CRUD operations
- ✅ WebSocket real-time functionality
- ✅ OpenClaw multi-endpoint discovery
- ✅ Analytics dashboard accuracy
- ✅ Task-agent assignment flows
- ✅ 3D visualization rendering

## 📱 Mobile Excellence

Mission Control v2.0 is fully mobile-optimized:

```bash
# Mobile development with tunnels
npm run dev:mobile
```

**Mobile Features:**
- ✅ **Touch-optimized UI** - Perfect touch targets and gestures
- ✅ **Responsive 3D Office** - 3D visualization works on mobile
- ✅ **Swipe Gestures** - Intuitive navigation and interactions
- ✅ **Mobile Agent Management** - Full CRUD on small screens
- ✅ **Real-time Mobile Updates** - WebSocket updates work perfectly

## 🔍 Advanced Troubleshooting

### Agent Sync Issues
```bash
# Check OpenClaw connection
curl http://localhost:18789/api/agents_list

# Force manual sync
POST http://localhost:3001/api/openclaw/sync-agents
```

### WebSocket Connection Issues
```bash
# Check WebSocket server
curl http://localhost:3001/socket.io/

# Debug real-time updates
console.log(socketService.connected);
```

### 3D Visualization Issues
```bash
# Clear Three.js cache
localStorage.clear();

# Check WebGL support
navigator.userAgent; // Check for WebGL compatibility
```

## 🚀 Production Deployment

### Environment Configuration

**Frontend (.env.local):**
```bash
VITE_AUTH_MODE=oauth
VITE_API_URL=https://your-api.railway.app/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**Backend (server/.env):**
```bash
NODE_ENV=production
AUTH_MODE=oauth
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your_super_secure_jwt_secret_for_production
PUBLIC_URL=https://your-api.railway.app
```

### Deployment Steps

1. **Backend on Railway:**
   - Connect GitHub repository
   - Set environment variables
   - Deploy automatically on push

2. **Frontend on Vercel:**
   - Connect GitHub repository
   - Build command: `npm run build`
   - Output directory: `dist`
   - Deploy automatically on push

3. **WebSocket Configuration:**
   - Ensure WebSocket support on hosting platform
   - Configure CORS for real-time connections
   - Set proper PUBLIC_URL for webhooks

## 🤝 Contributing

Mission Control v2.0 welcomes contributions:

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-v2-feature`)
3. **Test thoroughly** with `npm run dev` and `npm run test-system`
4. **Commit with descriptive messages** (`git commit -m '✨ Add agent performance analytics'`)
5. **Push to branch** (`git push origin feature/amazing-v2-feature`)
6. **Open Pull Request** with detailed description

### Development Guidelines

- **Feature Branches** - Use descriptive branch names
- **Commit Messages** - Use emoji prefixes and clear descriptions
- **Testing** - All new features must include tests
- **Documentation** - Update README for user-facing changes
- **Real-time Features** - Test WebSocket functionality thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository:** https://github.com/EmanMiller/MissionControl
- **OpenClaw:** https://openclaw.ai
- **Issues:** https://github.com/EmanMiller/MissionControl/issues
- **Discussions:** https://github.com/EmanMiller/MissionControl/discussions
- **v2.0 Release Notes:** https://github.com/EmanMiller/MissionControl/releases/tag/v2.0.0

---

**🚀 Ready to manage your AI agent fleet with style? Start with `npm run dev` and explore the beautiful 3D team office!**

## 🎊 What's Next?

Mission Control v2.0 is just the beginning. Future versions will include:
- **Agent Marketplace** - Discover and install new agent types
- **Advanced Workflows** - Multi-agent task pipelines
- **Team Collaboration** - Shared agent pools and task boards
- **AI Training Integration** - Fine-tune agents based on performance
- **Enterprise Features** - SSO, advanced security, audit logs

**Join the community and help shape the future of AI agent management!**