# Mission Control v1.0 🚀

> **Production-Ready AI Task Management Platform**  
> An autonomous network of AI agents that operates around the clock, executing tasks and generating value continuously at a highly cost-efficient rate.

**Mission Control** is a production-ready web application that connects to your OpenClaw instance, allowing you to create tasks that get automatically processed by AI agents. Simply add a task, watch it move through the pipeline (New → In Progress → Completed), and receive the completed output.

**🎯 Now Open Source & Ready for Production Deployment**

## ⚡ Quick Start (2 Minutes)

```bash
git clone https://github.com/EmanMiller/MissionControl.git
cd MissionControl
npm install
cd server && npm install && cd ..
npm run dev
```

**That's it!** Mission Control opens with **local authentication** - no OAuth setup required for development.

## 🎉 What's New in v1.0 (Production Release)

- ✅ **Zero-Friction Local Development** - `npm run dev` just works, no OAuth needed
- ✅ **Simplified Kanban Board** - Clean 3-column workflow (New → In Progress → Completed)
- ✅ **One-Command Mobile Setup** - `npm run dev:mobile` creates public tunnels for iPhone testing  
- ✅ **Enhanced Task Flow** - Automatic progression with real-time notifications
- ✅ **Console Error Free** - Zero browser console errors for professional UX
- ✅ **URL Validation** - Robust OpenClaw endpoint validation with helpful error messages
- ✅ **Mobile Optimized** - Perfect responsive design across all device types
- ✅ **Production Hardened** - Security enhancements, error handling, and performance optimizations

## ✨ Features

- **🔐 Dual Authentication** - Local mode for development, OAuth for production
- **🤖 OpenClaw Integration** - Direct connection to your OpenClaw instance with enhanced validation
- **📋 Streamlined Task Management** - Clean 3-column Kanban: New → In Progress → Completed
- **📊 Real-time Dashboard** - Monitor system status and task progress with toast notifications
- **🎯 Dynamic Team Visualization** - 3D voxel office showing you + your AI agents
- **📱 Mobile Responsive** - Works perfectly on desktop, tablet, and mobile devices
- **🔄 Automated Task Flow** - Tasks automatically progress through pipeline with AI processing
- **⚡ Enhanced UX** - Time estimates, visual feedback, and production-ready error handling
- **🛡️ Security Hardened** - JWT authentication, input validation, and secure OAuth flows

## 📱 Mobile Development Setup

**For testing on your iPhone/mobile device:**

Since Google OAuth requires a public domain (not localhost or IP addresses), we provide automatic tunneling:

```bash
# One-command mobile setup with automatic localtunnel
npm run dev:mobile
```

This will:
- ✅ Start backend and frontend servers
- ✅ Create public tunnels for both services
- ✅ Update environment configuration automatically
- ✅ Display the mobile-ready URLs

**Then configure Google Cloud Console with the displayed URLs:**
- Authorized JavaScript origins: `https://xxxx.loca.lt`
- Authorized redirect URIs: `https://xxxx.loca.lt/auth/google/callback`

Open the mobile URL on your iPhone to test Mission Control on the go!

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

### 2. Start Development

```bash
# Local development (no OAuth required)
npm run dev
```

Mission Control will open at `http://localhost:5173` with local authentication enabled.

### 3. Configure OpenClaw

1. Sign in using "Local Mode" button
2. Go to Settings (gear icon)
3. Add your OpenClaw endpoint (e.g., `http://localhost:18789`)
4. Test the connection
5. Start creating tasks!

## 🔐 Authentication Modes

### Local Development (Default)
- **Zero setup** - works immediately
- **Local user account** - data persists in SQLite
- **All features enabled** - full functionality without OAuth

### Production OAuth
For production deployment, configure OAuth providers:

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Client ID
3. Add your domain to authorized origins
4. Set `VITE_AUTH_MODE=oauth` in `.env.local`

**GitHub OAuth:**
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL to your domain
4. Add credentials to `server/.env`

**Apple Sign In:**
1. Configure at [Apple Developer Console](https://developer.apple.com)
2. Add Service ID and credentials

## 🔧 Environment Configuration

### Frontend (.env.local)
```bash
# Authentication mode
VITE_AUTH_MODE=local          # 'local' or 'oauth'
VITE_API_URL=http://localhost:3001/api

# OAuth credentials (for production)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id  
VITE_APPLE_CLIENT_ID=your_apple_client_id
```

### Backend (server/.env)
```bash
# Authentication
AUTH_MODE=local               # 'local' or 'oauth'
ALLOW_DEMO_AUTH=1            # Enable local development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key

# OAuth secrets (for production)
GITHUB_CLIENT_SECRET=your_github_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

## 🌐 Production Deployment

### Railway + Vercel (Recommended)

**Backend (Railway):**
1. Connect your GitHub repository
2. Set environment variables for OAuth
3. Deploy automatically on push

**Frontend (Vercel):**
1. Connect your GitHub repository  
2. Set build command: `npm run build`
3. Set environment variables
4. Deploy automatically on push

### Environment Variables (Production)
```bash
# Frontend
VITE_AUTH_MODE=oauth
VITE_API_URL=https://your-api-domain.com/api
VITE_GOOGLE_CLIENT_ID=your_production_google_id

# Backend  
AUTH_MODE=oauth
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
GITHUB_CLIENT_SECRET=your_production_github_secret
```

## 🤖 OpenClaw Integration

### Connecting Your OpenClaw Instance

1. **Sign in** to Mission Control  
2. **Go to Settings** (gear icon in sidebar)
3. **Configure OpenClaw:**
   - **Endpoint:** Your OpenClaw URL (e.g., `http://localhost:18789`)
   - **Token:** Optional authentication token
4. **Test Connection** - Verify Mission Control can reach OpenClaw
5. **Save Configuration**

### How It Works

1. **Create Task** - Add a new task with title and description
2. **Start Processing** - Task automatically moves to "In Progress"
3. **OpenClaw Processing** - OpenClaw receives and processes the task
4. **Status Updates** - Mission Control polls for completion
5. **View Results** - Completed tasks show results and deliverables

### Webhook Support (Optional)

For faster updates, configure OpenClaw to send webhooks to:
```
POST https://your-api-domain.com/api/openclaw/webhook
```

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS with dark theme
- **Authentication:** Dual mode (local + OAuth)
- **Icons:** Lucide React
- **3D Graphics:** Three.js for team visualization

### Backend (Node.js + Express)
- **Framework:** Express.js with ES modules
- **Database:** SQLite (development) / PostgreSQL (production)
- **Authentication:** JWT tokens with dual auth support
- **OpenClaw Integration:** HTTP API with polling and webhooks
- **Security:** Helmet, CORS, rate limiting

### Database Schema
- **users** - User profiles and OpenClaw configuration
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
- `POST /api/auth/demo` - Local development login

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

## 🔍 Troubleshooting

### Common Issues

**"Local Mode" button not appearing:**
- Check that `ALLOW_DEMO_AUTH=1` in `server/.env`
- Restart the backend server

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

**Mobile Testing Issues:**
- Use `npm run dev:mobile` for tunnel setup
- Update Google Cloud Console with tunnel URLs
- Tunnel URLs expire after ~30 minutes

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Test with `npm run dev` (local mode)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`) 
6. Open Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository:** https://github.com/EmanMiller/MissionControl
- **OpenClaw:** https://openclaw.ai
- **Issues:** https://github.com/EmanMiller/MissionControl/issues
- **Discussions:** https://github.com/EmanMiller/MissionControl/discussions

---

**🚀 Ready to automate your workflow with AI agents? Start with `npm run dev` and create your first task!**