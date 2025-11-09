#!/bin/bash
# Quick deployment script for Fusion Starter

set -e

echo "🚀 Fusion Starter - Deployment Script"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect deployment method
echo "Select deployment method:"
echo "1) Docker (Recommended)"
echo "2) Manual (Systemd)"
echo ""
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        echo ""
        echo "🐳 Docker Deployment Selected"
        echo "=============================="
        echo ""

        # Check Docker
        if ! command_exists docker; then
            echo "Installing Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
            echo "✅ Docker installed. Please log out and log back in, then run this script again."
            exit 0
        fi

        # Check Docker Compose
        if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
            echo "Installing Docker Compose..."
            sudo apt update
            sudo apt install -y docker-compose-plugin
        fi

        echo "✅ Docker is ready"
        echo ""

        # Check for .env file
        if [ ! -f .env ]; then
            echo "Creating .env file..."
            cp .env.example .env
            echo "⚠️  Please edit .env file with your configuration"
            echo "   nano .env"
            read -p "Press Enter when ready to continue..."
        fi

        # Build and run
        echo ""
        echo "Building Docker image..."
        docker compose build

        echo ""
        echo "Starting application..."
        docker compose up -d

        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "📍 Access your application:"
        echo "   Application: http://$(hostname -I | awk '{print $1}'):8000"
        echo "   API Docs:    http://$(hostname -I | awk '{print $1}'):8000/docs"
        echo ""
        echo "📊 Useful commands:"
        echo "   View logs:   docker compose logs -f"
        echo "   Stop app:    docker compose down"
        echo "   Restart:     docker compose restart"
        ;;

    2)
        echo ""
        echo "🔧 Manual Deployment Selected"
        echo "=============================="
        echo ""

        # Check Node.js
        if ! command_exists node; then
            echo "Installing Node.js..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt install -y nodejs
        fi

        # Check pnpm
        if ! command_exists pnpm; then
            echo "Installing pnpm..."
            npm install -g pnpm
        fi

        # Check Python
        if ! command_exists python3.11; then
            echo "Installing Python 3.11..."
            sudo apt update
            sudo apt install -y python3.11 python3.11-venv python3-pip
        fi

        echo "✅ Prerequisites installed"
        echo ""

        # Install dependencies
        echo "Installing Node.js dependencies..."
        pnpm install

        echo "Setting up Python environment..."
        if [ ! -f setup-python.sh ]; then
            chmod +x setup-python.sh
        fi
        bash setup-python.sh

        # Environment setup
        if [ ! -f .env ]; then
            echo "Creating .env file..."
            cp .env.example .env
            echo "⚠️  Please edit .env file with your configuration"
            read -p "Press Enter when ready to continue..."
        fi

        # Build frontend
        echo "Building frontend..."
        pnpm build

        # Create systemd service
        SERVICE_FILE="/etc/systemd/system/fusion-starter.service"

        echo ""
        echo "Creating systemd service..."

        sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=Fusion Starter FastAPI Application
After=network.target

[Service]
Type=notify
User=$USER
Group=$USER
WorkingDirectory=$PWD/backend
Environment="PATH=$PWD/venv/bin"
ExecStart=$PWD/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

        # Enable and start service
        sudo systemctl daemon-reload
        sudo systemctl enable fusion-starter
        sudo systemctl start fusion-starter

        echo ""
        echo "✅ Service started!"
        echo ""
        echo "📊 Useful commands:"
        echo "   Check status:  sudo systemctl status fusion-starter"
        echo "   View logs:     sudo journalctl -u fusion-starter -f"
        echo "   Restart:       sudo systemctl restart fusion-starter"
        echo "   Stop:          sudo systemctl stop fusion-starter"
        echo ""

        # Ask about nginx
        read -p "Do you want to setup Nginx reverse proxy? [y/N]: " setup_nginx

        if [[ $setup_nginx =~ ^[Yy]$ ]]; then
            if ! command_exists nginx; then
                echo "Installing Nginx..."
                sudo apt install -y nginx
            fi

            read -p "Enter your domain name (or press Enter for IP-based access): " domain
            if [ -z "$domain" ]; then
                domain="_"
            fi

            NGINX_CONFIG="/etc/nginx/sites-available/fusion-starter"

            sudo tee $NGINX_CONFIG > /dev/null <<EOF
server {
    listen 80;
    server_name $domain;

    client_max_body_size 500M;

    location / {
        root $PWD/dist/spa;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
    }

    location ~ ^/(docs|redoc|openapi.json) {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
}
EOF

            sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
            sudo nginx -t
            sudo systemctl restart nginx

            echo ""
            echo "✅ Nginx configured!"

            if [ "$domain" != "_" ]; then
                read -p "Do you want to setup SSL with Let's Encrypt? [y/N]: " setup_ssl
                if [[ $setup_ssl =~ ^[Yy]$ ]]; then
                    sudo apt install -y certbot python3-certbot-nginx
                    sudo certbot --nginx -d $domain
                fi
            fi
        fi

        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "📍 Access your application:"
        if [ "$domain" != "_" ]; then
            echo "   Application: http://$domain"
        else
            echo "   Application: http://$(hostname -I | awk '{print $1}')"
        fi
        ;;

    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment successful!"
echo ""
echo "📚 For more information, see DEPLOYMENT.md"
