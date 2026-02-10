@echo off
echo ================================
echo   OutsourceATS Backend Server
echo ================================
echo.

cd backend

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

echo Activating virtual environment...
call venv\Scripts\activate

echo.
echo Installing/Updating dependencies...
pip install -r requirements.txt

echo.
echo Starting server...
echo API will be available at: http://localhost:8000
echo API Docs will be available at: http://localhost:8000/docs
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
