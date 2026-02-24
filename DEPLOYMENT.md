# Mission Control - Deployment Guide

## ✅ Production Ready Status

Mission Control v1.0 is production-ready with zero-friction local development and scalable OAuth for production.

## 🚀 Quick Deployment

### Local Development (Instant Setup)
```bash
git clone https://github.com/EmanMiller/MissionControl.git
cd MissionControl
npm install
cd server && npm install && cd ..
npm run dev
```
- Click **"Continue in Local Mode"** 
- No OAuth setup required
- Full functionality immediately

### Production Deployment

#### Option 1: Railway + Vercel (Recommended)

**Backend (Railway):**
1. Connect GitHub repo to Railway
2. Set environment variables:
   ```bash
   NODE_ENV=production
   PORT=3001
   AUTH_MODE=oauth
   JWT_SECRET=your-production-jwt-secret
   DATABASE_URL=postgresql://...
   GITHUB_CLIENT_SECRET=your-github-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   ```
3. Deploy automatically on push

**Frontend (Vercel):**
1. Connect GitHub repo to Vercel
2. Set build command: `npm run build`
3. Set environment variables:
   ```bash
   VITE_AUTH_MODE=oauth
   VITE_API_URL=https://your-railway-domain.com/api
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   VITE_GITHUB_CLIENT_ID=your-github-client-id
   ```
4. Deploy automatically on push

#### Option 2: Docker Deployment

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./
EXPOSE 3001
CMD ["node", "server.js"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔐 OAuth Setup (Production Only)

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Client ID
3. Add production domains to authorized origins
4. Add `GOOGLE_CLIENT_ID` to both frontend and backend env

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set homepage URL and callback URL to your domain
4. Add `GITHUB_CLIENT_ID` to frontend, `GITHUB_CLIENT_SECRET` to backend

## 🗄️ Database

### Development
- **SQLite** - Auto-created, zero setup
- Location: `server/mission-control.db`

### Production
- **PostgreSQL** recommended
- Railway provides managed PostgreSQL
- Update `DATABASE_URL` environment variable

## ⚡ Performance

### Frontend
- **Vite build**: Optimized for production
- **PWA enabled**: Service worker for offline capability
- **Code splitting**: Lazy loading for better performance

### Backend
- **Express.js**: Lightweight and fast
- **JWT tokens**: Stateless authentication
- **Rate limiting**: Built-in protection
- **CORS**: Properly configured

## 🔍 Monitoring

### Health Checks
- Backend: `GET /health`
- Frontend: Serves static assets

### Logs
- Production logs to stdout/stderr
- Use Railway/Vercel logging dashboards

## 🧪 Testing

```bash
# Full system test
npm run test-system

# Build verification
npm run build

# Local auth test
curl -X POST http://localhost:3001/api/auth/demo
```

## 🚨 Troubleshooting

### Common Issues

**Port conflicts:**
- Backend defaults to 3001
- Frontend defaults to 5173
- Change `PORT` env var if needed

**Database errors:**
- Check file permissions in server directory
- Delete `mission-control.db` to reset

**OAuth errors:**
- Verify client IDs match environment
- Check authorized domains in OAuth console

## 📊 Architecture Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│   Backend   │───▶│   Database  │
│  React+Vite │    │ Express.js  │    │ SQLite/PG   │
│             │    │             │    │             │
│ - Auth UI   │    │ - JWT Auth  │    │ - Users     │
│ - Kanban    │    │ - Tasks API │    │ - Tasks     │
│ - 3D Office │    │ - OpenClaw  │    │ - Sessions  │
└─────────────┘    └─────────────┘    └─────────────┘
```

## ✅ Deployment Checklist

- [ ] Environment variables set
- [ ] OAuth credentials configured
- [ ] Database connection tested
- [ ] Build process verified
- [ ] Health endpoints responding
- [ ] HTTPS certificate configured
- [ ] Domain DNS configured
- [ ] Monitoring set up

## 🔗 Resources

- **Repository**: https://github.com/EmanMiller/MissionControl
- **Railway**: https://railway.app
- **Vercel**: https://vercel.com
- **Google Cloud Console**: https://console.cloud.google.com
- **GitHub Developer Settings**: https://github.com/settings/developers

---

**Status: ✅ PRODUCTION READY**