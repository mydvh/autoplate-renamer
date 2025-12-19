#!/bin/bash

# SSL Certificate Setup Script using Certbot
# This script will obtain SSL certificates from Let's Encrypt

DOMAIN="${DOMAIN:-anhxe.dangkiemxe.net}"
EMAIL="${EMAIL:-admin@anhxe.dangkiemxe.net}"
STAGING="${STAGING:-0}" # Set to 1 for testing

echo "=========================================="
echo "SSL Certificate Setup for $DOMAIN"
echo "=========================================="

# Wait for nginx to be ready
echo "Waiting for nginx to start..."
sleep 5

# Check if certificates already exist
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "✓ Certificates already exist for $DOMAIN"
    echo "To renew, run: certbot renew"
    exit 0
fi

echo "Obtaining SSL certificate..."

# Staging flag for testing
STAGING_FLAG=""
if [ "$STAGING" = "1" ]; then
    echo "⚠ Running in STAGING mode (test certificates)"
    STAGING_FLAG="--staging"
fi

# Request certificate
certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    $STAGING_FLAG \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    echo "✓ SSL certificate obtained successfully!"
    echo "Reloading nginx..."
    nginx -s reload
    echo "✓ Setup complete!"
else
    echo "✗ Failed to obtain SSL certificate"
    echo "Check logs for details"
    exit 1
fi

echo "=========================================="
echo "Certificate location:"
echo "/etc/letsencrypt/live/$DOMAIN/"
echo "=========================================="
