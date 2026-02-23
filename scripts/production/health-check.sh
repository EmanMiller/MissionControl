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
