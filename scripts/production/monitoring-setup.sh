#!/bin/bash

# Mission Control Production Monitoring Setup
# Sets up comprehensive monitoring, logging, and alerting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

log_info "🔍 Setting up production monitoring for Mission Control"

# Create monitoring directory structure
mkdir -p monitoring/{prometheus,grafana,alertmanager,logs}
cd "$PROJECT_ROOT"

# 1. Prometheus Configuration
log_info "Setting up Prometheus monitoring..."

cat > monitoring/prometheus/prometheus.yml << 'EOF'
# Prometheus configuration for Mission Control
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Mission Control Application
  - job_name: 'mission-control-app'
    static_configs:
      - targets: ['app:3001']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # PostgreSQL Database
  - job_name: 'mission-control-db'
    static_configs:
      - targets: ['postgres_exporter:9187']
    scrape_interval: 30s

  # System Metrics (Node Exporter)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node_exporter:9100']
    scrape_interval: 30s

  # Nginx Metrics
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx_exporter:9113']
    scrape_interval: 30s

  # Application Health Checks
  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - http://app:3001/health
        - https://api.missioncontrol.io/health
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox_exporter:9115
EOF

# 2. Prometheus Alert Rules
cat > monitoring/prometheus/alert_rules.yml << 'EOF'
groups:
- name: mission_control_alerts
  rules:
  # Application Health
  - alert: ApplicationDown
    expr: up{job="mission-control-app"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Mission Control application is down"
      description: "Mission Control application has been down for more than 1 minute."

  # High Response Time
  - alert: HighResponseTime
    expr: http_request_duration_seconds{quantile="0.95"} > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }}s"

  # High Error Rate
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} errors per second"

  # Database Connection Issues
  - alert: DatabaseConnectionFailed
    expr: up{job="mission-control-db"} == 0
    for: 30s
    labels:
      severity: critical
    annotations:
      summary: "Database connection failed"
      description: "Cannot connect to PostgreSQL database"

  # High CPU Usage
  - alert: HighCpuUsage
    expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100) > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage detected"
      description: "CPU usage is {{ $value }}%"

  # High Memory Usage
  - alert: HighMemoryUsage
    expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"
      description: "Memory usage is {{ $value }}%"

  # Disk Space Low
  - alert: DiskSpaceLow
    expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 90
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Disk space critically low"
      description: "Disk usage is {{ $value }}%"

  # SSL Certificate Expiring
  - alert: SSLCertificateExpiring
    expr: probe_ssl_earliest_cert_expiry - time() < 86400 * 30
    for: 1h
    labels:
      severity: warning
    annotations:
      summary: "SSL certificate expiring soon"
      description: "SSL certificate expires in {{ $value }} seconds"
EOF

# 3. Grafana Configuration
log_info "Setting up Grafana dashboards..."

mkdir -p monitoring/grafana/{dashboards,provisioning/{dashboards,datasources}}

# Grafana data source configuration
cat > monitoring/grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

# Grafana dashboard provisioning
cat > monitoring/grafana/provisioning/dashboards/dashboards.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    editable: true
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

# 4. Application Metrics Middleware
log_info "Creating application metrics middleware..."

cat > server/middleware/metrics.js << 'EOF'
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
EOF

# 5. Alertmanager Configuration
log_info "Setting up Alertmanager..."

cat > monitoring/alertmanager/alertmanager.yml << 'EOF'
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@missioncontrol.io'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  slack_configs:
  - api_url: 'SLACK_WEBHOOK_URL_HERE'
    channel: '#alerts'
    title: 'Mission Control Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}: {{ .Annotations.description }}{{ end }}'
    
  email_configs:
  - to: 'admin@missioncontrol.io'
    subject: 'Mission Control Alert: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      Instance: {{ .Labels.instance }}
      Severity: {{ .Labels.severity }}
      {{ end }}

inhibit_rules:
- source_match:
    severity: 'critical'
  target_match:
    severity: 'warning'
  equal: ['alertname', 'dev', 'instance']
EOF

# 6. Docker Compose for Monitoring Stack
log_info "Creating monitoring Docker Compose..."

cat > docker-compose.monitoring.yml << 'EOF'
version: '3.8'

services:
  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.enable-lifecycle'
      - '--storage.tsdb.retention.time=30d'
    networks:
      - monitoring

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_DOMAIN=monitoring.missioncontrol.io
      - GF_SMTP_ENABLED=true
      - GF_SMTP_HOST=smtp.gmail.com:587
      - GF_SMTP_FROM_ADDRESS=alerts@missioncontrol.io
    networks:
      - monitoring

  # Alertmanager
  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager:/etc/alertmanager
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    networks:
      - monitoring

  # Node Exporter (System Metrics)
  node_exporter:
    image: prom/node-exporter:latest
    container_name: node_exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring

  # PostgreSQL Exporter
  postgres_exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres_exporter
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://mission_control:password@postgres:5432/mission_control_production?sslmode=disable
    networks:
      - monitoring

  # Blackbox Exporter (External Monitoring)
  blackbox_exporter:
    image: prom/blackbox-exporter:latest
    container_name: blackbox_exporter
    ports:
      - "9115:9115"
    volumes:
      - ./monitoring/blackbox:/etc/blackbox_exporter
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:

networks:
  monitoring:
    driver: bridge
EOF

# 7. Health Check Script
log_info "Creating health check script..."

cat > scripts/production/health-check.sh << 'EOF'
#!/bin/bash

# Mission Control Health Check Script
# Runs comprehensive health checks and reports status

set -e

HEALTH_URL="${HEALTH_URL:-https://api.missioncontrol.io}"
TIMEOUT=10

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Health check function
check_endpoint() {
    local endpoint="$1"
    local expected_status="${2:-200}"
    
    response=$(curl -s -w "%{http_code}" --max-time $TIMEOUT "$HEALTH_URL$endpoint" || echo "000")
    status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        log_success "$endpoint - Status: $status_code"
        return 0
    else
        log_error "$endpoint - Status: $status_code"
        return 1
    fi
}

# Database health check
check_database() {
    if check_endpoint "/api/health/database"; then
        log_success "Database connection healthy"
        return 0
    else
        log_error "Database connection failed"
        return 1
    fi
}

# Performance check
check_performance() {
    start_time=$(date +%s%N)
    if check_endpoint "/health"; then
        end_time=$(date +%s%N)
        response_time=$(( (end_time - start_time) / 1000000 ))
        
        if [ $response_time -lt 500 ]; then
            log_success "Response time: ${response_time}ms"
            return 0
        elif [ $response_time -lt 1000 ]; then
            log_warning "Response time: ${response_time}ms (slow)"
            return 0
        else
            log_error "Response time: ${response_time}ms (too slow)"
            return 1
        fi
    else
        return 1
    fi
}

echo "🔍 Running Mission Control health checks..."
echo "Target: $HEALTH_URL"
echo ""

failed_checks=0

# Run checks
check_endpoint "/health" || ((failed_checks++))
check_endpoint "/api/health" || ((failed_checks++))
check_database || ((failed_checks++))
check_performance || ((failed_checks++))

# SSL check
if [[ "$HEALTH_URL" == https* ]]; then
    ssl_expiry=$(echo | openssl s_client -servername $(echo "$HEALTH_URL" | cut -d'/' -f3) -connect $(echo "$HEALTH_URL" | cut -d'/' -f3):443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d'=' -f2)
    ssl_expiry_epoch=$(date -d "$ssl_expiry" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$ssl_expiry" +%s)
    current_epoch=$(date +%s)
    days_until_expiry=$(( (ssl_expiry_epoch - current_epoch) / 86400 ))
    
    if [ $days_until_expiry -gt 30 ]; then
        log_success "SSL certificate valid for $days_until_expiry days"
    elif [ $days_until_expiry -gt 7 ]; then
        log_warning "SSL certificate expires in $days_until_expiry days"
    else
        log_error "SSL certificate expires in $days_until_expiry days"
        ((failed_checks++))
    fi
fi

echo ""
if [ $failed_checks -eq 0 ]; then
    log_success "All health checks passed! 🎉"
    exit 0
else
    log_error "$failed_checks health check(s) failed"
    exit 1
fi
EOF

chmod +x scripts/production/health-check.sh

# 8. Log Rotation Configuration
log_info "Setting up log rotation..."

mkdir -p monitoring/logs

cat > monitoring/logs/logrotate.conf << 'EOF'
# Mission Control Log Rotation Configuration

/var/log/mission-control/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        systemctl reload nginx
        docker-compose -f /opt/mission-control/docker-compose.yml restart app
    endscript
}

/var/log/mission-control/access.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
}
EOF

# 9. Backup Script
log_info "Creating backup script..."

cat > scripts/production/backup.sh << 'EOF'
#!/bin/bash

# Mission Control Backup Script
# Creates database and configuration backups

set -e

BACKUP_DIR="${BACKUP_DIR:-/opt/backups/mission-control}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATABASE_URL="${DATABASE_URL:-postgresql://user:pass@localhost:5432/mission_control_production}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mission-control-backup-$TIMESTAMP"

echo "🗄️  Creating Mission Control backup..."

# Database backup
echo "📊 Backing up database..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE.sql"
gzip "$BACKUP_FILE.sql"

# Configuration backup
echo "⚙️  Backing up configuration..."
tar -czf "$BACKUP_FILE-config.tar.gz" \
    .env.production \
    docker-compose.yml \
    nginx/ \
    monitoring/ \
    scripts/

# File size and verification
echo "✅ Backup completed:"
echo "   Database: $(ls -lh $BACKUP_FILE.sql.gz | awk '{print $5}')"
echo "   Config: $(ls -lh $BACKUP_FILE-config.tar.gz | awk '{print $5}')"

# Cleanup old backups
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "mission-control-backup-*" -mtime +$RETENTION_DAYS -delete

echo "🎉 Backup completed successfully!"
EOF

chmod +x scripts/production/backup.sh

log_success "✅ Production monitoring setup completed!"

echo ""
log_info "📋 Monitoring Stack Components:"
echo "   - Prometheus: Metrics collection"
echo "   - Grafana: Visualization dashboards" 
echo "   - Alertmanager: Alert routing"
echo "   - Node Exporter: System metrics"
echo "   - Blackbox Exporter: External monitoring"
echo ""
log_info "🚀 To start monitoring:"
echo "   docker-compose -f docker-compose.monitoring.yml up -d"
echo ""
log_info "📊 Access URLs:"
echo "   - Grafana: http://localhost:3000 (admin/admin)"
echo "   - Prometheus: http://localhost:9090"
echo "   - Alertmanager: http://localhost:9093"
echo ""
log_info "⚡ Next steps:"
echo "   1. Update Slack webhook URL in alertmanager.yml"
echo "   2. Configure email settings in grafana environment"
echo "   3. Set up production domains and SSL"
echo "   4. Import Grafana dashboards"
echo ""
log_success "🎯 Production monitoring is ready to deploy!"