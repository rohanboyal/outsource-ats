# Local Development Setup Guide

## Prerequisites

1. **Python 3.11+**
   - Download from https://www.python.org/downloads/
   - Verify: `python --version`

2. **MySQL 8.0+**
   - Download from https://dev.mysql.com/downloads/mysql/
   - OR use XAMPP/WAMP/MAMP

3. **Git**
   - Download from https://git-scm.com/downloads/

---

## Step-by-Step Setup

### 1. Database Setup

**Option A: Using MySQL Command Line**

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE outsource_ats_db;

# Create user
CREATE USER 'ats_user'@'localhost' IDENTIFIED BY 'ats_password';

# Grant permissions
GRANT ALL PRIVILEGES ON outsource_ats_db.* TO 'ats_user'@'localhost';

# Flush privileges
FLUSH PRIVILEGES;

# Exit
EXIT;
```

**Option B: Using phpMyAdmin (XAMPP/WAMP)**

1. Open http://localhost/phpmyadmin
2. Click "New" to create database
3. Database name: `outsource_ats_db`
4. Collation: `utf8mb4_general_ci`
5. Click "Create"

For user creation:
1. Go to "User accounts"
2. Click "Add user account"
3. Username: `ats_user`
4. Host: `localhost`
5. Password: `ats_password`
6. Check "Grant all privileges on database outsource_ats_db"
7. Click "Go"

---

### 2. Backend Setup

```bash
# Navigate to project directory
cd outsource-ats/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify .env file exists and has correct database credentials
# The file is already created with default values
```

---

### 3. Database Migrations

```bash
# Still in backend directory with venv activated

# Create initial migration
alembic revision --autogenerate -m "Initial database schema"

# Apply migrations
alembic upgrade head
```

You should see output like:
```
INFO  [alembic.runtime.migration] Running upgrade  -> xxxxx, Initial database schema
```

---

### 4. Create First Admin User

**Start the backend server:**

```bash
# Make sure you're in backend directory with venv activated
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Open another terminal and create admin user:**

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@outsourceats.com\",\"password\":\"admin123456\",\"full_name\":\"Admin User\",\"role\":\"admin\"}"
```

Or use the Swagger UI:
1. Open http://localhost:8000/docs
2. Navigate to POST `/api/v1/auth/register`
3. Click "Try it out"
4. Enter:
   ```json
   {
     "email": "admin@outsourceats.com",
     "password": "admin123456",
     "full_name": "Admin User",
     "role": "admin"
   }
   ```
5. Click "Execute"

---

### 5. Test the Setup

**Login to get token:**

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@outsourceats.com\",\"password\":\"admin123456\"}"
```

Response should contain:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

**Get current user info:**

```bash
# Replace YOUR_TOKEN with the access_token from above
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Alternative: Using Swagger UI for Testing

1. **Start backend**: `uvicorn app.main:app --reload`
2. **Open browser**: http://localhost:8000/docs
3. **Register user**: Use POST `/api/v1/auth/register`
4. **Login**: Use POST `/api/v1/auth/login`
5. **Copy token**: From login response
6. **Authorize**: Click green "Authorize" button at top right
7. **Enter**: `Bearer YOUR_TOKEN` (include the word "Bearer")
8. **Test endpoints**: Now all protected endpoints will work

---

## Project Structure

```
backend/
├── alembic/              # Database migrations
│   ├── versions/         # Migration files (auto-generated)
│   ├── env.py           # Alembic environment
│   └── script.py.mako   # Migration template
├── app/
│   ├── api/             # API routes
│   ├── core/            # Core config, security
│   ├── db/              # Database setup
│   ├── models/          # Database models
│   └── schemas/         # Pydantic schemas
├── alembic.ini          # Alembic config
├── .env                 # Environment variables
└── requirements.txt     # Python dependencies
```

---

## Common Commands

### Start Backend Server

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload
```

Access:
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Database Migrations

```bash
# Create new migration after model changes
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# View migration history
alembic history

# View current version
alembic current
```

### Virtual Environment

```bash
# Activate
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Deactivate
deactivate

# Install new package
pip install package_name

# Update requirements.txt
pip freeze > requirements.txt
```

---

## Troubleshooting

### MySQL Connection Error

**Error**: `Can't connect to MySQL server`

**Solutions**:
1. Ensure MySQL service is running
2. Check credentials in `.env` file
3. Verify database exists: `SHOW DATABASES;` in MySQL
4. Check MySQL port (default: 3306)

### ImportError or ModuleNotFoundError

**Solution**:
```bash
# Ensure virtual environment is activated
# Reinstall dependencies
pip install -r requirements.txt
```

### Alembic Migration Errors

**Error**: `Target database is not up to date`

**Solution**:
```bash
# Check current version
alembic current

# Check history
alembic history

# Force to specific version
alembic stamp head
```

### Port 8000 Already in Use

**Solution**:
```bash
# Use different port
uvicorn app.main:app --reload --port 8001

# Or kill process using port 8000
# Windows: netstat -ano | findstr :8000
# Linux/Mac: lsof -i :8000
```

---

## Environment Variables

Edit `.env` file to customize:

```env
# Database - update with your credentials
DATABASE_URL=mysql+pymysql://your_user:your_password@localhost:3306/your_db

# Security - change in production
SECRET_KEY=your-secret-key-min-32-characters-long

# Token expiry
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Environment
ENVIRONMENT=development
DEBUG=true
```

---

## Database Management

### View Database Structure

```bash
mysql -u ats_user -p outsource_ats_db

# Show all tables
SHOW TABLES;

# Describe a table
DESCRIBE users;
DESCRIBE clients;

# View data
SELECT * FROM users;
SELECT * FROM clients;
```

### Backup Database

```bash
# Export database
mysqldump -u ats_user -p outsource_ats_db > backup_$(date +%Y%m%d).sql

# Import database
mysql -u ats_user -p outsource_ats_db < backup_20260210.sql
```

---

## Next Steps

After setup is complete:

1. ✅ Backend is running
2. ✅ Database is created and migrated
3. ✅ Admin user is created
4. ✅ Can login and get tokens

**Ready for development!**

Next features to implement:
- Client management endpoints
- Candidate management endpoints
- Job description endpoints
- Application pipeline
- Frontend React app

---

## Development Workflow

1. **Create feature branch**: `git checkout -b feature/feature-name`
2. **Make changes**: Update models, add endpoints, etc.
3. **Create migration**: `alembic revision --autogenerate -m "description"`
4. **Apply migration**: `alembic upgrade head`
5. **Test**: Use Swagger UI at http://localhost:8000/docs
6. **Commit**: `git commit -m "Add feature"`

---

**Happy Development! 🚀**

Need help? Check:
- API Docs: http://localhost:8000/docs
- Main README.md
- TECHNICAL_ARCHITECTURE.md
