#!/bin/bash
set -euo pipefail

# Qadam PostgreSQL backup script
# Runs daily via cron, keeps last 7 days

BACKUP_DIR="/home/ubuntu/backups/postgres"
DB_NAME="qadam_prod"
KEEP_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup of $DB_NAME..."

# Dump and compress
sudo -u postgres pg_dump "$DB_NAME" | gzip > "$BACKUP_FILE"

# Verify backup is non-empty (at least 1KB)
FILESIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE")
if [ "$FILESIZE" -lt 1024 ]; then
    echo "[$(date)] ERROR: Backup file too small ($FILESIZE bytes), likely empty"
    exit 1
fi

echo "[$(date)] Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Clean up old backups
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$KEEP_DAYS -delete
REMAINING=$(ls -1 "$BACKUP_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null | wc -l)
echo "[$(date)] Cleanup done. $REMAINING backups retained."
