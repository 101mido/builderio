# Deployment Guide

This guide covers different methods to deploy Fusion Starter to your server.

## Quick Links

- [Manual Deployment](#manual-deployment)
- [Docker Deployment](#docker-deployment-recommended)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)

---

## Docker Deployment (Recommended)

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### 1. Install Docker on Your Server

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Add your user to docker group (optional)
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone Repository

```bash
git clone https://github.com/101mido/builderio.git
cd builderio
git checkout claude/fastapi-backend-setup-011CUx4G6ZZ1QcDntZ4vjtiA
```

### 3. Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit configuration
nano .env
```

Required variables:
```env
PING_MESSAGE=pong
API_HOST=0.0.0.0
API_PORT=8000
```

### 4. Update Docker Compose Volumes

Edit `docker-compose.yml` to set correct paths for your audio files:

```yaml
volumes:
  - ./data:/app/data
  - /your/audio/path:/cc1_recordings           # Update this
  - /your/transcription/path:/cc1_transcriptions  # Update this
```

### 5. Build and Run

```bash
# Build the Docker image
docker compose build

# Start the application
docker compose up -d

# Check logs
docker compose logs -f

# Check status
docker compose ps
```

### 6. Access Application

- **Application**: http://your-server-ip:8000
- **API Docs**: http://your-server-ip:8000/docs

### 7. Optional: Run with Nginx Reverse Proxy

```bash
# Start with nginx profile
docker compose --profile with-nginx up -d
```

This will:
- Run the app on port 8000 (internal)
- Run nginx on port 80 (public)
- Access via: http://your-server-ip

### Docker Commands

```bash
# View logs
docker compose logs -f app

# Restart application
docker compose restart app

# Stop application
docker compose down

# Update application
git pull
docker compose build
docker compose up -d

# Remove everything (including volumes)
docker compose down -v
```

---

## Manual Deployment

### Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+
- Python 3.9+
- Nginx (recommended)

### 1. Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install nginx
sudo apt install -y nginx
```

### 2. Clone and Setup

```bash
# Clone repository
git clone https://github.com/101mido/builderio.git
cd builderio
git checkout claude/fastapi-backend-setup-011CUx4G6ZZ1QcDntZ4vjtiA

# Install dependencies
pnpm install
bash setup-python.sh

# Configure environment
cp .env.example .env
nano .env

# Build frontend
pnpm build
```

### 3. Create Systemd Service

```bash
sudo nano /etc/systemd/system/fusion-starter.service
```

```ini
[Unit]
Description=Fusion Starter FastAPI Application
After=network.target

[Service]
Type=notify
User=YOUR_USERNAME
Group=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/builderio/backend
Environment="PATH=/home/YOUR_USERNAME/builderio/venv/bin"
ExecStart=/home/YOUR_USERNAME/builderio/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Replace `YOUR_USERNAME` with your actual username.

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable fusion-starter
sudo systemctl start fusion-starter
sudo systemctl status fusion-starter
```

### 4. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/fusion-starter
```

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Change this

    client_max_body_size 500M;

    location / {
        root /home/YOUR_USERNAME/builderio/dist/spa;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
    }

    location ~ ^/(docs|redoc|openapi.json) {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/fusion-starter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Setup SSL (Optional but Recommended)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

---

## Environment Variables

### Required Variables

```env
# Backend API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=false  # Set to false in production

# Application Settings
PING_MESSAGE=pong

# Optional: Builder.io
VITE_PUBLIC_BUILDER_KEY=your_key_here
```

### Audio Directory Configuration

Configure per-tenant in the application UI or via API:

```json
{
  "source": "/path/to/recordings",
  "destination": "/path/to/transcriptions"
}
```

---

## Post-Deployment

### 1. Verify Installation

```bash
# Test API health
curl http://localhost:8000/api/health

# Should return: {"status":"healthy"}

# Test ping
curl http://localhost:8000/api/ping

# Should return: {"message":"pong"}
```

### 2. Create First Tenant

```bash
curl -X POST http://localhost:8000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name":"default"}'
```

### 3. Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# If not using nginx, allow app port
sudo ufw allow 8000/tcp

# Enable firewall
sudo ufw enable
```

### 4. Monitor Logs

**Docker:**
```bash
docker compose logs -f app
```

**Systemd:**
```bash
sudo journalctl -u fusion-starter -f
```

**Nginx:**
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Updating the Application

### Docker Deployment

```bash
cd builderio
git pull
docker compose build
docker compose up -d
```

### Manual Deployment

```bash
cd builderio
git pull

# Update dependencies if needed
pnpm install
source venv/bin/activate
pip install -r backend/requirements.txt

# Rebuild frontend
pnpm build

# Restart service
sudo systemctl restart fusion-starter
```

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :8000

# Kill the process
sudo kill -9 <PID>
```

### Permission Errors

```bash
# Fix ownership
sudo chown -R $USER:$USER /home/$USER/builderio

# Fix permissions for data directory
chmod 755 /home/$USER/builderio/data
```

### Service Won't Start

```bash
# Check service status
sudo systemctl status fusion-starter

# Check logs
sudo journalctl -u fusion-starter -n 50 --no-pager

# Test manually
cd /home/$USER/builderio
source venv/bin/activate
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Docker Issues

```bash
# Check container logs
docker compose logs app

# Restart container
docker compose restart app

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Performance Tuning

### Increase Uvicorn Workers

For production, adjust workers based on CPU cores:

**Systemd:**
Edit `/etc/systemd/system/fusion-starter.service`:
```ini
ExecStart=...uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Docker:**
Edit `Dockerfile`:
```dockerfile
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Nginx Caching

Add to nginx config:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g
                 inactive=60m use_temp_path=off;

location /api {
    proxy_cache my_cache;
    proxy_cache_valid 200 5m;
    # ... rest of config
}
```

---

## Security Best Practices

1. **Use HTTPS**: Always use SSL/TLS in production
2. **Firewall**: Only open required ports
3. **Updates**: Keep system and dependencies updated
4. **Backups**: Regularly backup `/app/data` directory
5. **Environment**: Never commit `.env` file with secrets
6. **User Permissions**: Don't run as root

---

## Support

For issues or questions, check:
- Application logs
- API documentation at `/docs`
- GitHub repository issues
