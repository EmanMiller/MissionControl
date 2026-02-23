#!/usr/bin/env node

/**
 * Mission Control Load Testing Script
 * 
 * Tests the application under various load conditions to ensure
 * it can handle production traffic.
 * 
 * Usage:
 *   node scripts/production/load-test.js [options]
 * 
 * Options:
 *   --url <url>        Base URL to test (default: http://localhost:3001)
 *   --concurrent <n>   Number of concurrent users (default: 10)
 *   --duration <s>     Test duration in seconds (default: 60)
 *   --verbose          Enable verbose logging
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

class LoadTester {
    constructor(options = {}) {
        this.baseURL = options.url || 'http://localhost:3001';
        this.concurrent = options.concurrent || 10;
        this.duration = options.duration || 60;
        this.verbose = options.verbose || false;
        
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: [],
            errors: {},
            startTime: null,
            endTime: null
        };
        
        this.users = [];
        this.isRunning = false;
    }
    
    log(message, isVerbose = false) {
        if (!isVerbose || this.verbose) {
            console.log(`[${new Date().toISOString()}] ${message}`);
        }
    }
    
    logStats() {
        const duration = (this.stats.endTime - this.stats.startTime) / 1000;
        const requestsPerSecond = this.stats.totalRequests / duration;
        const avgResponseTime = this.stats.responseTimes.length > 0 
            ? this.stats.responseTimes.reduce((a, b) => a + b) / this.stats.responseTimes.length 
            : 0;
        const p95ResponseTime = this.calculatePercentile(this.stats.responseTimes, 95);
        const successRate = (this.stats.successfulRequests / this.stats.totalRequests) * 100;
        
        console.log('\n📊 Load Test Results');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`⏱️  Duration: ${duration.toFixed(1)}s`);
        console.log(`👥 Concurrent Users: ${this.concurrent}`);
        console.log(`📈 Total Requests: ${this.stats.totalRequests}`);
        console.log(`✅ Successful: ${this.stats.successfulRequests} (${successRate.toFixed(1)}%)`);
        console.log(`❌ Failed: ${this.stats.failedRequests}`);
        console.log(`🚀 Requests/sec: ${requestsPerSecond.toFixed(1)}`);
        console.log(`⚡ Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
        console.log(`📊 95th Percentile: ${p95ResponseTime.toFixed(0)}ms`);
        
        if (Object.keys(this.stats.errors).length > 0) {
            console.log('\n❌ Errors:');
            for (const [error, count] of Object.entries(this.stats.errors)) {
                console.log(`   ${error}: ${count}`);
            }
        }
        
        // Performance assessment
        console.log('\n🎯 Performance Assessment:');
        if (successRate >= 99.9) {
            console.log('✅ Excellent reliability');
        } else if (successRate >= 99) {
            console.log('⚠️  Good reliability, monitor for improvements');
        } else {
            console.log('❌ Poor reliability, needs investigation');
        }
        
        if (avgResponseTime <= 200) {
            console.log('✅ Excellent response time');
        } else if (avgResponseTime <= 500) {
            console.log('⚠️  Good response time');
        } else {
            console.log('❌ Slow response time, optimization needed');
        }
        
        if (requestsPerSecond >= 100) {
            console.log('✅ Excellent throughput');
        } else if (requestsPerSecond >= 50) {
            console.log('⚠️  Good throughput');
        } else {
            console.log('❌ Low throughput, scaling needed');
        }
    }
    
    calculatePercentile(values, percentile) {
        if (values.length === 0) return 0;
        
        const sorted = values.slice().sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }
    
    async makeRequest(method, path, data = null, headers = {}) {
        const startTime = performance.now();
        
        try {
            const config = {
                method,
                url: `${this.baseURL}${path}`,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                timeout: 30000, // 30 second timeout
                ...(data && { data })
            };
            
            const response = await axios(config);
            const responseTime = performance.now() - startTime;
            
            this.stats.totalRequests++;
            this.stats.successfulRequests++;
            this.stats.responseTimes.push(responseTime);
            
            this.log(`${method} ${path} - ${response.status} - ${responseTime.toFixed(0)}ms`, true);
            
            return { success: true, data: response.data, responseTime };
        } catch (error) {
            const responseTime = performance.now() - startTime;
            
            this.stats.totalRequests++;
            this.stats.failedRequests++;
            this.stats.responseTimes.push(responseTime);
            
            const errorKey = error.response 
                ? `HTTP ${error.response.status}` 
                : error.code || 'Unknown Error';
                
            this.stats.errors[errorKey] = (this.stats.errors[errorKey] || 0) + 1;
            
            this.log(`${method} ${path} - ERROR: ${errorKey} - ${responseTime.toFixed(0)}ms`, true);
            
            return { success: false, error: errorKey, responseTime };
        }
    }
    
    async authenticateUser() {
        const result = await this.makeRequest('POST', '/api/auth/demo');
        if (result.success && result.data.token) {
            return result.data.token;
        }
        throw new Error('Authentication failed');
    }
    
    async runUserSession(userId) {
        let token = null;
        
        try {
            // Authenticate
            token = await this.authenticateUser();
            const authHeaders = { 'Authorization': `Bearer ${token}` };
            
            while (this.isRunning) {
                // Simulate realistic user behavior
                const actions = [
                    // Get tasks (most common action)
                    () => this.makeRequest('GET', '/api/tasks', null, authHeaders),
                    
                    // Get dashboard stats
                    () => this.makeRequest('GET', '/api/users/dashboard', null, authHeaders),
                    
                    // Create a task (less common)
                    () => this.makeRequest('POST', '/api/tasks', {
                        title: `Load Test Task ${Date.now()}`,
                        description: `Generated by user ${userId}`,
                        priority: 'medium',
                        status: 'new',
                        tags: ['load-test', 'performance']
                    }, authHeaders),
                    
                    // Update task status (if we have tasks)
                    async () => {
                        const tasksResult = await this.makeRequest('GET', '/api/tasks', null, authHeaders);
                        if (tasksResult.success && tasksResult.data.tasks.length > 0) {
                            const randomTask = tasksResult.data.tasks[0];
                            const statuses = ['backlog', 'new', 'in_progress', 'built'];
                            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                            
                            return this.makeRequest('PUT', `/api/tasks/${randomTask.id}/status`, {
                                status: randomStatus
                            }, authHeaders);
                        }
                        return { success: true, data: null, responseTime: 0 };
                    },
                    
                    // Get user profile
                    () => this.makeRequest('GET', '/api/users/profile', null, authHeaders),
                ];
                
                // Choose random action with weighted probability
                const actionWeights = [0.5, 0.2, 0.1, 0.1, 0.1]; // Tasks most common
                const random = Math.random();
                let actionIndex = 0;
                let cumulativeWeight = 0;
                
                for (let i = 0; i < actionWeights.length; i++) {
                    cumulativeWeight += actionWeights[i];
                    if (random <= cumulativeWeight) {
                        actionIndex = i;
                        break;
                    }
                }
                
                await actions[actionIndex]();
                
                // Random delay between actions (100ms - 2s)
                const delay = 100 + Math.random() * 1900;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (error) {
            this.log(`User ${userId} session error: ${error.message}`);
        }
    }
    
    async run() {
        this.log(`🚀 Starting load test with ${this.concurrent} concurrent users for ${this.duration}s`);
        this.log(`📊 Target: ${this.baseURL}`);
        
        // Health check first
        try {
            await this.makeRequest('GET', '/health');
            this.log('✅ Initial health check passed');
        } catch (error) {
            this.log('❌ Initial health check failed - aborting test');
            return;
        }
        
        this.stats.startTime = performance.now();
        this.isRunning = true;
        
        // Start user sessions
        const userPromises = [];
        for (let i = 0; i < this.concurrent; i++) {
            userPromises.push(this.runUserSession(i + 1));
        }
        
        // Run for specified duration
        setTimeout(() => {
            this.isRunning = false;
            this.stats.endTime = performance.now();
        }, this.duration * 1000);
        
        // Progress reporting
        const progressInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(progressInterval);
                return;
            }
            
            const elapsed = (performance.now() - this.stats.startTime) / 1000;
            const remaining = this.duration - elapsed;
            const requestsPerSecond = this.stats.totalRequests / elapsed;
            
            this.log(`⏱️  ${remaining.toFixed(0)}s remaining, ${this.stats.totalRequests} requests, ${requestsPerSecond.toFixed(1)} req/s`);
        }, 10000); // Every 10 seconds
        
        // Wait for all user sessions to complete
        await Promise.all(userPromises);
        
        clearInterval(progressInterval);
        this.logStats();
        
        // Final health check
        try {
            await this.makeRequest('GET', '/health');
            this.log('✅ Final health check passed');
        } catch (error) {
            this.log('❌ Final health check failed - system may be overloaded');
        }
    }
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--url':
                options.url = args[++i];
                break;
            case '--concurrent':
                options.concurrent = parseInt(args[++i]);
                break;
            case '--duration':
                options.duration = parseInt(args[++i]);
                break;
            case '--verbose':
                options.verbose = true;
                break;
            case '--help':
                console.log(`
Mission Control Load Testing Script

Usage: node load-test.js [options]

Options:
  --url <url>        Base URL to test (default: http://localhost:3001)
  --concurrent <n>   Number of concurrent users (default: 10)
  --duration <s>     Test duration in seconds (default: 60)
  --verbose          Enable verbose logging
  --help             Show this help message

Examples:
  node load-test.js
  node load-test.js --concurrent 20 --duration 120
  node load-test.js --url https://api.missioncontrol.io --verbose
`);
                process.exit(0);
        }
    }
    
    return options;
}

// Run load test if called directly
if (require.main === module) {
    const options = parseArgs();
    const loadTester = new LoadTester(options);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n⚠️  Stopping load test...');
        loadTester.isRunning = false;
        setTimeout(() => process.exit(0), 2000);
    });
    
    loadTester.run().catch(error => {
        console.error('❌ Load test failed:', error.message);
        process.exit(1);
    });
}

module.exports = LoadTester;