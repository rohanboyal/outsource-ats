#!/bin/bash

echo "========================================"
echo "  OutsourceATS - Initial Setup"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"
echo ""

# Navigate to backend
cd backend

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv
echo "✅ Virtual environment created"
echo ""

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Check .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please update the .env file with your database credentials!"
    echo ""
else
    echo "✅ .env file found"
    echo ""
fi

# Database migrations
echo "🗄️  Setting up database..."
echo ""
echo "Please ensure:"
echo "1. MySQL is running"
echo "2. Database 'outsource_ats_db' is created"
echo "3. User 'ats_user' has permissions"
echo ""
read -p "Press Enter when database is ready..."

echo ""
echo "Creating initial migration..."
alembic revision --autogenerate -m "Initial database schema"

echo ""
echo "Applying migrations..."
alembic upgrade head

echo ""
echo "========================================"
echo "  ✅ Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Start the server: ./run_backend.sh"
echo "2. Open http://localhost:8000/docs"
echo "3. Register admin user via /api/v1/auth/register"
echo "4. Login and start developing!"
echo ""
echo "For detailed instructions, see LOCAL_SETUP.md"
echo ""
