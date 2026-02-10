# Client Management API Testing Guide

## Setup

1. **Activate Conda Environment:**
```bash
conda activate ats
```

2. **Navigate to Backend:**
```bash
cd backend
```

3. **Start Server:**
```bash
uvicorn app.main:app --reload
```

4. **Access Swagger UI:**
Open: http://localhost:8000/docs

---

## Authentication First

Before testing client endpoints, you need to authenticate:

### 1. Register Admin User (if not done)
```
POST /api/v1/auth/register
```
Body:
```json
{
  "email": "admin@outsourceats.com",
  "password": "admin123456",
  "full_name": "Admin User",
  "role": "admin"
}
```

### 2. Login
```
POST /api/v1/auth/login
```
Body:
```json
{
  "email": "admin@outsourceats.com",
  "password": "admin123456"
}
```

### 3. Authorize
- Copy the `access_token` from login response
- Click green "Authorize" button in Swagger UI
- Enter: `Bearer YOUR_ACCESS_TOKEN`
- Click "Authorize" and "Close"

---

## Client Endpoints Testing

### 1. Create Client
```
POST /api/v1/clients
```

**Simple Client (No Contacts):**
```json
{
  "company_name": "Tech Solutions Inc",
  "industry": "Information Technology",
  "website": "https://techsolutions.com",
  "address": "123 Tech Street, San Francisco, CA 94105",
  "status": "active",
  "default_sla_days": 7
}
```

**Client with Contacts:**
```json
{
  "company_name": "Digital Innovations Ltd",
  "industry": "Digital Marketing",
  "website": "https://digitalinnovations.com",
  "address": "456 Innovation Ave, New York, NY 10001",
  "status": "prospect",
  "default_sla_days": 10,
  "contacts": [
    {
      "name": "John Smith",
      "email": "john.smith@digitalinnovations.com",
      "phone": "+1-555-0100",
      "designation": "HR Manager",
      "is_primary": true
    },
    {
      "name": "Sarah Johnson",
      "email": "sarah.j@digitalinnovations.com",
      "phone": "+1-555-0101",
      "designation": "Recruiter",
      "is_primary": false
    }
  ]
}
```

**Expected Response:**
- Status: 201 Created
- Returns client object with ID and timestamps
- Includes all contacts if provided

---

### 2. List Clients
```
GET /api/v1/clients
```

**Query Parameters:**
- `page` (default: 1) - Page number
- `page_size` (default: 20) - Items per page
- `search` - Search by company name or industry
- `status` - Filter by status (prospect/active/inactive)
- `account_manager_id` - Filter by account manager
- `include_deleted` - Include soft-deleted clients

**Examples:**

Basic list:
```
GET /api/v1/clients?page=1&page_size=10
```

Search:
```
GET /api/v1/clients?search=tech
```

Filter by status:
```
GET /api/v1/clients?status=active
```

**Expected Response:**
```json
{
  "clients": [...],
  "total": 25,
  "page": 1,
  "page_size": 10,
  "pages": 3
}
```

---

### 3. Get Client Details
```
GET /api/v1/clients/{client_id}
```

**Example:**
```
GET /api/v1/clients/1
```

**Expected Response:**
- Returns client with all details
- Includes contacts
- Includes statistics:
  - `total_pitches`
  - `total_jds`
  - `active_jds`
  - `total_applications`

---

### 4. Update Client
```
PUT /api/v1/clients/{client_id}
```

**Example - Update Status:**
```json
{
  "status": "active"
}
```

**Example - Full Update:**
```json
{
  "company_name": "Tech Solutions International",
  "industry": "IT Services",
  "website": "https://techsolutionsintl.com",
  "status": "active",
  "default_sla_days": 5
}
```

**Expected Response:**
- Returns updated client object

---

### 5. Delete Client
```
DELETE /api/v1/clients/{client_id}
```

**Soft Delete (Default):**
```
DELETE /api/v1/clients/1
```

**Hard Delete (Admin Only):**
```
DELETE /api/v1/clients/1?hard_delete=true
```

**Expected Response:**
- Status: 204 No Content

---

## Client Contact Endpoints

### 1. Add Contact to Client
```
POST /api/v1/clients/{client_id}/contacts
```

**Example:**
```json
{
  "name": "Michael Chen",
  "email": "michael.chen@company.com",
  "phone": "+1-555-0200",
  "designation": "VP of Engineering",
  "is_primary": false
}
```

**Expected Response:**
- Status: 201 Created
- Returns contact object with ID

---

### 2. List Client Contacts
```
GET /api/v1/clients/{client_id}/contacts
```

**Example:**
```
GET /api/v1/clients/1/contacts
```

**Expected Response:**
- Array of all contacts for the client

---

### 3. Update Contact
```
PUT /api/v1/clients/{client_id}/contacts/{contact_id}
```

**Example:**
```json
{
  "phone": "+1-555-0999",
  "designation": "Senior VP of Engineering",
  "is_primary": true
}
```

**Expected Response:**
- Returns updated contact object

---

### 4. Delete Contact
```
DELETE /api/v1/clients/{client_id}/contacts/{contact_id}
```

**Expected Response:**
- Status: 204 No Content

---

## Complete Testing Workflow

### Scenario: Onboard a New Client

**Step 1: Create Client**
```json
POST /api/v1/clients
{
  "company_name": "StartupXYZ",
  "industry": "SaaS",
  "website": "https://startupxyz.com",
  "status": "prospect",
  "default_sla_days": 7,
  "contacts": [
    {
      "name": "Alice Brown",
      "email": "alice@startupxyz.com",
      "phone": "+1-555-1000",
      "designation": "CEO",
      "is_primary": true
    }
  ]
}
```
Note the returned `client_id` (e.g., 5)

**Step 2: View Client Details**
```
GET /api/v1/clients/5
```

**Step 3: Add Another Contact**
```json
POST /api/v1/clients/5/contacts
{
  "name": "Bob Wilson",
  "email": "bob@startupxyz.com",
  "phone": "+1-555-1001",
  "designation": "CTO",
  "is_primary": false
}
```

**Step 4: Update Client Status to Active**
```json
PUT /api/v1/clients/5
{
  "status": "active"
}
```

**Step 5: List All Active Clients**
```
GET /api/v1/clients?status=active
```

---

## Testing Permissions

### Test Different User Roles

**Create a Recruiter User:**
```json
POST /api/v1/auth/register
{
  "email": "recruiter@outsourceats.com",
  "password": "recruiter123",
  "full_name": "Recruiter User",
  "role": "recruiter"
}
```

**Login as Recruiter:**
```json
POST /api/v1/auth/login
{
  "email": "recruiter@outsourceats.com",
  "password": "recruiter123"
}
```

**Try to Create Client (Should Fail):**
```
POST /api/v1/clients
```
Expected: 403 Forbidden (Recruiters can't create clients)

**Try to View Clients (Should Work):**
```
GET /api/v1/clients
```
Expected: 200 OK (Recruiters can view clients)

---

## Error Scenarios to Test

### 1. Client Not Found
```
GET /api/v1/clients/99999
```
Expected: 404 Not Found

### 2. Invalid Client ID
```
GET /api/v1/clients/abc
```
Expected: 422 Validation Error

### 3. Missing Required Fields
```json
POST /api/v1/clients
{
  "industry": "Tech"
}
```
Expected: 422 Validation Error (missing company_name)

### 4. Duplicate Primary Contact
When adding/updating contacts, if you set `is_primary: true`, the system automatically unsets other primary contacts.

### 5. Update Deleted Client
Delete a client, then try to update it:
```
DELETE /api/v1/clients/1
PUT /api/v1/clients/1
```
Expected: 400 Bad Request

---

## Using curl (Alternative to Swagger)

**Create Client:**
```bash
curl -X POST "http://localhost:8000/api/v1/clients" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Company",
    "industry": "Testing",
    "status": "prospect"
  }'
```

**List Clients:**
```bash
curl -X GET "http://localhost:8000/api/v1/clients?page=1&page_size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Client:**
```bash
curl -X GET "http://localhost:8000/api/v1/clients/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Verification Checklist

After testing, verify:

- ✅ Can create client without contacts
- ✅ Can create client with contacts
- ✅ Can list clients with pagination
- ✅ Can search clients by name/industry
- ✅ Can filter clients by status
- ✅ Can get client details with statistics
- ✅ Can update client information
- ✅ Can soft delete client
- ✅ Can add contacts to existing client
- ✅ Can list client contacts
- ✅ Can update contact information
- ✅ Can delete contact
- ✅ Primary contact handling works correctly
- ✅ Permissions work (admin can create, recruiter cannot)
- ✅ Error handling works (404, 403, 422)

---

## Database Verification

Check data in MySQL:

```sql
-- View all clients
SELECT * FROM clients;

-- View all contacts
SELECT * FROM client_contacts;

-- View clients with contacts
SELECT c.company_name, cc.name as contact_name, cc.is_primary
FROM clients c
LEFT JOIN client_contacts cc ON c.id = cc.client_id;
```

---

**All endpoints are ready to test! Start with Swagger UI for easiest testing.** 🚀
