# MakingItMixProStudio - Deployment Guide

## Prerequisites

- Node.js 18+ and npm 9+
- Hetzner server account with VPS
- Domain names pointing to server IP: `178.156.211.113`
- Stripe account for payments (optional)

## Quick Start

### 1. Prepare Your Local Machine

```bash
# Clone repository
git clone https://github.com/travelbagbiggz-gif/makingitmixstudio.git
cd makingitmixstudio

# Copy environment template
cp .env.example .env.production

# Edit with your values
nano .env.production
```

### 2. Update Configuration

Edit `.env.production` with:

```bash
# Database
DB_PASSWORD=your_secure_password_here

# Stripe (get from https://dashboard.stripe.com)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Domains
FRONTEND_URL=https://makingmixprostudio.com
API_URL=https://makingmixprostudio.com
```

### 3. Configure DNS

Point both domains to your Hetzner IP:

```
makingmixprostudio.com     A    178.156.211.113
makingitmixprobeats.com    A    178.156.211.113
```

### 4. Build & Deploy

```bash
# Build production frontend
chmod +x build.sh
./build.sh

# Deploy to Hetzner
chmod +x deploy.sh
./deploy.sh
```

The deployment script will:
1. ✅ Upload files to Hetzner
2. ✅ Install Node.js, PostgreSQL, Nginx
3. ✅ Setup database with all tables
4. ✅ Configure SSL/TLS certificates (Let's Encrypt)
5. ✅ Setup Nginx reverse proxy
6. ✅ Start app with PM2 (cluster mode)
7. ✅ Configure firewall

## Post-Deployment

### Check Application Status

```bash
# SSH into server
ssh root@178.156.211.113

# Check PM2 status
pm2 status

# View logs
pm2 logs makingitmixstudio-api

# Restart app if needed
pm2 restart makingitmixstudio-api

# View Nginx status
sudo systemctl status nginx

# Check database
sudo -u postgres psql -d makingitmixstudio
```

### SSL Certificate Renewal

Automatically handled by Certbot with cron job:

```bash
# Verify renewal
sudo certbot renew --dry-run
```

### Backup Database

```bash
# SSH into server
ssh root@178.156.211.113

# Backup
sudo -u postgres pg_dump makingitmixstudio > backup.sql

# Restore
sudo -u postgres psql makingitmixstudio < backup.sql
```

## Troubleshooting

### App won't start

```bash
# Check logs
pm2 logs makingitmixstudio-api --err

# Restart
pm2 restart makingitmixstudio-api

# Check if port 4000 is in use
sudo netstat -tulpn | grep 4000
```

### Database connection error

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Verify database exists
sudo -u postgres psql -l

# Check .env variables
cat /var/www/makingitmixstudio/.env
```

### SSL certificate issues

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Check Nginx config
sudo nginx -t
```

### Nginx not forwarding to API

```bash
# Check Nginx config
sudo cat /etc/nginx/sites-enabled/makingitmix

# Reload Nginx
sudo systemctl reload nginx

# Check if backend is running
curl http://localhost:4000/health || echo "API not running"
```

## Performance Tuning

### Database Connection Pool

Edit `.env`:

```bash
DB_POOL_MIN=5
DB_POOL_MAX=20
```

### PM2 Cluster Instances

```bash
pm2 start server.js --name "api" --instances 4
pm2 save
```

### Nginx Worker Processes

```bash
# Edit /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 2048;
```

## Monitoring

### PM2 Monitoring

```bash
pm2 install pm2-logrotate
pm2 install pm2-auto-pull
pm2 install pm2-server-monit
```

### View Real-time Monitoring

```bash
pm2 monit
```

## Security

1. ✅ Firewall configured during deployment
2. ✅ SSL/TLS enabled for all traffic
3. ✅ Passwords hashed with bcrypt
4. ✅ SQL injection prevention
5. ✅ CORS properly configured

### Additional Hardening

```bash
# Add fail2ban for brute force protection
ssh root@178.156.211.113
sudo apt-get install fail2ban

# Configure rate limiting in Nginx
sudo nano /etc/nginx/nginx.conf
# Add: limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
```

## Scaling

When you need to scale:

1. **Horizontal**: Add more PM2 instances
2. **Database**: Enable connection pooling (already done)
3. **Cache**: Add Redis for sessions
4. **CDN**: Use Cloudflare for static assets

## Support

For issues, check logs:

```bash
# Application logs
pm2 logs makingitmixstudio-api

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql.log
```
