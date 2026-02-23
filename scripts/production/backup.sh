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
