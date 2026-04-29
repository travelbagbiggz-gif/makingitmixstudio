#!/bin/bash

# MakingItMixProStudio - Deployment Script
# Deploys to Hetzner server with full automation

set -e

echo "🚀 Deploying MakingItMixProStudio to Hetzner..."

# Configuration
SERVER_IP="178.156.211.113"
SERVER_USER="root"
APP_DIR="/var/www/makingitmixstudio"
DOMAIN1="makingmixprostudio.com"
DOMAIN2="makingitmixprobeats.com"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  Server: $SERVER_IP"
echo "  App Directory: $APP_DIR"
echo "  Domains: $DOMAIN1, $DOMAIN2"
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production not found!${NC}"
    echo -e "${YELLOW}Please copy .env.example to .env.production and update with your values${NC}"
    exit 1
fi

echo -e "${BLUE}📤 Uploading build to server...${NC}"
ssh $SERVER_USER@$SERVER_IP "mkdir -p $APP_DIR" 2>/dev/null || true
scp -r dist/* $SERVER_USER@$SERVER_IP:$APP_DIR/
scp server.js $SERVER_USER@$SERVER_IP:$APP_DIR/
scp package.json $SERVER_USER@$SERVER_IP:$APP_DIR/
scp .env.production $SERVER_USER@$SERVER_IP:$APP_DIR/.env
scp setup-db.sh $SERVER_USER@$SERVER_IP:$APP_DIR/

echo -e "${GREEN}✅ Files uploaded${NC}"

echo -e "${BLUE}🔧 Running setup on server...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
set -e
cd /var/www/makingitmixstudio

# Update system
apt-get update
apt-get upgrade -y

# Install Node.js
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
fi

# Install Certbot
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup
fi

# Install app dependencies
npm install --production

# Run database setup
chmod +x setup-db.sh
./setup-db.sh

echo "✅ Server setup complete"
EOF

echo -e "${BLUE}🔐 Setting up SSL certificates...${NC}"
ssh $SERVER_USER@$SERVER_IP << EOF
certbot certonly --non-interactive --agree-tos --no-eff-email --nginx -d $DOMAIN1 -d $DOMAIN2 || true
EOF

echo -e "${BLUE}⚙️  Configuring Nginx...${NC}"
ssh $SERVER_USER@$SERVER_IP << EOF
cat > /etc/nginx/sites-available/makingitmix << 'NGINX'
upstream api {
    server 127.0.0.1:4000;
}

server {
    listen 80;
    server_name makingmixprostudio.com makingitmixprobeats.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name makingmixprostudio.com makingitmixprobeats.com;
    
    ssl_certificate /etc/letsencrypt/live/makingmixprostudio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/makingmixprostudio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    root /var/www/makingitmixstudio;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /uploads/ {
        proxy_pass http://api/uploads/;
        expires 30d;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/makingitmix /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
EOF

echo -e "${BLUE}🚀 Starting application with PM2...${NC}"
ssh $SERVER_USER@$SERVER_IP << EOF
cd /var/www/makingitmixstudio
pm2 delete makingitmixstudio-api || true
pm2 start server.js --name "makingitmixstudio-api" --instances 2 --exec-mode cluster
pm2 save
pm2 startup
EOF

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${GREEN}🎉 Your app is live!${NC}"
echo -e "  🌐 https://makingmixprostudio.com"
echo -e "  🎶 https://makingitmixprobeats.com"
echo -e "  📊 Check status: ${BLUE}ssh $SERVER_USER@$SERVER_IP pm2 status${NC}"
echo -e "  📝 View logs: ${BLUE}ssh $SERVER_USER@$SERVER_IP pm2 logs${NC}"
