# Owner/Admin API Documentation

This document describes the API endpoints for the owner/super admin panel to manage and verify companies.

## Base URL
```
http://localhost:3334/api/owner
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <admin_token>
```

## Endpoints

### 1. Owner/Admin Login
```
POST /login
```
**Body:**
```json
{
  "username": "superadmin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "admin_id",
      "username": "superadmin",
      "email": "admin@b2b-agent.com",
      "name": "Super Administrator",
      "role": "super_admin"
    }
  }
}
```

### 2. Setup Super Admin (One-time setup)
```
POST /setup-super-admin
```
**Body:**
```json
{
  "username": "superadmin",
  "email": "admin@b2b-agent.com",
  "password": "admin123",
  "name": "Super Administrator"
}
```

**Note:** This endpoint can only be used once to create the initial super admin.

### 3. Get Dashboard Statistics
```
GET /dashboard/stats
```
**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "totalCompanies": 25,
    "pendingCompanies": 8,
    "verifiedCompanies": 17,
    "totalEmployees": 150
  }
}
```

### 4. Get All Companies
```
GET /companies?status=pending&page=1&limit=10
```
**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `status` (optional): `pending` or `verified` or omit for all
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "Companies retrieved successfully",
  "data": {
    "companies": [
      {
        "_id": "company_id",
        "name": "ABC Travel Agency",
        "agencyName": "ABC Travel",
        "phone": "9876543210",
        "numPeople": 15,
        "companyNumber": 1001,
        "isActive": false,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCompanies": 25
    }
  }
}
```

### 5. Get Company Details
```
GET /companies/:companyId
```
**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Company details retrieved successfully",
  "data": {
    "company": {
      "_id": "company_id",
      "name": "ABC Travel Agency",
      "agencyName": "ABC Travel",
      "phone": "9876543210",
      "numPeople": 15,
      "companyNumber": 1001,
      "isActive": false,
      "gst": "gst_file_path",
      "docs": ["doc1_path", "doc2_path"],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "employeeCount": 5
  }
}
```

### 6. Verify/Reject Company
```
PUT /companies/:companyId/verify
```
**Headers:** `Authorization: Bearer <admin_token>`

**Body:**
```json
{
  "action": "verify"
}
```
or
```json
{
  "action": "reject"
}
```

**Response (for verify):**
```json
{
  "success": true,
  "message": "Company verified successfully",
  "data": {
    "company": {
      "_id": "company_id",
      "name": "ABC Travel Agency",
      "isActive": true,
      // ... other company fields
    }
  }
}
```

## Error Responses

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Access token required"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Company not found"
}
```

### Bad Request (400)
```json
{
  "success": false,
  "message": "Action must be either 'verify' or 'reject'"
}
```

## Setup Instructions

1. **Create Super Admin:**
   ```bash
   node setup-super-admin.js
   ```
   This will create the initial super admin with:
   - Username: `superadmin`
   - Password: `admin123`
   - Email: `admin@b2b-agent.com`

2. **Login to Admin Panel:**
   Use the login endpoint to get an admin token.

3. **Verify Companies:**
   - Get pending companies using `/companies?status=pending`
   - Review company details using `/companies/:companyId`
   - Verify companies using `/companies/:companyId/verify`

## Company Verification Flow

1. Companies register through the normal signup process
2. Companies are created with `isActive: false` by default
3. Admin reviews pending companies in the admin panel
4. Admin verifies companies by setting `isActive: true`
5. Verified companies can create employees and access hotel services
6. Unverified companies receive appropriate error messages

## Security Notes

- All admin endpoints require authentication
- Only users with `type: 'admin'` can access admin routes
- Company verification is a manual process requiring admin approval
- Unverified companies cannot create employees or access hotel services 