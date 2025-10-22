#!/bin/bash

# SmartStore SaaS Database Backup Script
set -e

# Configuration
BACKUP_DIR="/backups"
DB_NAME="smartstore_prod"
DB_USER="smartstore"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/smartstore_backup_${TIMESTAMP}.sql"

echo "🔄 Starting database backup..."

# Create database backup
echo "Creating backup: $BACKUP_FILE"
pg_dump -h postgres -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress backup
echo "Compressing backup..."
gzip $BACKUP_FILE
BACKUP_FILE="${BACKUP_FILE}.gz"

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup created successfully: $BACKUP_FILE"
    echo "📊 Backup size: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Clean up old backups
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "smartstore_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup process completed successfully!"




