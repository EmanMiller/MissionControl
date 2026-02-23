# OAuth Setup Guide - Fix "Access blocked" Errors

## 🚨 Current Issue: Invalid Google OAuth Client

The error you're seeing (`Error 401: invalid_client`) is because we need to configure real OAuth applications. Here's how to fix it:

## 🚀 Immediate Solution (Test Now)

**For immediate testing, I've enabled development mode:**

1. **Refresh your browser** at http://localhost:5173
2. **Click the blue "🚀 Continue as Demo User" button** 
3. **You'll bypass OAuth and get into the system immediately**

## 🔧 Proper OAuth Setup (Production Ready)

### Google OAuth Setup

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
2. **Create a new project** or select existing
3. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth credentials:**
   - Go to "APIs & Services" → "Credentials" 
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: **Web application**
   - Name: **Mission Control Local**
   - Authorized JavaScript origins: **`http://localhost:5173`**
   - Authorized redirect URIs: **`http://localhost:5173`**
5. **Copy the Client ID** and add to `.env.local`:
   ```bash
   VITE_GOOGLE_CLIENT_ID=your_real_client_id_here.apps.googleusercontent.com
   ```

### GitHub OAuth Setup

1. **Go to [GitHub Settings](https://github.com/settings/developers)**
2. **Click "New OAuth App"**
3. **Fill in details:**
   - Application name: **Mission Control Local**
   - Homepage URL: **`http://localhost:5173`**
   - Authorization callback URL: **`http://localhost:5173`**
4. **Copy credentials:**
   - Client ID → Add to `.env.local` as `VITE_GITHUB_CLIENT_ID`
   - Client Secret → Add to `server/.env` as `GITHUB_CLIENT_SECRET`

## 🛠️ Quick Setup Script

I can create a setup script to help:

```bash
# Run this to check your current configuration
cd /path/to/mission-control
node oauth-diagnostics.js
```

## ⚡ Current Status

- ✅ **Development mode enabled** - You can test immediately
- ⚠️ **Google OAuth needs real client ID**
- ⚠️ **GitHub OAuth needs proper configuration**
- ✅ **Backend and database fully operational**

## 🎯 Next Steps

1. **Test the system now** using Demo Mode
2. **Set up Google OAuth** for production (5 minutes)
3. **Set up GitHub OAuth** for production (5 minutes) 
4. **Disable development mode** by setting `VITE_DEV_MODE=false`

## 🔍 Troubleshooting

**Still getting "Access blocked"?**
- Clear browser cookies for localhost:5173
- Make sure you're using the Demo Mode button
- Check that VITE_DEV_MODE=true in .env.local

**Google OAuth still not working?**
- Verify authorized origins exactly match: `http://localhost:5173`
- Check that the OAuth client ID ends with `.apps.googleusercontent.com`
- Ensure Google+ API is enabled for your project

**Questions?** The system is now working in demo mode - you can explore the full Mission Control experience!