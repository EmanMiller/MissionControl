# Mission Control v1.0 🚀

> **Production-Ready AI Task Management Platform**  
> An autonomous network of AI agents that operates around the clock, executing tasks and generating value continuously at a highly cost-efficient rate.

**Mission Control** is a production-ready web application that connects to your OpenClaw instance, allowing you to create tasks that get automatically processed by AI agents. Simply add a task, watch it move through the pipeline (New → In Progress → Completed), and receive the completed output.

**🎯 Now Open Source & Ready for Production Deployment**

## 🎉 What's New in v1.0 (Production Release)

- ✅ **Demo Mode Removed** - Production-ready OAuth-only authentication
- ✅ **Simplified Kanban Board** - Clean 3-column workflow (New → In Progress → Completed)  
- ✅ **Enhanced Task Flow** - Automatic progression with real-time notifications
- ✅ **Console Error Free** - Zero browser console errors for professional UX
- ✅ **URL Validation** - Robust OpenClaw endpoint validation with helpful error messages
- ✅ **Mobile Optimized** - Perfect responsive design across all device types
- ✅ **Production Hardened** - Security enhancements, error handling, and performance optimizations

## ✨ Features

- **🔐 Production OAuth Authentication** - Google, GitHub, and Apple Sign In (no demo mode)
- **🤖 OpenClaw Integration** - Direct connection to your OpenClaw instance with enhanced validation
- **📋 Streamlined Task Management** - Clean 3-column Kanban: New → In Progress → Completed
- **📊 Real-time Dashboard** - Monitor system status and task progress with toast notifications
- **🎯 Dynamic Team Visualization** - 3D voxel office showing you + your AI agents
- **📱 Mobile Responsive** - Works perfectly on desktop, tablet, and mobile devices
- **🔄 Automated Task Flow** - Tasks automatically progress through pipeline with AI processing
- **⚡ Enhanced UX** - Time estimates, visual feedback, and production-ready error handling
- **🛡️ Security Hardened** - JWT authentication, input validation, and secure OAuth flows

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/EmanMiller/MissionControl.git
cd MissionControl

# Install frontend dependencies
npm install

# Install backend dependencies  
cd server
npm install
cd ..
```

### 2. Configure Environment

```bash
# Frontend configuration
cp .env.example .env.local
# Edit .env.local with your OAuth credentials (see OAuth Setup below)

# Backend configuration
cd server
cp .env.example .env
# Edit .env with your configuration
cd ..
```

### 3. Start the Application

```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend (in separate terminal)
npm run dev
```

### 4. Open Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## 🔧 OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins: `http://localhost:5173`
6. Add authorized redirect URIs: `http://localhost:5173/auth/google/callback`
7. Copy Client ID to `.env.local` as `VITE_GOOGLE_CLIENT_ID`

### GitHub OAuth

1. Go to [GitHub Settings > Developer settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set Homepage URL: `http://localhost:5173`
4. Set Authorization callback URL: `http://localhost:5173/auth/github/callback`
5. Copy Client ID to `.env.local` as `VITE_GITHUB_CLIENT_ID`
6. Copy Client Secret to `server/.env` as `GITHUB_CLIENT_SECRET`

### Apple Sign In

1. Go to [Apple Developer Console](https://developer.apple.com)
2. Create Service ID for Sign in with Apple
3. Configure domains and redirect URLs
4. Copy Service ID to `.env.local` as `VITE_APPLE_CLIENT_ID`

## 🔌 OpenClaw Integration

### Connecting Your OpenClaw Instance

1. **Sign into Mission Control** using any OAuth provider
2. **Go to Settings** (bottom navigation)
3. **Configure OpenClaw Integration:**
   - **Endpoint:** Your OpenClaw URL (e.g., `http://localhost:18789`)
   - **Token:** Optional authentication token
4. **Test Connection** - Verify Mission Control can reach OpenClaw
5. **Save Configuration**

### How It Works

1. **Create Task** - Add a new task with title and description
2. **Start Processing** - Click "Start Processing" to send to OpenClaw
3. **Automatic Execution** - OpenClaw receives and processes the task
4. **Status Updates** - Mission Control polls for completion
5. **View Results** - Completed tasks show results and deliverables

### OpenClaw Webhook (Optional)

For faster updates, configure OpenClaw to send webhooks to:
```
POST http://localhost:3001/api/openclaw/webhook
```

Webhook payload should include:
```json
{
  "session_id": "openclaw_session_id", 
  "status": "completed|failed",
  "result": "task_output_data"
}
```

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS with dark theme
- **Authentication:** Google OAuth, GitHub OAuth, Apple Sign In
- **Icons:** Lucide React
- **API Client:** Custom axios-based client

### Backend (Node.js + Express)
- **Framework:** Express.js with ES modules
- **Database:** SQLite with automatic setup
- **Authentication:** JWT tokens with OAuth validation
- **OpenClaw Integration:** HTTP API with polling and webhooks
- **Security:** Helmet, CORS, input validation

### Database Schema
- **users** - OAuth user profiles and OpenClaw config
- **tasks** - Task management with OpenClaw session tracking  
- **sessions** - JWT session management
- **oauth_states** - OAuth security state validation

## 📋 API Endpoints

### Authentication (Production OAuth Only)
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/github/callback` - GitHub OAuth callback  
- `POST /api/auth/apple` - Apple Sign In
- `POST /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Sign out
- ❌ **Demo endpoints removed** - Production uses real OAuth only

### Tasks
- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id/status` - Update task status
- `GET /api/tasks/stats/summary` - Task statistics

### OpenClaw
- `GET /api/openclaw/config` - Get OpenClaw configuration
- `POST /api/openclaw/config` - Save OpenClaw configuration  
- `POST /api/openclaw/test` - Test OpenClaw connection
- `POST /api/openclaw/webhook` - Webhook for task completion

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard` - Dashboard statistics

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm run test-system
```

Tests validate:
- ✅ Backend health and API endpoints
- ✅ Authentication middleware protection
- ✅ Database connectivity and schema
- ✅ OpenClaw integration endpoints
- ✅ Frontend accessibility and rendering
- ✅ Error handling and security

## 🚀 Deployment

### Prerequisites
- Node.js 18+ 
- OpenClaw instance (local or remote)
- OAuth app credentials from providers

### Production Environment Variables

**Frontend (.env.local):**
```bash
VITE_API_URL=https://your-api-domain.com/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id  
VITE_APPLE_CLIENT_ID=your_apple_client_id
```

**Backend (.env):**
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=your_super_secret_jwt_key_change_this
FRONTEND_URL=https://your-frontend-domain.com
PUBLIC_URL=https://your-api-domain.com

# OAuth secrets
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

### Build and Deploy

```bash
# Build frontend
npm run build

# Start production server
cd server
npm start
```

## 🔍 Troubleshooting

### Common Issues

**OAuth "Invalid Client" Error:**
- Verify OAuth credentials in environment files
- Check authorized redirect URLs match exactly
- Ensure OAuth apps are configured for correct domain

**OpenClaw Connection Failed:**
- Verify OpenClaw is running and accessible
- Check endpoint URL format (include http:// or https://)
- Test authentication token if using secured OpenClaw

**Database Errors:**
- Delete `server/mission-control.db` to reset database
- Check file permissions in server directory
- Verify SQLite3 is properly installed

**Tasks Stuck "In Progress":**
- Check OpenClaw logs for processing errors
- Verify webhook URL configuration
- Manual polling occurs every 2 minutes as fallback

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`) 
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository:** https://github.com/EmanMiller/MissionControl
- **OpenClaw:** https://openclaw.ai
- **Issues:** https://github.com/EmanMiller/MissionControl/issues
- **Discussions:** https://github.com/EmanMiller/MissionControl/discussions