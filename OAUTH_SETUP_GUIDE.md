# 🔐 OAuth Setup Guide - Mission Control

This guide will walk you through setting up OAuth authentication for Google, GitHub, and Apple Sign In.

**⚠️ Demo mode has been removed. You must configure OAuth to use Mission Control.**

---

## 🟦 Google OAuth Setup

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/apis/credentials

### 2. Create a Project (if needed)
- Click "Select a project" dropdown
- Click "New Project" 
- Name it "Mission Control"

### 3. Enable Google+ API
- Go to "APIs & Services" > "Library"
- Search for "Google+ API" and enable it

### 4. Create OAuth 2.0 Client ID
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth client ID"
- Choose "Web application"
- Name: "Mission Control Web"

### 5. Configure URLs
**Authorized JavaScript origins:**
```
http://localhost:5173
https://yourdomain.com
```

**Authorized redirect URIs:**
```
http://localhost:5173
https://yourdomain.com
```

### 6. Get Credentials
Copy the Client ID and Client Secret to:
- **Frontend**: `VITE_GOOGLE_CLIENT_ID` in `.env.local`
- **Backend**: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `server/.env`

---

## 🐙 GitHub OAuth Setup

### 1. Go to GitHub Developer Settings
Visit: https://github.com/settings/developers

### 2. Create New OAuth App
- Click "New OAuth App"
- **Application name**: "Mission Control"
- **Homepage URL**: `http://localhost:5173`
- **Authorization callback URL**: `http://localhost:5173`

### 3. Generate Client Secret
- After creating, click "Generate a new client secret"

### 4. Copy Credentials
Copy the Client ID and Client Secret to:
- **Frontend**: `VITE_GITHUB_CLIENT_ID` in `.env.local`  
- **Backend**: `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `server/.env`

---

## 🍎 Apple Sign In Setup

### 1. Apple Developer Account Required
You need a paid Apple Developer account ($99/year)

### 2. Create App ID
- Go to https://developer.apple.com/account/resources/identifiers/
- Click "+" to create new identifier
- Choose "App IDs"
- Description: "Mission Control"
- Bundle ID: `com.yourcompany.missioncontrol`
- Enable "Sign In with Apple"

### 3. Create Services ID
- Create another identifier, choose "Services IDs"
- Description: "Mission Control Web"
- Identifier: `com.yourcompany.missioncontrol.web`
- Enable "Sign In with Apple"
- Configure:
  - **Primary App ID**: Select the App ID you just created
  - **Web Domain**: `localhost` (for development)
  - **Return URLs**: `http://localhost:5173`

### 4. Create Key
- Go to https://developer.apple.com/account/resources/authkeys/
- Click "+" to create new key
- Key Name: "Mission Control Sign In"
- Enable "Sign In with Apple"
- Download the key file (`.p8`)

### 5. Configure Backend
Update `server/.env`:
```
APPLE_CLIENT_ID=com.yourcompany.missioncontrol.web
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY_PATH=./apple_private_key.p8
```

Place the downloaded `.p8` file in the `server/` directory as `apple_private_key.p8`

---

## 🔧 Environment File Templates

### Frontend (.env.local)
```bash
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
VITE_APPLE_CLIENT_ID=com.yourcompany.missioncontrol.web
VITE_API_URL=http://localhost:3001/api
```

### Backend (server/.env)
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# GitHub OAuth  
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:5173/auth/github/callback

# Apple Sign In
APPLE_CLIENT_ID=com.yourcompany.missioncontrol.web
APPLE_TEAM_ID=your_apple_team_id_here
APPLE_KEY_ID=your_apple_key_id_here
APPLE_PRIVATE_KEY_PATH=./apple_private_key.p8
```

---

## 🚀 Production Configuration

### For Production Deployment:

1. **Update URLs**: Replace `localhost:5173` with your production domain
2. **HTTPS Required**: All OAuth providers require HTTPS in production
3. **Environment Variables**: Use secure environment variable management
4. **Key Security**: Keep OAuth secrets secure and never commit them to git

### Example Production URLs:
```
https://missioncontrol.yourdomain.com
```

---

## ✅ Testing OAuth

1. Start your servers:
   ```bash
   # Backend
   cd server && npm run dev
   
   # Frontend
   npm run dev
   ```

2. Visit http://localhost:5173

3. Try signing in with each OAuth provider

4. Check browser console and server logs for any errors

---

## 🐛 Troubleshooting

### Common Issues:

**"OAuth not configured" errors:**
- Make sure environment variables are set correctly
- Restart both frontend and backend servers after changing .env files

**"Redirect URI mismatch" errors:**
- Check that your configured redirect URIs exactly match what you're using
- Include both `http://localhost:5173` and `http://localhost:5173/` (with trailing slash)

**Apple Sign In "invalid_client" errors:**
- Make sure your Services ID is correctly configured
- Verify the .p8 key file is in the right location
- Check that Team ID and Key ID are correct

**CORS errors:**
- Check that `FRONTEND_URL` in backend .env matches your frontend URL
- Make sure backend is running on port 3001

---

## 📧 Support

If you run into issues:

1. Check the browser console for JavaScript errors
2. Check the backend server logs for API errors  
3. Verify all environment variables are set correctly
4. Make sure OAuth apps are configured with the correct redirect URLs

---

**🎯 Goal: Replace all placeholder OAuth credentials with real values to enable production-ready authentication.**