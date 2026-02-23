# OAuth Setup Guide

Quick setup guide to get authentication working in Mission Control.

## Quick Development Setup

For **local testing only**, you can use these test credentials:

### 1. Google OAuth (Recommended - Easiest)

Create `.env.local` in the root directory:

```bash
# .env.local
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

**To get Google Client ID:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project (or select existing)
3. Enable "Google+ API" in APIs & Services
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Application type: "Web application"
6. Authorized origins: `http://localhost:5173`
7. Copy the Client ID

### 2. GitHub OAuth (Full Flow)

Add to `.env.local`:
```bash
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

Add to `server/.env`:
```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:5173
```

**To get GitHub credentials:**
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. "New OAuth App"
3. Application name: "Mission Control Local"
4. Homepage URL: `http://localhost:5173`
5. Authorization callback URL: `http://localhost:5173`
6. Copy Client ID and Client Secret

## Test Without OAuth (Development)

For quick testing without OAuth setup, you can add a bypass:

1. Temporarily modify `src/App.jsx`:

```javascript
// Add this to bypass auth for testing
useEffect(() => {
  // DEVELOPMENT ONLY - Remove for production
  if (process.env.NODE_ENV === 'development') {
    setUser({
      id: 1,
      email: 'demo@example.com',
      name: 'Demo User',
      avatar_url: null
    });
    return;
  }
  
  initializeAuth();
}, []);
```

2. This will skip authentication and go straight to the dashboard.

## Production Setup

For production deployment, follow the same steps but use your production domains:

- Google: Use your production domain in authorized origins
- GitHub: Use your production domain in callback URL
- Set proper environment variables on your hosting platform

## Troubleshooting

**"Google/Apple options not showing"**
- Check that `VITE_GOOGLE_CLIENT_ID` is set in `.env.local`
- Restart the dev server after adding env variables

**"GitHub 404 error"**  
- Verify `GITHUB_CLIENT_ID` is set in `server/.env`
- Check that the OAuth app is configured correctly
- Ensure callback URL matches exactly

**"Invalid client error"**
- Double-check client ID/secret values
- Verify authorized origins/redirect URIs are correct
- Make sure the OAuth app is not in development mode (for Google)

## Quick Test Command

After setup, test the system:

```bash
npm run test-system
```

This validates all endpoints are working correctly.