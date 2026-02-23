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
// Import routes
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import openclawRoutes from './routes/openclaw.js';

// Import middleware
import { authenticateToken } from './middleware/auth.js';

// Import database and services
import db from './database.js';
import './services/polling.js'; // Start polling service

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
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

// CORS: in development allow any localhost origin (e.g. 5173, 5174, 5176); in production use FRONTEND_URL
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin or non-browser
    if (process.env.NODE_ENV !== 'production') {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
    }
    if (origin === allowedOrigin) return cb(null, true);
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
app.use('/api/openclaw', authenticateToken, openclawRoutes);

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

app.listen(PORT, () => {
  console.log(`🚀 Mission Control Server running on port ${PORT}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});