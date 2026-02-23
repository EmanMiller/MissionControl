#!/bin/bash

# Mission Control Production Deployment Script
# Usage: ./scripts/production/deploy.sh [environment]
# Environment: staging|production (default: staging)

set -e  # Exit on any error

ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Configuration
if [ "$ENVIRONMENT" = "production" ]; then
    ENV_FILE=".env.production"
    COMPOSE_FILE="docker-compose.production.yml"
    DB_NAME="mission_control_production"
    log_info "🚀 Production deployment mode"
else
    ENV_FILE=".env.staging"
    COMPOSE_FILE="docker-compose.yml"
    DB_NAME="mission_control_staging"
    log_info "🧪 Staging deployment mode"
fi

# Pre-deployment checks
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
    fi
    
    # Check if environment file exists
    if [ ! -f "$PROJECT_ROOT/server/$ENV_FILE" ]; then
        log_error "Environment file not found: server/$ENV_FILE"
    fi
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        log_error "Not in Mission Control project root directory"
    fi
    
    log_success "Prerequisites check passed"
}

# Backup existing database
backup_database() {
    log_info "Creating database backup..."
    
    BACKUP_DIR="$PROJECT_ROOT/backups"
    BACKUP_FILE="$BACKUP_DIR/mission-control-backup-$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$BACKUP_DIR"
    
    # Try to backup existing database
    if docker-compose ps | grep -q postgres; then
        log_info "Backing up existing database to $BACKUP_FILE"
        docker-compose exec postgres pg_dump -U mission_control "$DB_NAME" > "$BACKUP_FILE"
        log_success "Database backup completed"
    else
        log_warning "No existing database found, skipping backup"
    fi
}

# Build application
build_application() {
    log_info "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Build frontend if it exists
    if [ -f "package.json" ]; then
        log_info "Building frontend..."
        npm ci
        npm run build 2>/dev/null || log_warning "Frontend build failed or no build script"
    fi
    
    # Build backend
    if [ -f "server/package.json" ]; then
        log_info "Installing backend dependencies..."
        cd server
        npm ci --only=production
        cd ..
    fi
    
    # Build Docker image
    log_info "Building Docker image..."
    docker-compose -f "$COMPOSE_FILE" build
    
    log_success "Application build completed"
}

# Database migration
run_migration() {
    log_info "Running database migration..."
    
    cd "$PROJECT_ROOT"
    
    # Start database service
    docker-compose -f "$COMPOSE_FILE" up -d postgres
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f "$COMPOSE_FILE" exec postgres pg_isready -U mission_control -d "$DB_NAME" >/dev/null 2>&1; then
            log_success "Database is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "Database failed to start within 60 seconds"
    fi
    
    # Run migration if SQLite data exists
    if [ -f "$PROJECT_ROOT/server/mission-control.db" ]; then
        log_info "Running SQLite to PostgreSQL migration..."
        export DATABASE_URL="postgresql://mission_control:secure_local_password@localhost:5432/$DB_NAME"
        export SQLITE_DB_PATH="$PROJECT_ROOT/server/mission-control.db"
        node "$PROJECT_ROOT/scripts/production/migrate-to-postgresql.js"
        log_success "Database migration completed"
    else
        log_warning "No SQLite database found, skipping migration"
    fi
}

# Deploy application
deploy_application() {
    log_info "Deploying application..."
    
    cd "$PROJECT_ROOT"
    
    # Stop existing containers
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans
    
    # Start all services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for application to be ready
    log_info "Waiting for application to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3001/health >/dev/null 2>&1; then
            log_success "Application is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "Application failed to start within 60 seconds"
    fi
    
    log_success "Application deployed successfully"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Check application health
    if ! curl -f http://localhost:3001/health >/dev/null 2>&1; then
        log_error "Application health check failed"
    fi
    
    # Check database connection
    if ! docker-compose exec app node -e "require('./server/database.js')" 2>/dev/null; then
        log_warning "Database connection test failed"
    fi
    
    # Check if all containers are running
    if ! docker-compose ps | grep -q "Up"; then
        log_warning "Some containers may not be running properly"
    fi
    
    log_success "Health checks completed"
}

# Main deployment flow
main() {
    log_info "🚀 Starting Mission Control deployment to $ENVIRONMENT"
    
    check_prerequisites
    backup_database
    build_application
    run_migration
    deploy_application
    run_health_checks
    
    log_success "🎉 Deployment completed successfully!"
    log_info "Application is running at: http://localhost:3001"
    log_info "API documentation: http://localhost:3001/api/docs (if enabled)"
    
    # Show service status
    echo ""
    log_info "Service status:"
    docker-compose ps
    
    echo ""
    log_info "To view logs: docker-compose logs -f"
    log_info "To stop services: docker-compose down"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        log_warning "🔒 Production deployment complete. Ensure:"
        log_warning "1. SSL certificates are properly configured"
        log_warning "2. Domain DNS is pointing to this server"
        log_warning "3. Firewall rules are configured"
        log_warning "4. Monitoring is set up"
    fi
}

# Handle script interruption
trap 'log_error "Deployment interrupted"' INT TERM

# Run main function
main "$@"