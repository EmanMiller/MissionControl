import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Generate secure OAuth state parameter
function generateOAuthState(provider) {
  const state = crypto.randomBytes(32).toString('hex');
  
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO oauth_states (state, provider) VALUES (?, ?)', 
      [state, provider], (err) => {
        if (err) reject(err);
        else resolve(state);
      });
  });
}

// Verify OAuth state parameter
function verifyOAuthState(state, provider) {
  return new Promise((resolve, reject) => {
    db.get('SELECT state FROM oauth_states WHERE state = ? AND provider = ? AND datetime(created_at, "+10 minutes") > datetime("now")', 
      [state, provider], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('Invalid or expired state parameter'));
        } else {
          // Clean up used state
          db.run('DELETE FROM oauth_states WHERE state = ?', [state]);
          resolve(true);
        }
      });
  });
}

// Create or update user
function upsertUser(userData) {
  return new Promise((resolve, reject) => {
    const { email, name, avatar_url, provider, provider_id } = userData;
    
    // Check if user exists
    db.get('SELECT id FROM users WHERE email = ? OR (provider = ? AND provider_id = ?)', 
      [email, provider, provider_id], (err, existingUser) => {
        if (err) {
          reject(err);
          return;
        }

        if (existingUser) {
          // Update existing user
          db.run(`UPDATE users SET 
                   name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP 
                   WHERE id = ?`,
            [name, avatar_url, existingUser.id], function(err) {
              if (err) reject(err);
              else resolve(existingUser.id);
            });
        } else {
          // Create new user
          db.run(`INSERT INTO users 
                   (email, name, avatar_url, provider, provider_id) 
                   VALUES (?, ?, ?, ?, ?)`,
            [email, name, avatar_url, provider, provider_id], function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            });
        }
      });
  });
}

// GitHub OAuth
router.get('/github', async (req, res) => {
  try {
    if (!process.env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID === 'your_github_oauth_app_client_id') {
      return res.status(400).json({ 
        error: 'GitHub OAuth not configured', 
        details: 'GitHub OAuth app not set up. Create a GitHub OAuth app and add GITHUB_CLIENT_ID to server/.env. See OAUTH_SETUP.md for instructions.' 
      });
    }

    if (!process.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET === 'your_github_oauth_app_client_secret') {
      return res.status(400).json({ 
        error: 'GitHub OAuth not configured', 
        details: 'GITHUB_CLIENT_SECRET missing in server/.env. See OAUTH_SETUP.md for setup instructions.' 
      });
    }

    const state = await generateOAuthState('github');
    const scope = 'user:email';
    const redirectUri = process.env.GITHUB_REDIRECT_URI || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/github/callback`;
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=${scope}&state=${state}&redirect_uri=${redirectUri}`;
    
    res.json({ authUrl });
  } catch (error) {
    console.error('GitHub OAuth initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate GitHub OAuth' });
  }
});

router.post('/github/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Code and state are required' });
    }

    // Verify state
    await verifyOAuthState(state, 'github');

    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }, {
      headers: { 'Accept': 'application/json' }
    });

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      return res.status(400).json({ error: 'Failed to get access token' });
    }

    // Get user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { 'Authorization': `token ${access_token}` }
    });

    // Get user email (might be private)
    const emailResponse = await axios.get('https://api.github.com/user/emails', {
      headers: { 'Authorization': `token ${access_token}` }
    });

    const primaryEmail = emailResponse.data.find(email => email.primary)?.email;
    const userData = userResponse.data;

    // Create or update user
    const userId = await upsertUser({
      email: primaryEmail || userData.email,
      name: userData.name || userData.login,
      avatar_url: userData.avatar_url,
      provider: 'github',
      provider_id: userData.id.toString()
    });

    // Generate JWT
    const token = generateToken(userId);

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        email: primaryEmail || userData.email,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url
      }
    });

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    res.status(500).json({ error: 'GitHub authentication failed' });
  }
});

// Google OAuth
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Verify Google JWT token
    const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const payload = response.data;

    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    // Create or update user
    const userId = await upsertUser({
      email: payload.email,
      name: payload.name,
      avatar_url: payload.picture,
      provider: 'google',
      provider_id: payload.sub
    });

    // Generate JWT
    const token = generateToken(userId);

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        email: payload.email,
        name: payload.name,
        avatar_url: payload.picture
      }
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Apple Sign In
router.post('/apple', async (req, res) => {
  try {
    const { id_token, user } = req.body;
    
    if (!id_token) {
      return res.status(400).json({ error: 'Apple ID token is required' });
    }

    // Decode JWT (in production, you should verify the signature)
    const payload = jwt.decode(id_token);
    
    if (!payload || payload.aud !== process.env.APPLE_CLIENT_ID) {
      return res.status(400).json({ error: 'Invalid Apple token' });
    }

    // For first-time sign-in, Apple provides user info
    const userName = user?.name ? `${user.name.firstName} ${user.name.lastName}` : payload.email?.split('@')[0] || 'User';

    // Create or update user
    const userId = await upsertUser({
      email: payload.email,
      name: userName,
      avatar_url: null, // Apple doesn't provide avatars
      provider: 'apple',
      provider_id: payload.sub
    });

    // Generate JWT
    const token = generateToken(userId);

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        email: payload.email,
        name: userName,
        avatar_url: null
      }
    });

  } catch (error) {
    console.error('Apple OAuth error:', error);
    res.status(500).json({ error: 'Apple authentication failed' });
  }
});

// Verify token endpoint
router.post('/verify', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mission-control-development-secret-key');
    
    db.get('SELECT id, email, name, avatar_url, openclaw_endpoint FROM users WHERE id = ?', 
      [decoded.userId], (err, user) => {
        if (err || !user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            openclaw_connected: !!user.openclaw_endpoint
          }
        });
      });
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

// Temporary demo mode for development testing
router.post('/demo', async (req, res) => {
  try {
    console.log('Demo authentication requested');
    
    // Create or find demo user
    const demoUserData = {
      email: 'demo@missioncontrol.dev',
      name: 'Demo User',
      avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Demo User',
      provider: 'demo',
      provider_id: 'demo-user-1'
    };

    const userId = await upsertUser(demoUserData);

    // Generate JWT
    const token = generateToken(userId);

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        email: demoUserData.email,
        name: demoUserData.name,
        avatar_url: demoUserData.avatar_url
      }
    });

  } catch (error) {
    console.error('Demo authentication error:', error);
    res.status(500).json({ error: 'Demo authentication failed' });
  }
});

// Logout endpoint (client-side mostly, but useful for cleanup)
router.post('/logout', (req, res) => {
  // In a more complex setup, you might want to blacklist the token
  // For now, client-side token removal is sufficient
  res.json({ success: true });
});

export default router;