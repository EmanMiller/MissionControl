import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables: .env first, then .env.development (overrides) so credentials in .env.development are used
dotenv.config({ path: join(__dirname, '.env') });
dotenv.config({ path: join(__dirname, '.env.development') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
// Import routes
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import openclawRoutes from './routes/openclaw.js';
import agentRoutes from './routes/agents.js';
import analyticsRoutes from './routes/analytics.js';
import projectRoutes from './routes/projects.js';

// Import middleware
import { authenticateToken } from './middleware/auth.js';

// Import database and services
import db from './database.js';
import './services/polling.js'; // Start polling service

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Export io instance for use in routes
export { io };

// Security middleware (crossOriginOpenerPolicy: false so Google Sign-In popup can postMessage)
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://api.github.com", "https://appleid.apple.com"]
    }
  }
}));

// CORS: FRONTEND_URL can be a single URL or comma-separated (e.g. for Tailscale + localhost)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
// Private LAN IPs (10.x, 172.16–31.x, 192.168.x) for same-network access (e.g. iPhone on WiFi)
const privateOrigin = /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/;
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (process.env.NODE_ENV !== 'production') {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
      if (privateOrigin.test(origin)) return cb(null, true);
      if (/^https?:\/\/[^/]+\.(ts\.net|tailscale\.net)(:\d+)?$/i.test(origin)) return cb(null, true);
    }
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/agents', authenticateToken, agentRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
// OpenClaw: webhook must be public (OpenClaw agent POSTs without JWT); other routes require auth
app.use('/api/openclaw', (req, res, next) => {
  if (req.path === '/webhook' && req.method === 'POST') return next();
  return authenticateToken(req, res, next);
}, openclawRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join user-specific room for agent updates
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`Socket ${socket.id} joined user room: user-${userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Broadcast functions for real-time updates
export function broadcastAgentUpdate(userId, agentData) {
  io.to(`user-${userId}`).emit('agent-updated', agentData);
}

export function broadcastTaskUpdate(userId, taskData) {
  io.to(`user-${userId}`).emit('task-updated', taskData);
}

server.listen(PORT, () => {
  console.log(`🚀 Mission Control Server running on port ${PORT}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔌 WebSocket server enabled`);
});