/**
 * Prometheus Metrics Middleware for Mission Control
 */

const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ 
    register,
    prefix: 'mission_control_'
});

// Custom metrics
const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register]
});

const activeConnections = new promClient.Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
    registers: [register]
});

const taskMetrics = {
    total: new promClient.Gauge({
        name: 'tasks_total',
        help: 'Total number of tasks',
        labelNames: ['status'],
        registers: [register]
    }),
    
    created: new promClient.Counter({
        name: 'tasks_created_total',
        help: 'Total number of tasks created',
        registers: [register]
    }),
    
    completed: new promClient.Counter({
        name: 'tasks_completed_total',
        help: 'Total number of tasks completed',
        registers: [register]
    })
};

const userMetrics = {
    total: new promClient.Gauge({
        name: 'users_total',
        help: 'Total number of registered users',
        registers: [register]
    }),
    
    active: new promClient.Gauge({
        name: 'users_active',
        help: 'Number of active users in last 24h',
        registers: [register]
    })
};

// Middleware to track HTTP requests
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();
    
    // Track active connections
    activeConnections.inc();
    
    // Override res.end to capture metrics
    const originalEnd = res.end;
    res.end = function(...args) {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path || 'unknown';
        
        // Record metrics
        httpRequestsTotal
            .labels(req.method, route, res.statusCode.toString())
            .inc();
            
        httpRequestDuration
            .labels(req.method, route, res.statusCode.toString())
            .observe(duration);
        
        // Decrease active connections
        activeConnections.dec();
        
        originalEnd.apply(this, args);
    };
    
    next();
};

// Function to update task metrics
const updateTaskMetrics = async (database) => {
    try {
        // Update task counts by status
        const taskCounts = await database.all(`
            SELECT status, COUNT(*) as count 
            FROM tasks 
            GROUP BY status
        `);
        
        for (const { status, count } of taskCounts) {
            taskMetrics.total.labels(status).set(count);
        }
        
        // Update user metrics
        const totalUsers = await database.get(`SELECT COUNT(*) as count FROM users`);
        userMetrics.total.set(totalUsers.count);
        
        // Active users (last 24h)
        const activeUsers = await database.get(`
            SELECT COUNT(DISTINCT user_id) as count 
            FROM tasks 
            WHERE created_at > datetime('now', '-1 day')
        `);
        userMetrics.active.set(activeUsers.count);
        
    } catch (error) {
        console.error('Error updating metrics:', error);
    }
};

// Metrics endpoint
const metricsEndpoint = async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (error) {
        console.error('Error generating metrics:', error);
        res.status(500).end('Error generating metrics');
    }
};

module.exports = {
    metricsMiddleware,
    metricsEndpoint,
    updateTaskMetrics,
    taskMetrics,
    userMetrics,
    register
};
