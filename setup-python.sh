#!/bin/bash
# Setup script for Python backend environment

set -e

echo "🐍 Setting up Python backend environment..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✅ Found Python $PYTHON_VERSION"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r backend/requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the FastAPI server:"
echo "  1. Activate the virtual environment: source venv/bin/activate"
echo "  2. Run the server: python backend/run.py"
echo ""
echo "Or use: pnpm dev:api"
