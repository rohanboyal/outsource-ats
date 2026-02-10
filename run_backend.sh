#!/bin/bash

echo "================================"
echo "  OutsourceATS Backend Server"
echo "================================"
echo ""

cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo ""
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo ""
echo "Installing/Updating dependencies..."
pip install -r requirements.txt

echo ""
echo "Starting server..."
echo "API will be available at: http://localhost:8000"
echo "API Docs will be available at: http://localhost:8000/docs"
echo ""
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
