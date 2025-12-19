#!/bin/bash

# Quick deployment script for production

set -e

echo "=========================================="
echo "AutoPlate Renamer - Production Deployment"
echo "=========================================="

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DOMAIN="${DOMAIN:-anhxe.dangkiemxe.net}"

echo "Domain: $DOMAIN"
echo ""

# Check if SSL certificates exist
if [ ! -d "certbot/conf/live/$DOMAIN" ]; then
    echo "⚠️  SSL certificates not found!"
    echo ""
    echo "This is the first deployment. Please follow these steps:"
    echo ""
    echo "1. Make sure domain $DOMAIN points to this server's IP"
    echo "2. Run initial SSL setup:"
    echo "   docker-compose up -d nginx"
    echo "   docker-compose run --rm certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --email $EMAIL --agree-tos --no-eff-email"
    echo "3. Then run this script again"
    echo ""
    exit 1
fi

echo "✓ SSL certificates found"
echo ""

# Pull latest changes (if using git)
if [ -d .git ]; then
    echo "Pulling latest changes..."
    git pull
    echo ""
fi

# Build and deploy
echo "Building and deploying services..."
docker-compose up -d --build

echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Check status
echo ""
echo "Service Status:"
docker-compose ps

echo ""
echo "=========================================="
echo "✓ Deployment Complete!"
echo "=========================================="
echo ""
echo "Application URL: https://$DOMAIN"
echo "API Health: https://$DOMAIN/health"
echo ""
echo "View logs: docker-compose logs -f"
echo "Stop services: docker-compose down"
echo ""
