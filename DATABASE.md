# PostgreSQL Database - Docker Deployment

## 📊 Database Configuration

- **Image**: PostgreSQL 15 Alpine
- **Container**: autoplate-postgres
- **Network**: Docker internal (autoplate-network)
- **Storage**: Named volume `postgres_data`
- **Port**: 5432 (internal only, not exposed to host)

## 🔧 Connection Details

**From Backend Container:**
```
Host: postgres
Port: 5432
Database: autoplate_renamer
User: autoplate_user
Password: (from .env)
```

**From Host (for admin tools):**
Not directly accessible. Use docker exec or expose port temporarily.

## 🚀 Usage

### Start Database
```bash
docker-compose up -d postgres
```

### Check Status
```bash
docker-compose ps postgres
docker-compose logs -f postgres
```

### Access PostgreSQL CLI
```bash
# Connect as autoplate_user
docker-compose exec postgres psql -U autoplate_user -d autoplate_renamer

# Connect as postgres superuser
docker-compose exec postgres psql -U postgres
```

### Common SQL Commands
```sql
-- List databases
\l

-- List tables
\dt

-- Describe table
\d users

-- Show table data
SELECT * FROM users;

-- Check migrations
SELECT * FROM migrations;

-- Quit
\q
```

## 💾 Backup & Restore

### Backup Database
```bash
# Using script
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh

# Manual backup
docker-compose exec postgres pg_dump -U autoplate_user -d autoplate_renamer > backup.sql

# Custom format backup (recommended)
docker-compose exec postgres pg_dump -U autoplate_user -d autoplate_renamer -F c > backup.dump
```

### Restore Database
```bash
# Using script
chmod +x scripts/restore-db.sh
./scripts/restore-db.sh backups/backup_20241209.dump.gz

# Manual restore from SQL
docker-compose exec -T postgres psql -U autoplate_user -d autoplate_renamer < backup.sql

# From custom format
docker-compose exec -T postgres pg_restore -U autoplate_user -d autoplate_renamer backup.dump
```

### Automated Backups (Cron)
```bash
# Add to crontab
crontab -e

# Backup daily at 2 AM
0 2 * * * /path/to/autoplate-renamer/scripts/backup-db.sh
```

## 🔍 Monitoring

### Check Database Size
```bash
docker-compose exec postgres psql -U autoplate_user -d autoplate_renamer -c "
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database;"
```

### Check Table Sizes
```bash
docker-compose exec postgres psql -U autoplate_user -d autoplate_renamer -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Check Active Connections
```bash
docker-compose exec postgres psql -U autoplate_user -d autoplate_renamer -c "
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query
FROM pg_stat_activity
WHERE datname = 'autoplate_renamer';"
```

## 🛠 Maintenance

### Vacuum Database
```bash
docker-compose exec postgres psql -U autoplate_user -d autoplate_renamer -c "VACUUM ANALYZE;"
```

### Reindex Database
```bash
docker-compose exec postgres psql -U autoplate_user -d autoplate_renamer -c "REINDEX DATABASE autoplate_renamer;"
```

### Update Statistics
```bash
docker-compose exec postgres psql -U autoplate_user -d autoplate_renamer -c "ANALYZE;"
```

## 🔐 Security

### Change Password
```bash
docker-compose exec postgres psql -U postgres -c "
ALTER USER autoplate_user WITH PASSWORD 'new_secure_password';"

# Update .env file
# Restart backend
docker-compose restart backend
```

### Create Read-Only User
```bash
docker-compose exec postgres psql -U postgres -d autoplate_renamer -c "
CREATE USER readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE autoplate_renamer TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;"
```

## 🗄 Data Persistence

### Volume Location
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect autoplate-renamer_postgres_data

# Backup volume
docker run --rm \
  -v autoplate-renamer_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_data_backup.tar.gz -C /data .
```

### Restore Volume
```bash
# Extract backup
docker run --rm \
  -v autoplate-renamer_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_data_backup.tar.gz -C /data
```

## ⚠️ Troubleshooting

### Database Won't Start
```bash
# Check logs
docker-compose logs postgres

# Check permissions
docker-compose exec postgres ls -la /var/lib/postgresql/data

# Reset data (⚠️ destroys all data)
docker-compose down
docker volume rm autoplate-renamer_postgres_data
docker-compose up -d postgres
```

### Connection Refused
```bash
# Check if container is running
docker-compose ps postgres

# Check health
docker-compose exec postgres pg_isready -U autoplate_user

# Check backend can connect
docker-compose exec backend ping postgres
```

### Slow Queries
```bash
# Enable query logging
docker-compose exec postgres psql -U postgres -c "
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
SELECT pg_reload_conf();"

# View logs
docker-compose logs -f postgres | grep duration
```

## 📦 Migration from External Database

If you were using external database (143.198.85.151), migrate data:

```bash
# 1. Backup old database
pg_dump -h 143.198.85.151 -U mydvh-usr -d auto-rename-plate-db > old_db.sql

# 2. Start new local database
docker-compose up -d postgres

# 3. Restore to new database
docker-compose exec -T postgres psql -U autoplate_user -d autoplate_renamer < old_db.sql

# 4. Update .env to use local database (already done)
# DB_HOST=postgres

# 5. Restart backend
docker-compose restart backend
```

## 🔄 Upgrades

### Upgrade PostgreSQL Version
```bash
# 1. Backup current database
./scripts/backup-db.sh

# 2. Update docker-compose.yml
# Change: postgres:15-alpine to postgres:16-alpine

# 3. Remove old data
docker-compose down
docker volume rm autoplate-renamer_postgres_data

# 4. Start new version
docker-compose up -d postgres

# 5. Restore data
./scripts/restore-db.sh backups/latest_backup.dump.gz
```

---

**Container Name:** autoplate-postgres  
**Internal Host:** postgres  
**Port:** 5432 (internal only)  
**Volume:** postgres_data
