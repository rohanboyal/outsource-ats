# OutsourceATS - Quick Start Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (v24.0+) and **Docker Compose** (v2.20+)
- **Git**

OR if running locally without Docker:

- **Python** 3.11+
- **Node.js** 20+
- **MySQL** 8.0+
- **Redis** 7+

---

## Quick Start with Docker (Recommended)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd outsource-ats
```

### 2. Set Up Environment Variables

**Backend:**
```bash
cd backend
cp .env.example .env
```

Edit `.env` and update the following (especially in production):
- `SECRET_KEY` - Generate a secure 32+ character key
- `DATABASE_URL` - Already configured for Docker
- `REDIS_URL` - Already configured for Docker

**Frontend:**
```bash
cd ../frontend
# Create .env file (will be created when we set up frontend)
```

### 3. Start All Services

From the root directory:

```bash
docker-compose up --build
```

This will start:
- MySQL database (port 3306)
- Redis (port 6379)
- Backend API (port 8000)
- Frontend app (port 5173)
- Celery worker

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

### 5. Create Initial Admin User

There are two ways to create the first admin user:

**Option A: Via API (after backend is running)**

Using curl:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@outsourceats.com",
    "password": "admin123456",
    "full_name": "Admin User",
    "role": "admin"
  }'
```

Or using the Swagger UI at http://localhost:8000/docs:
1. Navigate to `/api/v1/auth/register`
2. Click "Try it out"
3. Enter admin details
4. Execute

**Option B: Via Database (direct)**

```bash
docker exec -it outsource_ats_mysql mysql -u ats_user -pats_password_change_in_production outsource_ats_db

# Then run SQL to create admin user
# (Password will need to be hashed - use the register endpoint instead)
```

### 6. Test the Setup

**Login:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@outsourceats.com",
    "password": "admin123456"
  }'
```

You should receive an access token and refresh token.

---

## Local Development (Without Docker)

### 1. Set Up MySQL Database

```bash
mysql -u root -p

CREATE DATABASE outsource_ats_db;
CREATE USER 'ats_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON outsource_ats_db.* TO 'ats_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Set Up Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Set Up Frontend (Coming Soon)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## Database Migrations

### Initialize Alembic (First Time)

```bash
cd backend

# Initialize Alembic
alembic init alembic

# Create first migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

### Creating New Migrations

After making changes to models:

```bash
# Generate migration
alembic revision --autogenerate -m "Description of changes"

# Apply migration
alembic upgrade head
```

### Rollback Migrations

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>

# Rollback all
alembic downgrade base
```

---

## Common Commands

### Docker Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Rebuild containers
docker-compose up --build

# Remove all containers and volumes
docker-compose down -v
```

### Backend Commands

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=app tests/

# Format code
black app/

# Lint code
flake8 app/

# Type checking
mypy app/
```

### Database Commands

```bash
# Access MySQL container
docker exec -it outsource_ats_mysql mysql -u ats_user -pats_password_change_in_production outsource_ats_db

# Backup database
docker exec outsource_ats_mysql mysqldump -u ats_user -pats_password_change_in_production outsource_ats_db > backup.sql

# Restore database
docker exec -i outsource_ats_mysql mysql -u ats_user -pats_password_change_in_production outsource_ats_db < backup.sql

# Access Redis
docker exec -it outsource_ats_redis redis-cli
```

---

## API Testing

### Using Swagger UI

1. Navigate to http://localhost:8000/docs
2. Click on any endpoint to expand
3. Click "Try it out"
4. Fill in parameters
5. Click "Execute"

### Using curl

**Register a user:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "role": "recruiter"
  }'
```

**Login:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Get current user (requires token):**
```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Troubleshooting

### Port Already in Use

If ports 3306, 6379, 8000, or 5173 are already in use:

1. Stop the conflicting service
2. OR change the port in `docker-compose.yml`:
   ```yaml
   ports:
     - "3307:3306"  # Changed from 3306:3306
   ```

### Database Connection Issues

1. Check if MySQL container is running:
   ```bash
   docker ps | grep mysql
   ```

2. Check MySQL logs:
   ```bash
   docker-compose logs mysql
   ```

3. Verify DATABASE_URL in `.env` matches docker-compose.yml

### Permission Denied Errors

On Linux/macOS, you may need to:
```bash
sudo chmod -R 755 backend/
sudo chmod -R 755 frontend/
```

### Hot Reload Not Working

1. Check if volumes are mounted correctly in docker-compose.yml
2. Try rebuilding containers:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

---

## Project Structure

```
outsource-ats/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core config, security
│   │   ├── db/           # Database config
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic
│   ├── tests/            # Backend tests
│   └── requirements.txt
├── frontend/             # React frontend (coming soon)
├── docker/               # Docker files
├── docker-compose.yml    # Docker Compose config
└── README.md
```

---

## Next Steps

### Current Status (Completed):
✅ Backend foundation with authentication
✅ Database models for all entities
✅ Docker setup
✅ API documentation

### Coming Next:
1. **Frontend Setup** - React + Vite + Tailwind
2. **Client Management Endpoints** - CRUD operations
3. **Candidate Management Endpoints** - With resume upload
4. **JD Management Endpoints** - Job descriptions
5. **Application Pipeline** - Status tracking

---

## Development Workflow

1. **Create a new feature:**
   ```bash
   git checkout -b feature/feature-name
   ```

2. **Make changes to models:**
   - Update models in `backend/app/models/`
   - Create migration: `alembic revision --autogenerate -m "description"`
   - Apply migration: `alembic upgrade head`

3. **Create API endpoints:**
   - Add endpoint in `backend/app/api/v1/endpoints/`
   - Create schemas in `backend/app/schemas/`
   - Update router in `backend/app/api/v1/router.py`

4. **Test your changes:**
   - Use Swagger UI at http://localhost:8000/docs
   - Write unit tests in `backend/tests/`
   - Run tests: `pytest`

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add feature description"
   git push origin feature/feature-name
   ```

---

## Support & Resources

- **API Documentation**: http://localhost:8000/docs
- **Technical Architecture**: See `TECHNICAL_ARCHITECTURE.md`
- **Progress Tracker**: See `PROGRESS_TRACKER.md`
- **PRD Document**: See uploaded PRD

---

## Security Notes

⚠️ **Important for Production:**

1. Change all default passwords in `.env`
2. Use strong SECRET_KEY (32+ characters)
3. Enable HTTPS
4. Set DEBUG=false
5. Use environment-specific configurations
6. Enable database backups
7. Implement rate limiting
8. Add logging and monitoring
9. Regular security updates

---

**Happy Coding! 🚀**
