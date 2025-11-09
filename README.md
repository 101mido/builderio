# Fusion Starter

A modern, full-stack audio processing application with multi-tenant architecture.

## Overview

Fusion Starter is a web application designed for audio file upload, processing, and transcription management. Built with React and FastAPI, it provides a scalable solution for managing audio workflows across multiple tenants.

## Tech Stack

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS 3 + Radix UI (shadcn/ui)
- **State Management**: TanStack React Query
- **Routing**: React Router 6

### Backend

- **Framework**: FastAPI
- **Server**: Uvicorn with auto-reload
- **Validation**: Pydantic
- **Storage**: File-based JSON

## Prerequisites

- Node.js 18+ and pnpm 10.14.0+
- Python 3.9+ (Python 3.11 recommended)
- Git

## Getting Started

### 1. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Setup Python environment
pnpm setup:python
```

On Windows, the Python setup script will run automatically. On Linux/Mac, you may need to make it executable first:

```bash
chmod +x setup-python.sh
bash setup-python.sh
```

### 2. Environment Configuration

Copy the example environment file and configure as needed:

```bash
cp .env.example .env
```

Key environment variables:

- `API_PORT` - Backend API port (default: 8000)
- `API_HOST` - Backend host (default: 0.0.0.0)
- `PING_MESSAGE` - Custom ping response message
- `VITE_PUBLIC_BUILDER_KEY` - Builder.io API key (optional)

### 3. Start Development Servers

**Option A: Run both servers separately (recommended for development)**

Terminal 1 - Backend:

```bash
source venv/bin/activate  # On Windows: venv\Scripts\activate
pnpm dev:api
```

Terminal 2 - Frontend:

```bash
pnpm dev
```

**Option B: Run frontend only (requires backend already built)**

```bash
pnpm build     # Build once
pnpm dev       # Frontend will proxy to backend
```

### 4. Access the Application

- **Frontend**: http://localhost:8080
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **API Alternative Docs**: http://localhost:8000/redoc

## Project Structure

```
fusion-starter/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application & routes
│   ├── run.py              # Development server script
│   └── requirements.txt    # Python dependencies
│
├── client/                  # React frontend
│   ├── components/         # React components
│   │   └── ui/            # Radix UI components (49 components)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── pages/             # Page components
│   └── App.tsx            # Application entry point
│
├── shared/                 # Shared TypeScript types
│   └── api.ts             # API interfaces
│
├── public/                # Static assets
├── venv/                  # Python virtual environment (gitignored)
├── data/                  # Application data (gitignored)
│   ├── tenants.json       # Tenant information
│   └── configs.json       # Tenant configurations
│
└── dist/                  # Build output (gitignored)
    └── spa/               # Production frontend build
```

## API Endpoints

All endpoints are prefixed with `/api`:

### Health & Status

- `GET /api/health` - Health check
- `GET /api/ping` - Ping endpoint with custom message
- `GET /api/demo` - Demo endpoint

### Tenant Management

- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create a new tenant
  ```json
  { "name": "tenant_name" }
  ```
- `GET /api/tenants/{name}/config` - Get tenant configuration
- `POST /api/tenants/{name}/config` - Update tenant configuration

### File Operations

- `GET /api/files?tenant_name={name}` - List audio files for tenant
- `GET /api/files/{baseName}/vtt` - Download VTT transcription
- `GET /api/files/{baseName}/json` - Download JSON transcription
- `GET /api/files/{baseName}/audio` - Download audio file
- `POST /api/upload` - Upload audio files (multipart/form-data)

## Features

### Multi-Tenant Architecture

- Isolated configurations per tenant
- Custom source/destination directories
- Individual webhook configurations
- Per-tenant scoring metrics

### Audio File Management

- Drag-and-drop file upload
- Support for WAV, MP3, M4A, FLAC formats
- Automatic transcription status tracking
- File size limit: 500MB

### Transcription Support

- VTT format for video players
- JSON format for programmatic access
- Automatic file association

### Developer Experience

- Auto-generated API documentation
- Hot reload in development
- TypeScript type safety
- Modern React patterns with hooks

## Development Scripts

```bash
pnpm dev           # Start Vite dev server (port 8080)
pnpm dev:api       # Start FastAPI server (port 8000)
pnpm setup:python  # Setup Python virtual environment
pnpm build         # Build for production
pnpm preview       # Preview production build
pnpm test          # Run tests
pnpm typecheck     # TypeScript type checking
pnpm format.fix    # Format code with Prettier
```

## Building for Production

```bash
# Build the frontend
pnpm build

# Start the production server
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

The FastAPI server will automatically serve the built frontend from `dist/spa/`.

## Configuration

### Tenant Configuration Schema

Each tenant can be configured with:

```typescript
{
  source: string; // Audio source directory
  destination: string; // Transcription output directory
  api_endpoint: string; // Processing API URL
  webhooks: Array<{
    // Webhook notifications
    index: number;
    url: string;
  }>;
  metrics: Array<{
    // Scoring metrics
    call_type: string;
    rating_type: number;
    metrics: Array<{
      title: string;
      description: string;
    }>;
  }>;
}
```

## Troubleshooting

### Port Already in Use

If ports 8000 or 8080 are occupied:

```bash
# Change backend port
API_PORT=8001 pnpm dev:api

# Change frontend port
pnpm dev --port 8081
```

### Python Virtual Environment Issues

```bash
# Remove and recreate
rm -rf venv
pnpm setup:python
```

### Module Not Found Errors

```bash
# Reinstall dependencies
pnpm install
pip install -r backend/requirements.txt
```

## Technology Highlights

- **Vite**: Lightning-fast development with HMR
- **FastAPI**: Modern Python web framework with automatic OpenAPI docs
- **Pydantic**: Data validation using Python type annotations
- **Radix UI**: Accessible, unstyled component primitives
- **TailwindCSS**: Utility-first CSS framework
- **React Query**: Powerful data synchronization for React

## License

Private

## Contributing

This is a private project. For questions or issues, contact the maintainer.
