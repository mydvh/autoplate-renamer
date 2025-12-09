#!/bin/bash

# Database Backup Script for PostgreSQL in Docker

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="autoplate-postgres"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

echo "Starting database backup..."

# Backup database
docker exec $CONTAINER_NAME pg_dump \
  -U autoplate_user \
  -d autoplate_renamer \
  -F c \
  -f /tmp/backup_$TIMESTAMP.dump

# Copy backup from container to host
docker cp $CONTAINER_NAME:/tmp/backup_$TIMESTAMP.dump $BACKUP_DIR/

# Remove backup from container
docker exec $CONTAINER_NAME rm /tmp/backup_$TIMESTAMP.dump

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.dump" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.dump"

# Optional: Compress backup
gzip $BACKUP_DIR/backup_$TIMESTAMP.dump

echo "Backup compressed: $BACKUP_DIR/backup_$TIMESTAMP.dump.gz"
