# 🚀 Getting Started - OutsourceATS

Welcome! This guide will get you up and running with OutsourceATS in just a few minutes.

---

## 📋 What You'll Need

- **Python 3.11+** - [Download here](https://www.python.org/downloads/)
- **MySQL 8.0+** - [Download here](https://dev.mysql.com/downloads/) OR use XAMPP/WAMP
- **Code Editor** - VS Code, PyCharm, or any editor you prefer
- **10 minutes** ⏱️

---

## ⚡ Quick Start (Choose Your Path)

### 🪟 Windows Users

```cmd
# 1. Setup (first time only)
setup.bat

# 2. Run the server
run_backend.bat
```

### 🍎 macOS/Linux Users

```bash
# 1. Setup (first time only)
./setup.sh

# 2. Run the server
./run_backend.sh
```

**That's it!** 🎉 Your API is now running at http://localhost:8000

---

## 📖 Detailed Setup (Step-by-Step)

### Step 1: Setup MySQL Database

**Option A: Command Line**

```bash
# Login to MySQL
mysql -u root -p

# Run these commands:
CREATE DATABASE outsource_ats_db;
CREATE USER 'ats_user'@'localhost' IDENTIFIED BY 'ats_password';
GRANT ALL PRIVILEGES ON outsource_ats_db.* TO 'ats_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Option B: Using phpMyAdmin (XAMPP/WAMP)**

1. Open http://localhost/phpmyadmin
2. Click "New" → Database name: `outsource_ats_db` → Create
3. Go to "User accounts" → "Add user account"
4. Username: `ats_user`, Password: `ats_password`, Host: `localhost`
5. Check "Grant all privileges on database outsource_ats_db"
6. Click "Go"

✅ **Database is ready!**

---

### Step 2: Install Backend

**Navigate to project:**
```bash
cd outsource-ats/backend
```

**Create virtual environment:**

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Verify .env file:**

The `.env` file should already exist. Open it and verify the database credentials:

```env
DATABASE_URL=mysql+pymysql://ats_user:ats_password@localhost:3306/outsource_ats_db
SECRET_KEY=outsource-ats-secret-key-change-this-in-production-min-32-chars
```

✅ **Backend is ready!**

---

### Step 3: Setup Database Tables

**Create initial migration:**
```bash
alembic revision --autogenerate -m "Initial database schema"
```

**Apply migration:**
```bash
alembic upgrade head
```

You should see:
```
INFO  [alembic.runtime.migration] Running upgrade  -> xxxxx, Initial database schema
```

✅ **Database tables created!**

---

### Step 4: Start the Server

```bash
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

✅ **Server is running!**

---

### Step 5: Test the Setup

**Open your browser:**
- API Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

**You should see the Swagger UI with all available endpoints!**

---

## 🎯 Create Your First Admin User

### Method 1: Using Swagger UI (Easiest)

1. Open http://localhost:8000/docs
2. Find `POST /api/v1/auth/register`
3. Click "Try it out"
4. Enter this data:

```json
{
  "email": "admin@outsourceats.com",
  "password": "admin123456",
  "full_name": "Admin User",
  "role": "admin"
}
```

5. Click "Execute"
6. You should see a 201 response with user details

### Method 2: Using curl

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@outsourceats.com","password":"admin123456","full_name":"Admin User","role":"admin"}'
```

✅ **Admin user created!**

---

## 🔐 Login and Get Token

### Using Swagger UI:

1. Go to `POST /api/v1/auth/login`
2. Click "Try it out"
3. Enter:

```json
{
  "email": "admin@outsourceats.com",
  "password": "admin123456"
}
```

4. Click "Execute"
5. **Copy the `access_token`** from response

### Using curl:

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@outsourceats.com","password":"admin123456"}'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

## 🔓 Authorize API Requests

### In Swagger UI:

1. Click the green **"Authorize"** button (top right)
2. Enter: `Bearer YOUR_ACCESS_TOKEN` (include the word "Bearer")
3. Click "Authorize"
4. Click "Close"

**Now all protected endpoints will work!**

### Test it:

1. Go to `GET /api/v1/auth/me`
2. Click "Try it out"
3. Click "Execute"
4. You should see your user details!

---

## 📁 Project Structure

```
outsource-ats/
├── backend/              # FastAPI Backend
│   ├── alembic/         # Database migrations
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Configuration, security
│   │   ├── db/          # Database setup
│   │   ├── models/      # Database models (11 models)
│   │   └── schemas/     # Request/Response schemas
│   ├── .env             # Environment variables
│   └── requirements.txt # Dependencies
├── setup.sh / .bat      # Initial setup script
├── run_backend.sh / .bat # Start server script
├── LOCAL_SETUP.md       # Detailed setup guide
└── README.md            # Project overview
```

---

## 🎓 Understanding the System

### User Roles

The system has 6 user roles with different permissions:

| Role | Purpose |
|------|---------|
| **admin** | Full system access |
| **recruiter** | Manage candidates & applications |
| **account_manager** | Manage clients & job descriptions |
| **bd_sales** | Business development & pitches |
| **finance** | Contracts & invoicing |
| **client** | Limited view access |

### Database Models (What's Already Built)

1. **User** - System users with roles
2. **Client** - Company/client profiles
3. **ClientContact** - Client contact persons
4. **Pitch** - Business development pitches
5. **JobDescription** - Job postings
6. **Candidate** - Candidate profiles
7. **Application** - Candidate applications (pipeline tracking)
8. **ApplicationStatusHistory** - Audit trail
9. **Interview** - Interview scheduling
10. **Offer** - Job offers
11. **Joining** - Onboarding tracking

### API Endpoints Currently Available

- ✅ `POST /api/v1/auth/register` - Create new user
- ✅ `POST /api/v1/auth/login` - Login
- ✅ `POST /api/v1/auth/refresh` - Refresh token
- ✅ `GET /api/v1/auth/me` - Get current user
- ✅ `POST /api/v1/auth/logout` - Logout
- ✅ `GET /` - Root/health check
- ✅ `GET /health` - Health status

**More endpoints coming soon!**

---

## 🛠️ Daily Development Workflow

### 1. Start Working

```bash
cd outsource-ats/backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload
```

### 2. Make Changes

- Edit files in `app/` directory
- Server automatically reloads on file changes

### 3. Add New Models

```bash
# After adding/modifying models in app/models/
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### 4. Test Changes

- Use Swagger UI: http://localhost:8000/docs
- Make API calls
- Verify responses

### 5. Stop Server

Press `Ctrl+C` in terminal

---

## 🐛 Troubleshooting

### Can't connect to database?

**Check:**
1. MySQL is running
2. Database exists: `SHOW DATABASES;`
3. User has permissions: `SHOW GRANTS FOR 'ats_user'@'localhost';`
4. Credentials in `.env` match

### Port 8000 already in use?

```bash
# Use different port
uvicorn app.main:app --reload --port 8001
```

### Virtual environment issues?

```bash
# Delete and recreate
rm -rf venv  # or rmdir /s venv on Windows
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Migration errors?

```bash
# Check current version
alembic current

# View history
alembic history

# Stamp to specific version
alembic stamp head
```

### Import errors?

```bash
# Ensure venv is activated
# Reinstall dependencies
pip install -r requirements.txt
```

---

## 📚 What's Next?

Now that you're set up, here's what to build next:

### Phase 1: CRUD Endpoints (Current)
- [ ] Client management endpoints
- [ ] Candidate management endpoints
- [ ] Job Description endpoints
- [ ] Application pipeline endpoints

### Phase 2: Advanced Features
- [ ] File upload (resume parsing)
- [ ] Search and filters
- [ ] SLA tracking
- [ ] Notifications

### Phase 3: Frontend
- [ ] React application setup
- [ ] Login page
- [ ] Dashboard
- [ ] CRUD interfaces

---

## 💡 Tips & Best Practices

### 1. Always use virtual environment
```bash
source venv/bin/activate  # Activate before working
```

### 2. Keep migrations in sync
```bash
# After model changes
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

### 3. Use Swagger UI for testing
- Faster than Postman
- Auto-generated
- Always up-to-date

### 4. Check logs
- Terminal shows all requests
- Useful for debugging
- Shows SQL queries in debug mode

### 5. Read the docs
- `LOCAL_SETUP.md` - Detailed setup
- `README.md` - Project overview
- `TECHNICAL_ARCHITECTURE.md` - Architecture details

---

## 🎉 You're All Set!

Your OutsourceATS backend is now running and ready for development!

**Current Status:**
- ✅ Database created and migrated
- ✅ Authentication working
- ✅ API documented and testable
- ✅ Development environment ready

**Quick Links:**
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- Project Repo: [Your repository]

**Need Help?**
- Check `LOCAL_SETUP.md` for detailed instructions
- Review API docs at `/docs`
- Check troubleshooting section above

---

**Happy Coding! 🚀**

Start building amazing features for your staff outsourcing business!
