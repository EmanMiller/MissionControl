/**
 * Security Middleware for Mission Control Production
 * 
 * Implements comprehensive security measures including:
 * - Rate limiting
 * - CORS configuration
 * - Security headers (Helmet)
 * - Input validation
 * - Request sanitization
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const validator = require('validator');

// Rate limiting configuration
const createRateLimiter = (options = {}) => {
    const defaultOptions = {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        message: {
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            // Skip rate limiting for health checks
            return req.path === '/health' || req.path === '/api/health';
        },
        keyGenerator: (req) => {
            // Use X-Forwarded-For header if behind proxy, otherwise req.ip
            return req.get('X-Forwarded-For') || req.ip;
        }
    };
    
    return rateLimit({ ...defaultOptions, ...options });
};

// Stricter rate limiting for authentication endpoints
const authRateLimiter = createRateLimiter({
    windowMs: 900000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes
    message: {
        error: 'Too many authentication attempts from this IP, please try again later.',
        retryAfter: 900
    }
});

// API-specific rate limiting
const apiRateLimiter = createRateLimiter({
    windowMs: 60000, // 1 minute
    max: 30, // 30 requests per minute
    message: {
        error: 'API rate limit exceeded, please slow down.',
        retryAfter: 60
    }
});

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
        
        // In development, allow localhost origins
        if (process.env.NODE_ENV === 'development') {
            const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
            if (localhostPattern.test(origin)) {
                return callback(null, true);
            }
        }
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚨 Blocked CORS request from unauthorized origin: ${origin}`);
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400 // 24 hours
};

// Helmet configuration for security headers
const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-eval'"], // Allow eval for Three.js
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: [
                "'self'",
                "https://api.openclaw.ai",
                "wss://api.openclaw.ai",
                ...(process.env.OPENCLAW_DEFAULT_ENDPOINT ? [process.env.OPENCLAW_DEFAULT_ENDPOINT] : [])
            ],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    },
    hsts: {
        maxAge: parseInt(process.env.HSTS_MAX_AGE) || 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
};

// Input validation middleware
const validateInput = {
    // Validate email addresses
    email: (email) => {
        if (!email || typeof email !== 'string') return false;
        return validator.isEmail(email) && email.length <= 255;
    },
    
    // Validate task titles
    taskTitle: (title) => {
        if (!title || typeof title !== 'string') return false;
        return title.trim().length >= 1 && title.length <= 500;
    },
    
    // Validate task descriptions
    taskDescription: (description) => {
        if (!description) return true; // Optional field
        if (typeof description !== 'string') return false;
        return description.length <= 10000;
    },
    
    // Validate task status
    taskStatus: (status) => {
        const validStatuses = ['backlog', 'new', 'in_progress', 'built', 'failed'];
        return validStatuses.includes(status);
    },
    
    // Validate task priority
    taskPriority: (priority) => {
        const validPriorities = ['low', 'medium', 'high'];
        return validPriorities.includes(priority);
    },
    
    // Validate tags array
    tags: (tags) => {
        if (!tags) return true; // Optional field
        if (!Array.isArray(tags)) return false;
        if (tags.length > 20) return false; // Max 20 tags
        return tags.every(tag => 
            typeof tag === 'string' && 
            tag.trim().length > 0 && 
            tag.length <= 50
        );
    }
};

// Request sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Sanitize string inputs to prevent XSS
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return validator.escape(str).trim();
    };
    
    // Recursively sanitize object properties
    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = sanitizeString(obj[key]);
            } else if (typeof obj[key] === 'object') {
                sanitizeObject(obj[key]);
            }
        }
        return obj;
    };
    
    // Sanitize request body
    if (req.body) {
        req.body = sanitizeObject({ ...req.body });
    }
    
    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject({ ...req.query });
    }
    
    next();
};

// Request validation middleware for specific routes
const validateRequest = {
    createTask: (req, res, next) => {
        const { title, description, status, priority, tags } = req.body;
        const errors = [];
        
        if (!validateInput.taskTitle(title)) {
            errors.push('Title is required and must be 1-500 characters');
        }
        
        if (!validateInput.taskDescription(description)) {
            errors.push('Description must be less than 10,000 characters');
        }
        
        if (status && !validateInput.taskStatus(status)) {
            errors.push('Status must be one of: backlog, new, in_progress, built, failed');
        }
        
        if (priority && !validateInput.taskPriority(priority)) {
            errors.push('Priority must be one of: low, medium, high');
        }
        
        if (!validateInput.tags(tags)) {
            errors.push('Tags must be an array of strings, max 20 tags, each max 50 characters');
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }
        
        next();
    },
    
    updateTaskStatus: (req, res, next) => {
        const { status } = req.body;
        
        if (!validateInput.taskStatus(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be one of: backlog, new, in_progress, built, failed'
            });
        }
        
        next();
    }
};

// Security monitoring middleware
const securityLogger = (req, res, next) => {
    // Log suspicious activities
    const suspiciousPatterns = [
        /script[^>]*>.*?<\/script>/gi,
        /<iframe/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi
    ];
    
    const requestData = JSON.stringify({
        body: req.body,
        query: req.query,
        headers: req.headers
    });
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));
    
    if (isSuspicious) {
        console.warn('🚨 Suspicious request detected:', {
            ip: req.ip,
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            body: req.body,
            query: req.query
        });
    }
    
    next();
};

// Error handler for security middleware
const securityErrorHandler = (err, req, res, next) => {
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            error: 'CORS policy violation',
            message: 'Origin not allowed'
        });
    }
    
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            error: 'Request too large',
            message: 'Request body exceeds size limit'
        });
    }
    
    next(err);
};

module.exports = {
    // Rate limiters
    generalRateLimit: createRateLimiter(),
    authRateLimit: authRateLimiter,
    apiRateLimit: apiRateLimiter,
    
    // Security middleware
    helmet: helmet(helmetConfig),
    cors: cors(corsOptions),
    sanitizeInput,
    securityLogger,
    securityErrorHandler,
    
    // Validation
    validateRequest,
    validateInput,
    
    // Utility functions
    createRateLimiter
};