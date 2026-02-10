@echo off
echo ========================================
echo   OutsourceATS - Initial Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo X Python is not installed. Please install Python 3.11 or higher.
    pause
    exit /b 1
)

echo + Python found
echo.

REM Navigate to backend
cd backend

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv
echo + Virtual environment created
echo.

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate
echo + Virtual environment activated
echo.

REM Install dependencies
echo Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
echo + Dependencies installed
echo.

REM Check .env file
if not exist ".env" (
    echo ! .env file not found. Creating from .env.example...
    copy .env.example .env
    echo + .env file created
    echo.
    echo ! IMPORTANT: Please update the .env file with your database credentials!
    echo.
) else (
    echo + .env file found
    echo.
)

REM Database migrations
echo Setting up database...
echo.
echo Please ensure:
echo 1. MySQL is running
echo 2. Database 'outsource_ats_db' is created
echo 3. User 'ats_user' has permissions
echo.
pause

echo.
echo Creating initial migration...
alembic revision --autogenerate -m "Initial database schema"

echo.
echo Applying migrations...
alembic upgrade head

echo.
echo ========================================
echo   + Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start the server: run_backend.bat
echo 2. Open http://localhost:8000/docs
echo 3. Register admin user via /api/v1/auth/register
echo 4. Login and start developing!
echo.
echo For detailed instructions, see LOCAL_SETUP.md
echo.
pause
