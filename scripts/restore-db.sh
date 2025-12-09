#!/bin/bash

# Database Restore Script for PostgreSQL in Docker

CONTAINER_NAME="autoplate-postgres"
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore-db.sh <backup_file.dump.gz>"
    echo "Example: ./restore-db.sh backups/backup_20241209_120000.dump.gz"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will OVERWRITE the current database!"
echo "Backup file: $BACKUP_FILE"
read -p "Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled"
    exit 0
fi

# Decompress if gzipped
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "Decompressing backup..."
    gunzip -k $BACKUP_FILE
    BACKUP_FILE=${BACKUP_FILE%.gz}
fi

# Copy backup to container
echo "Copying backup to container..."
docker cp $BACKUP_FILE $CONTAINER_NAME:/tmp/restore.dump

# Drop and recreate database
echo "Recreating database..."
docker exec $CONTAINER_NAME psql -U autoplate_user -d postgres -c "DROP DATABASE IF EXISTS autoplate_renamer;"
docker exec $CONTAINER_NAME psql -U autoplate_user -d postgres -c "CREATE DATABASE autoplate_renamer OWNER autoplate_user;"

# Restore database
echo "Restoring database..."
docker exec $CONTAINER_NAME pg_restore \
  -U autoplate_user \
  -d autoplate_renamer \
  -c \
  /tmp/restore.dump

# Cleanup
docker exec $CONTAINER_NAME rm /tmp/restore.dump

echo "✓ Database restored successfully!"
echo "Please restart backend: docker-compose restart backend"
