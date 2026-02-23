import jwt from 'jsonwebtoken';
import db from '../database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mission-control-development-secret-key';
const JWT_EXPIRES_IN = '7d';

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Get user info
    db.get('SELECT id, email, name, avatar_url, openclaw_endpoint FROM users WHERE id = ?', 
      [decoded.userId], (err, user) => {
        if (err || !user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        req.user = user;
        next();
      });
  });
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err) {
      db.get('SELECT id, email, name, avatar_url, openclaw_endpoint FROM users WHERE id = ?', 
        [decoded.userId], (err, user) => {
          if (!err && user) {
            req.user = user;
          }
        });
    }
    next();
  });
}