# 🚀 Catalyst Markets - Deployment Guide

## Option A: Local Docker (Fastest — 5 minutes)

### Step 1: Setup env file
```bash
cp .env.production.example .env.production
# Edit .env.production and change all passwords
nano .env.production
```

### Step 2: Build and run
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Step 3: Seed database (first time only)
```bash
docker exec catalyst-backend npx prisma db seed
```

### Step 4: Verify
```bash
# Check all containers running
docker-compose -f docker-compose.prod.yml ps

# Test backend
curl http://localhost:3001/health

# Open browser
http://localhost:3000
```

---

## Option B: Vercel + Railway (Free Tier — Recommended)

### Frontend → Vercel (Free)

1. Push code to GitHub
2. Go to https://vercel.com → New Project
3. Import your GitHub repo
4. Set **Root Directory** to `frontend`
5. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app/api/v1
   NEXT_PUBLIC_WS_URL=wss://your-railway-backend.up.railway.app/ws
   ```
6. Click Deploy

### Backend → Railway (Free $5/month credit)

1. Go to https://railway.app → New Project
2. Deploy from GitHub → select your repo
3. Set **Root Directory** to `backend`
4. Add environment variables (copy from .env.production.example)
5. Railway auto-detects Node.js and deploys

### Database → Railway PostgreSQL (Free)
1. In Railway → New Service → PostgreSQL
2. Copy the `DATABASE_URL` it gives you
3. Add to your backend service env vars

### Redis → Railway Redis (Free)
1. In Railway → New Service → Redis
2. Copy the `REDIS_URL`
3. Add to your backend service env vars

---

## Option C: AWS EC2 (Production Grade)

### Step 1: Launch EC2 instance
```
Instance type: t3.small (2GB RAM minimum)
AMI: Ubuntu 22.04 LTS
Storage: 20GB SSD
Security Group: Open ports 22, 80, 443, 3000, 3001
```

### Step 2: SSH and install dependencies
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 3: Clone and deploy
```bash
git clone https://github.com/yourusername/catalyst-markets.git
cd catalyst-markets

cp .env.production.example .env.production
nano .env.production  # Edit all passwords and URLs

docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Step 4: Setup Nginx reverse proxy
```bash
sudo apt install nginx -y

sudo nano /etc/nginx/sites-available/catalyst
```

Paste this config:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/catalyst /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Add SSL (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 📋 Post-Deployment Checklist

```bash
# 1. Health check
curl https://yourdomain.com/api/v1  # via Nginx
curl http://localhost:3001/health    # direct

# 2. WebSocket check
wscat -c wss://yourdomain.com/ws

# 3. Database check
docker exec catalyst-backend npx prisma studio
# Opens at localhost:5555

# 4. Check logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

---

## 🔁 Update Deployment

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run any new migrations
docker exec catalyst-backend npx prisma migrate deploy
```

---

## 💰 Cost Breakdown

| Option | Cost | Best For |
|--------|------|---------|
| Local Docker | Free | Development/Testing |
| Vercel + Railway | ~$0–5/mo | Demo/MVP |
| AWS t3.small | ~$15/mo | Production |
| AWS t3.medium | ~$30/mo | Scale |

---

## 🐛 Common Deployment Issues

### Backend won't start
```bash
docker logs catalyst-backend
# Usually: wrong DATABASE_URL or missing env vars
```

### WebSocket not connecting
```bash
# Make sure Nginx has the /ws location block
# Check: proxy_set_header Upgrade $http_upgrade;
```

### Prices not updating
```bash
# Mock prices work without any API keys
# Check backend logs for WebSocket broadcast messages
docker logs catalyst-backend | grep "Sent.*updates"
```

### Frontend shows blank page
```bash
# Check NEXT_PUBLIC_API_URL is set correctly
# Must match your actual backend URL
docker logs catalyst-frontend
```
