#!/bin/bash

# Certificate Renewal Script
# Add this to cron for automatic renewal: 0 0 * * * /path/to/renew-cert.sh

echo "Checking SSL certificate renewal..."

certbot renew --webroot --webroot-path=/var/www/certbot --quiet

if [ $? -eq 0 ]; then
    echo "Certificate renewal check complete"
    # Reload nginx if certificates were renewed
    nginx -s reload
else
    echo "Certificate renewal failed"
    exit 1
fi
