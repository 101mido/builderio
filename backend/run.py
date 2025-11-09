#!/usr/bin/env python3
"""
FastAPI server startup script
Run this to start the backend server
"""

import uvicorn
import os

if __name__ == "__main__":
    # Get configuration from environment or use defaults
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    reload = os.getenv("API_RELOAD", "true").lower() == "true"

    print(f"🚀 Starting FastAPI server on {host}:{port}")
    print(f"📚 API Documentation available at http://{host}:{port}/docs")
    print(f"🔄 Auto-reload: {reload}")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
