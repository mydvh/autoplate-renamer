# SSL Setup Instructions for Production

## 🔐 Step-by-Step SSL Certificate Setup

### Prerequisites
1. Domain `anhxe.dangkiemxe.net` must be pointing to your server IP
2. Ports 80 and 443 must be open in firewall

### Option 1: Automatic Setup (Recommended)

**Step 1: Initial deployment without SSL**
```bash
# Use temporary nginx config (no SSL)
cp nginx/nginx-init.conf nginx/nginx.conf

# Start services
docker-compose up -d
```

**Step 2: Obtain SSL certificate**
```bash
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@anhxe.dangkiemxe.net \
  --agree-tos \
  --no-eff-email \
  -d anhxe.dangkiemxe.net
```

**Step 3: Switch to SSL nginx config**
```bash
# Restore the full nginx config with SSL
git checkout nginx/nginx.conf
# Or manually copy from nginx/nginx-ssl.conf

# Restart nginx to apply SSL config
docker-compose restart nginx
```

**Step 4: Verify**
```bash
# Check certificate
docker-compose exec certbot certbot certificates

# Test HTTPS
curl -I https://anhxe.dangkiemxe.net
```

### Option 2: Manual Setup

**1. Start nginx only**
```bash
docker-compose up -d nginx backend frontend
```

**2. Request certificate manually**
```bash
docker exec -it autoplate-nginx sh

# Inside container:
apk add certbot certbot-nginx
certbot --nginx -d anhxe.dangkiemxe.net
```

**3. Copy certificates to volume**
```bash
docker cp autoplate-nginx:/etc/letsencrypt ./certbot/conf
```

### Verification Checklist

✅ Domain resolves to server IP
```bash
nslookup anhxe.dangkiemxe.net
```

✅ Port 80 is accessible
```bash
curl http://anhxe.dangkiemxe.net
```

✅ Certbot can reach ACME challenge
```bash
curl http://anhxe.dangkiemxe.net/.well-known/acme-challenge/test
```

✅ Certificate files exist
```bash
ls -la certbot/conf/live/anhxe.dangkiemxe.net/
# Should see: fullchain.pem, privkey.pem
```

✅ HTTPS works
```bash
curl -I https://anhxe.dangkiemxe.net
```

✅ HTTP redirects to HTTPS
```bash
curl -I http://anhxe.dangkiemxe.net
# Should see: 301 Moved Permanently
```

### Troubleshooting

**Problem: "Failed authorization procedure"**
```bash
# Check DNS
nslookup anhxe.dangkiemxe.net

# Check if port 80 is accessible
curl -v http://anhxe.dangkiemxe.net/.well-known/acme-challenge/test

# Check nginx logs
docker-compose logs nginx
```

**Problem: "Cert not yet valid"**
```bash
# Your server time might be wrong
date

# Sync time
sudo ntpdate -s time.nist.gov
```

**Problem: "Too many certificates already issued"**
```bash
# Use staging environment for testing
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --staging \
  -d anhxe.dangkiemxe.net
```

### Testing Before Production

Use Let's Encrypt staging environment:
```bash
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --staging \
  --email admin@anhxe.dangkiemxe.net \
  --agree-tos \
  --no-eff-email \
  -d anhxe.dangkiemxe.net
```

Once working, delete staging certs and request production:
```bash
rm -rf certbot/conf/*
# Run production certbot command (without --staging)
```

### Auto-Renewal

Certificates auto-renew via certbot container. To test renewal:
```bash
docker-compose exec certbot certbot renew --dry-run
```

### Manual Renewal (if needed)
```bash
docker-compose exec certbot certbot renew --webroot --webroot-path=/var/www/certbot
docker-compose exec nginx nginx -s reload
```

---

## Quick Reference

### Certificate Locations
- Certificates: `certbot/conf/live/anhxe.dangkiemxe.net/`
- Renewal config: `certbot/conf/renewal/anhxe.dangkiemxe.net.conf`
- Logs: `certbot/conf/logs/`

### Useful Commands
```bash
# View certificate info
docker-compose exec certbot certbot certificates

# Test nginx config
docker-compose exec nginx nginx -t

# Reload nginx
docker-compose exec nginx nginx -s reload

# View renewal timer
docker-compose exec certbot certbot renew --dry-run

# Force renewal
docker-compose exec certbot certbot renew --force-renewal
```
