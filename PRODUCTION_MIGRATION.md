# Production Migration Plan
**Mission Control - SQLite to PostgreSQL Migration**

## Phase 1: Database Migration (Day 1-2)

### PostgreSQL Setup
```bash
# Recommended hosting providers (cost analysis):
# 1. DigitalOcean Managed PostgreSQL - $15-25/month (2GB RAM, 1vCPU)
# 2. AWS RDS PostgreSQL - $20-35/month (db.t3.micro)
# 3. Heroku PostgreSQL - $9-20/month (Hobby tier)
# 4. Railway PostgreSQL - $5-15/month (starter)

# Recommendation: DigitalOcean for balance of cost/features
```

### Migration Steps

#### 1. Create PostgreSQL Schema
```sql
-- Create production database
CREATE DATABASE mission_control_production;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    openclaw_endpoint TEXT,
    openclaw_token TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table  
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'backlog',
    priority VARCHAR(20) DEFAULT 'medium',
    tags JSONB,
    openclaw_session_id VARCHAR(255),
    result_url TEXT,
    result_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OAuth states table
CREATE TABLE oauth_states (
    state VARCHAR(255) PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_oauth_states_created ON oauth_states(created_at);
```

#### 2. Data Migration Script
```javascript
// server/scripts/migrate-to-postgresql.js
const sqlite3 = require('sqlite3');
const { Client } = require('pg');

async function migrateDatabase() {
    // Connect to SQLite (source)
    const sqliteDb = new sqlite3.Database('./mission-control.db');
    
    // Connect to PostgreSQL (destination)
    const pgClient = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await pgClient.connect();
    
    console.log('🔄 Starting migration...');
    
    // Migrate users
    await migrateTable('users', sqliteDb, pgClient);
    
    // Migrate tasks
    await migrateTable('tasks', sqliteDb, pgClient);
    
    // Migrate sessions (if any)
    await migrateTable('sessions', sqliteDb, pgClient);
    
    // Migrate oauth_states (if any)
    await migrateTable('oauth_states', sqliteDb, pgClient);
    
    console.log('✅ Migration complete!');
    
    await pgClient.end();
    sqliteDb.close();
}
```

## Phase 2: Environment Configuration (Day 2-3)

### Environment Files Structure
```
server/
├── .env.development     # Local development
├── .env.staging        # Staging environment  
├── .env.production     # Production secrets
└── .env.example        # Template
```

### Production Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/mission_control_production
DATABASE_SSL=true
DATABASE_POOL_SIZE=10

# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Authentication
JWT_SECRET=<SECURE_256_BIT_KEY>
JWT_EXPIRES_IN=7d
SESSION_SECRET=<SECURE_SESSION_KEY>

# OAuth (Production Keys)
GOOGLE_CLIENT_ID=<PRODUCTION_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<PRODUCTION_GOOGLE_CLIENT_SECRET>
GITHUB_CLIENT_ID=<PRODUCTION_GITHUB_CLIENT_ID>
GITHUB_CLIENT_SECRET=<PRODUCTION_GITHUB_CLIENT_SECRET>

# OpenClaw Integration
OPENCLAW_DEFAULT_ENDPOINT=https://api.openclaw.ai
OPENCLAW_WEBHOOK_SECRET=<WEBHOOK_SECRET>

# Security
ALLOWED_ORIGINS=https://missioncontrol.emmanuelmiller.com,https://app.missioncontrol.io
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=<SENTRY_DSN>  # Error monitoring
```

## Phase 3: Security Hardening (Day 4-5)

### Security Middleware Implementation
```javascript
// server/middleware/security.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// Rate limiting
const rateLimiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: {
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil(900000 / 1000)
    }
});

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

module.exports = {
    rateLimiter,
    helmet: helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https://api.openclaw.ai"]
            }
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }),
    cors: cors(corsOptions)
};
```

## Phase 4: Production Deployment (Day 5-6)

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3001

CMD ["node", "server.js"]
```

### Production Server Requirements
```yaml
# Recommended server specs:
# CPU: 2 vCPUs
# RAM: 4GB
# Storage: 50GB SSD
# Bandwidth: 1TB/month
# Estimated cost: $20-40/month

# Hosting options:
# 1. DigitalOcean Droplet - $24/month (2vCPU, 4GB)
# 2. AWS EC2 t3.medium - $30/month
# 3. Heroku Dyno Standard-2X - $50/month
# 4. Railway - $20/month

# Recommendation: DigitalOcean for cost/performance balance
```

## Phase 5: Load Testing & Monitoring (Day 7)

### Load Testing Script
```javascript
// scripts/load-test.js
const axios = require('axios');

async function loadTest() {
    const baseURL = process.env.TEST_URL || 'http://localhost:3001';
    const concurrent = 10;
    const iterations = 100;
    
    console.log(`🧪 Load testing ${baseURL} with ${concurrent} concurrent users`);
    
    // Test authentication
    await testEndpoint('POST', '/api/auth/demo', null, concurrent, iterations);
    
    // Test task retrieval
    await testEndpoint('GET', '/api/tasks', authHeaders, concurrent, iterations);
    
    // Test task creation
    await testEndpoint('POST', '/api/tasks', taskData, concurrent, iterations);
    
    console.log('✅ Load test complete');
}
```

### Monitoring Setup
```yaml
# Monitoring stack:
# - Application: PM2 for process management
# - Database: PostgreSQL built-in monitoring
# - Uptime: UptimeRobot (free tier)
# - Errors: Sentry (free tier)
# - Logs: Winston + log rotation
```

## Migration Timeline

### Day 1: Database Setup
- [ ] Choose PostgreSQL hosting provider
- [ ] Create production database instance
- [ ] Set up connection and test connectivity
- [ ] Create production schema

### Day 2: Data Migration
- [ ] Export current SQLite data
- [ ] Run migration script
- [ ] Validate data integrity
- [ ] Test application with new database

### Day 3: Environment Configuration
- [ ] Create production environment files
- [ ] Generate secure secrets and keys
- [ ] Configure OAuth providers for production
- [ ] Set up SSL certificates

### Day 4: Security Implementation
- [ ] Add security middleware
- [ ] Configure rate limiting
- [ ] Set up CORS policies
- [ ] Implement input validation

### Day 5: Deployment Preparation
- [ ] Set up production server
- [ ] Configure Docker deployment
- [ ] Set up CI/CD pipeline (optional)
- [ ] Configure domain and DNS

### Day 6: Production Deployment
- [ ] Deploy to production server
- [ ] Run smoke tests
- [ ] Configure monitoring
- [ ] Set up backups

### Day 7: Testing & Go-Live
- [ ] Load testing
- [ ] Performance optimization
- [ ] Final security audit
- [ ] Production launch! 🚀

## Rollback Plan

### Emergency Rollback Procedure
1. **Database**: Keep SQLite backup for 30 days
2. **Application**: Tag stable versions for quick revert
3. **DNS**: Maintain staging environment for instant failover
4. **Data**: Hourly PostgreSQL backups with point-in-time recovery

## Success Criteria

### Performance Targets
- [ ] Response time < 200ms for API endpoints
- [ ] Support 100+ concurrent users
- [ ] 99.9% uptime (8.77 hours downtime/year)
- [ ] Database queries < 50ms average

### Security Requirements
- [ ] All data encrypted in transit (TLS 1.3)
- [ ] Secure authentication with JWT
- [ ] Rate limiting prevents abuse
- [ ] Security headers properly configured

This migration plan ensures a smooth transition from development to production while maintaining security, performance, and reliability standards.