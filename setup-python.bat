@echo off
REM Setup script for Python backend environment (Windows)

echo Setting up Python backend environment...

REM Check if Python 3 is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python 3.9 or higher.
    exit /b 1
)

echo Found Python
python --version

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created
) else (
    echo Virtual environment already exists
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo Installing dependencies...
pip install -r backend\requirements.txt

echo.
echo Setup complete!
echo.
echo To start the FastAPI server:
echo   1. Activate the virtual environment: venv\Scripts\activate.bat
echo   2. Run the server: python backend\run.py
echo.
echo Or use: pnpm dev:api
