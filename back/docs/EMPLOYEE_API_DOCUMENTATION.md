# Employee Management API Documentation

This document describes the APIs for managing employee IDs that companies/agencies can create for their employees. Employee IDs are generated in the format: `username + company number` (e.g., "johndoe1001"). These employee IDs have limited access - only for hotel booking and viewing their own information, without dashboard access.

## Base URL
```
http://localhost:3334/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### 1. Employee Login
**POST** `/employees/login`

Allows employees to login with their phone and password.

**Request Body:**
```json
{
  "phone": "1234567890",
  "password": "employee_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Employee login successful",
  "data": {
    "token": "jwt_token_here",
            "employee": {
          "id": "employee_id",
          "phone": "1234567890",
          "name": "Employee Name",
          "role": "employee",
          "employeeId": "johndoe1001",
          "companyNumber": 1001,
          "employeeNumber": 1,
          "company": {
            "name": "Company Name",
            "agencyName": "Agency Name",
            "companyNumber": 1001
          }
        }
  }
}
```

### 2. Create Employee ID (Company Only)
**POST** `/employees/create`

Allows companies to create employee IDs for their employees.

**Headers:**
```
Authorization: Bearer <company_jwt_token>
```

**Request Body:**
```json
{
  "name": "Employee Name",
  "phone": "1234567890",
  "password": "employee_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Employee ID created successfully",
  "data": {
    "employee": {
      "id": "employee_id",
      "name": "Employee Name",
      "phone": "1234567890",
      "role": "employee",
      "employeeId": "johndoe1001",
      "companyNumber": 1001,
      "employeeNumber": 1
    }
  }
}
```

### 3. Get All Employees (Company Only)
**GET** `/employees/list`

Allows companies to view all their employees.

**Headers:**
```
Authorization: Bearer <company_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Employees retrieved successfully",
  "data": {
    "employees": [
      {
        "id": "employee_id_1",
        "name": "Employee 1",
        "phone": "1234567890",
        "role": "employee",
        "employeeId": "johndoe1001",
        "companyNumber": 1001,
        "employeeNumber": 1,
        "company": "company_id"
      },
      {
        "id": "employee_id_2",
        "name": "Employee 2",
        "phone": "0987654321",
        "role": "employee",
        "employeeId": "janesmith1001",
        "companyNumber": 1001,
        "employeeNumber": 2,
        "company": "company_id"
      }
    ]
  }
}
```

### 4. Get Specific Employee by MongoDB ID (Company Only)
**GET** `/employees/:employeeId`

Allows companies to view details of a specific employee using MongoDB ID.

### 5. Get Employee by Generated Employee ID (Company Only)
**GET** `/employees/id/:employeeId`

Allows companies to view details of a specific employee using the generated employee ID (username + company number).

**Example:** `GET /employees/id/johndoe1001`

**Headers:**
```
Authorization: Bearer <company_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Employee retrieved successfully",
  "data": {
    "employee": {
      "id": "employee_id",
      "name": "Employee Name",
      "phone": "1234567890",
      "role": "employee",
      "employeeId": "johndoe1001",
      "companyNumber": 1001,
      "employeeNumber": 1,
      "company": {
        "name": "Company Name",
        "agencyName": "Agency Name",
        "companyNumber": 1001
      }
    }
  }
}
```

### 6. Update Employee Password (Company Only)
**PUT** `/employees/:employeeId/password`

Allows companies to update an employee's password.

**Headers:**
```
Authorization: Bearer <company_jwt_token>
```

**Request Body:**
```json
{
  "password": "new_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Employee password updated successfully"
}
```

### 7. Delete Employee (Company Only)
**DELETE** `/employees/:employeeId`

Allows companies to delete an employee ID.

**Headers:**
```
Authorization: Bearer <company_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

### 8. Get Employee Profile (Employee Only)
**GET** `/employees/profile/me`

Allows employees to view their own profile information.

**Headers:**
```
Authorization: Bearer <employee_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "employee": {
      "id": "employee_id",
      "name": "Employee Name",
      "phone": "1234567890",
      "role": "employee",
      "employeeId": "johndoe1001",
      "companyNumber": 1001,
      "employeeNumber": 1,
      "company": {
        "name": "Company Name",
        "agencyName": "Agency Name",
        "companyNumber": 1001
      }
    }
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Error description"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Company role required."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Employee not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Usage Examples

### Company Workflow
1. **Company Login**: Use existing auth API to login as a company
2. **Create Employee**: Use `/employees/create` to create employee IDs
3. **Manage Employees**: Use list, get, update, and delete endpoints
4. **Share Credentials**: Give phone and password to employees

### Employee Workflow
1. **Employee Login**: Use `/employees/login` with provided credentials
2. **View Profile**: Use `/employees/profile/me` to see own information
3. **Hotel Booking**: Use existing hotel booking APIs (limited access)

## Employee ID Generation System

### Format
Employee IDs are generated in the format: `username + company number`

**Examples:**
- Company #1001 creates employee "John Doe" → Employee ID: `johndoe1001`
- Company #1002 creates employee "Jane Smith" → Employee ID: `janesmith1002`
- Company #1001 creates another employee "Mike Johnson" → Employee ID: `mikejohnson1001`

### Rules
1. **Username**: Employee's name converted to lowercase with spaces removed
2. **Company Number**: Unique number assigned to each company (starts from 1001)
3. **Uniqueness**: Each employee ID is unique across the system
4. **Sequential**: Employee numbers within a company are sequential (1, 2, 3, etc.)

### Company Number Assignment
- First company gets number 1001
- Subsequent companies get incrementing numbers (1002, 1003, etc.)
- Company numbers are permanent and cannot be changed

## Security Notes

- Employee tokens contain role information to restrict access
- Employees can only access their own profile and hotel booking features
- Companies can only manage their own employees
- All passwords are hashed using bcrypt
- JWT tokens expire after 7 days

## Integration with Existing APIs

Employees can use the existing hotel booking APIs but with restricted access:
- Can book hotels
- Can view their own bookings
- Cannot access dashboard features
- Cannot access company management features

The role-based access control ensures employees only have the necessary permissions for hotel booking operations. 