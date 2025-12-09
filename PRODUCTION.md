# AutoPlate Renamer - Production Deployment with SSL

## 🚀 Production Setup Guide

### Prerequisites
- Docker and Docker Compose installed
- Domain `anhxe.servehttp.com` pointing to your server IP
- Ports 80 and 443 open in firewall

### Architecture
```
Internet (HTTPS) 
    ↓
Nginx (Port 80/443) - SSL Termination
    ↓
    ├─→ Frontend (Port 80) - React App
    └─→ Backend (Port 5000) - API Server
```

## 📋 Initial Setup

### 1. Configure Environment Variables
Edit `.env` file:
```bash
DOMAIN=anhxe.servehttp.com
EMAIL=admin@anhxe.servehttp.com
FRONTEND_URL=https://anhxe.servehttp.com
```

### 2. First-Time SSL Certificate Setup

**Step 1: Start services WITHOUT SSL first**
```bash
# Temporarily modify nginx config to not require SSL certificates
# Comment out SSL lines in nginx/nginx.conf for initial setup

docker-compose up -d nginx backend frontend
```

**Step 2: Obtain SSL Certificate**
```bash
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@anhxe.servehttp.com \
  --agree-tos \
  --no-eff-email \
  -d anhxe.servehttp.com
```

**Step 3: Uncomment SSL lines in nginx.conf and restart**
```bash
# Restore full nginx.conf with SSL configuration
docker-compose restart nginx
```

### Alternative: Use Setup Script
```bash
chmod +x scripts/setup-ssl.sh
docker-compose exec nginx /scripts/setup-ssl.sh
```

## 🔄 Normal Deployment

After initial SSL setup, deploy with:

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f nginx
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🔐 SSL Certificate Management

### Auto-Renewal
Certificates automatically renew via certbot container (checks every 12 hours).

### Manual Renewal
```bash
docker-compose exec certbot certbot renew --webroot --webroot-path=/var/www/certbot
docker-compose exec nginx nginx -s reload
```

### Check Certificate Status
```bash
docker-compose exec certbot certbot certificates
```

## 📊 Monitoring

### Health Checks
- Backend: https://anhxe.servehttp.com/health
- Frontend: https://anhxe.servehttp.com/

### View Logs
```bash
# Nginx access logs
docker-compose exec nginx tail -f /var/log/nginx/access.log

# Nginx error logs
docker-compose exec nginx tail -f /var/log/nginx/error.log

# Backend logs
docker-compose logs -f backend

# All logs
docker-compose logs -f
```

## 🛠 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 80/443
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Stop conflicting services
sudo systemctl stop apache2
sudo systemctl stop nginx
```

### SSL Certificate Issues
```bash
# Test with staging certificates first
STAGING=1 docker-compose run --rm certbot certonly ...

# Check certificate files
ls -la certbot/conf/live/anhxe.servehttp.com/

# Verify nginx config
docker-compose exec nginx nginx -t
```

### Cannot Access Site
1. Check DNS: `nslookup anhxe.servehttp.com`
2. Check firewall: `sudo ufw status`
3. Check containers: `docker-compose ps`
4. Check logs: `docker-compose logs nginx`

### Database Connection Issues
```bash
# Test DB connection from backend
docker-compose exec backend node -e "console.log('DB Host:', process.env.DB_HOST)"

# Check if DB is accessible
telnet 143.198.85.151 5432
```

## 🔄 Updates

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Or rebuild specific service
docker-compose up -d --build frontend
docker-compose up -d --build backend
```

### Update SSL Certificates (force renewal)
```bash
docker-compose exec certbot certbot renew --force-renewal
docker-compose exec nginx nginx -s reload
```

## 📁 Directory Structure
```
autoplate-renamer/
├── backend/              # Node.js API
├── frontend/             # React app
├── nginx/
│   └── nginx.conf       # Nginx reverse proxy config
├── certbot/
│   ├── conf/            # SSL certificates (generated)
│   └── www/             # ACME challenge files
├── scripts/
│   ├── setup-ssl.sh     # SSL setup script
│   └── renew-cert.sh    # Renewal script
├── docker-compose.yml   # Docker orchestration
└── .env                 # Environment variables
```

## 🔒 Security Checklist

- [x] HTTPS enabled with Let's Encrypt
- [x] HTTP → HTTPS redirect
- [x] Security headers configured
- [x] JWT secret changed from default
- [x] Database credentials secured
- [x] CORS configured for specific domain
- [ ] Regular backups configured
- [ ] Monitoring/alerting set up

## 🚨 Emergency Commands

### Stop All Services
```bash
docker-compose down
```

### Stop Specific Service
```bash
docker-compose stop backend
docker-compose stop frontend
docker-compose stop nginx
```

### Restart Without Downtime
```bash
docker-compose up -d --no-deps --build backend
```

### Complete Reset (⚠️ Destroys data)
```bash
docker-compose down -v
rm -rf certbot/conf/*
docker-compose up -d --build
```

## 📞 Support

For issues, check:
1. Container logs: `docker-compose logs`
2. Nginx config: `docker-compose exec nginx nginx -t`
3. Certificate status: `docker-compose exec certbot certbot certificates`

---

**Production URL:** https://anhxe.servehttp.com
**API URL:** https://anhxe.servehttp.com/api
**Default Admin:** admin@example.com / 123456
