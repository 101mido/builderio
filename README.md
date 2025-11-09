# Fusion Starter - Audio Processor Application

A full-stack web application for multi-tenant audio file processing and transcription management.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: FastAPI (Python)
- **UI**: TailwindCSS + Radix UI (shadcn/ui)
- **Storage**: File-based JSON

## Prerequisites

- **Node.js** 18+ and **pnpm** 10.14.0+
- **Python** 3.9+ (Python 3.11 recommended)
- **Git**

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Setup Python environment and install backend dependencies
pnpm setup:python
# Or manually:
# bash setup-python.sh (Linux/Mac)
# setup-python.bat (Windows)
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# Add your Builder.io API key if needed
```

### 3. Run the Application

You need to run both the frontend and backend servers:

**Terminal 1 - Backend (FastAPI):**
```bash
# Activate Python virtual environment
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate.bat  # Windows

# Start the FastAPI server (runs on http://localhost:8000)
pnpm dev:api
```

**Terminal 2 - Frontend (Vite):**
```bash
# Start the Vite dev server (runs on http://localhost:8080)
pnpm dev
```

Now open http://localhost:8080 in your browser.

## Development

### Available Scripts

- `pnpm dev` - Start Vite dev server (frontend)
- `pnpm dev:api` - Start FastAPI server (backend)
- `pnpm setup:python` - Setup Python virtual environment
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm test` - Run tests
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm format.fix` - Format code with Prettier

### API Documentation

When the FastAPI server is running, you can access:

- **Interactive API docs**: http://localhost:8000/docs (Swagger UI)
- **Alternative API docs**: http://localhost:8000/redoc (ReDoc)

### Project Structure

```
├── backend/              # FastAPI backend
│   ├── main.py          # Main FastAPI application
│   ├── run.py           # Server startup script
│   └── requirements.txt # Python dependencies
├── client/              # React frontend
│   ├── components/      # React components
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utility functions
│   ├── pages/          # Page components
│   └── App.tsx         # Main app component
├── shared/             # Shared TypeScript types
├── data/               # Application data (gitignored)
├── venv/               # Python virtual environment (gitignored)
└── dist/               # Build output (gitignored)
```

## API Endpoints

All endpoints are prefixed with `/api/`:

### Health & Demo
- `GET /api/health` - Health check
- `GET /api/ping` - Ping endpoint
- `GET /api/demo` - Demo endpoint

### Tenant Management
- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create new tenant
- `GET /api/tenants/:name/config` - Get tenant configuration
- `POST /api/tenants/:name/config` - Update tenant configuration

### File Management
- `GET /api/files?tenant_name=X` - List audio files
- `GET /api/files/:baseName/vtt` - Get VTT transcription
- `GET /api/files/:baseName/json` - Get JSON transcription
- `GET /api/files/:baseName/audio` - Get audio file
- `POST /api/upload` - Upload audio files

## Configuration

### Environment Variables

See `.env.example` for all available configuration options:

- `VITE_PUBLIC_BUILDER_KEY` - Builder.io API key
- `PING_MESSAGE` - Custom ping message
- `API_HOST` - FastAPI server host (default: 0.0.0.0)
- `API_PORT` - FastAPI server port (default: 8000)
- `API_RELOAD` - Enable auto-reload (default: true)

### Multi-tenant Setup

Each tenant can have custom configuration:
- Source directory for audio files
- Destination directory for transcriptions
- API endpoint for processing
- Webhook URLs for notifications
- Scoring metrics

## Building for Production

```bash
# Build the frontend
pnpm build

# The output will be in dist/spa/
# Serve with FastAPI or any static file server
```

To run the production build:

```bash
# Start FastAPI with production settings
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

The FastAPI app will automatically serve the static frontend from `dist/spa/`.

## Troubleshooting

### Python virtual environment issues

If you encounter issues with the Python virtual environment:

```bash
# Remove the existing venv
rm -rf venv

# Re-run the setup
pnpm setup:python
```

### Port already in use

If port 8000 or 8080 is already in use:

```bash
# Change the port in .env
API_PORT=8001  # For backend
# or
# Use a different port when starting Vite
pnpm dev --port 8081
```

### Module not found errors

Make sure you've installed all dependencies:

```bash
# Node.js dependencies
pnpm install

# Python dependencies (with venv activated)
pip install -r backend/requirements.txt
```

## Features

- Multi-tenant architecture
- Audio file upload with drag-and-drop
- Transcription file management (VTT, JSON)
- Configurable webhooks and scoring metrics
- Auto-generated API documentation
- Dark mode support
- Responsive design

## License

Private project
