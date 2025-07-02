# Company-Employee API Documentation

## Overview

This API implements a new company-employee approach where:
- Companies register and manage their business operations
- Companies can add, manage, and deactivate employees
- Employees have limited access (only hotel-related operations)
- Companies have full access to all routes including employee management

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## User Roles

### Company
- Full access to all routes
- Can manage employees
- Can access business dashboard and analytics
- Can perform hotel operations

### Employee
- Limited access (only hotel controller routes)
- Must be associated with a company
- Cannot access employee management or business analytics

## API Endpoints

### Authentication Routes

#### 1. Send OTP for Company Registration
```
POST /auth/send-otp
```
**Body:**
```json
{
  "phone": "1234567890"
}
```

#### 2. Verify OTP
```
POST /auth/verify-otp
```
**Body:**
```json
{
  "phone": "1234567890",
  "otp": "111111"
}
```

#### 3. Complete Company Registration
```
POST /auth/complete-signup
```
**Body:**
```json
{
  "tempToken": "temporary_jwt_token",
  "name": "Company Name",
  "agencyName": "Agency Name",
  "numPeople": 10,
  "password": "securepassword"
}
```

#### 4. Login (Company or Employee)
```
POST /auth/login
```
**Body:**
```json
{
  "phone": "1234567890",
  "password": "password"
}
```

### Employee Management Routes (Company Only)

#### 5. Add Employee
```
POST /auth/employees
```
**Headers:** `Authorization: Bearer <company_token>`
**Body:**
```json
{
  "name": "Employee Name",
  "phone": "9876543210",
  "password": "employeepassword"
}
```

#### 6. Get Company Employees
```
GET /auth/employees
```
**Headers:** `Authorization: Bearer <company_token>`

#### 7. Deactivate Employee
```
PUT /auth/employees/:employeeId/deactivate
```
**Headers:** `Authorization: Bearer <company_token>`

### Hotel Routes (Company and Employee)

#### 8. Get All Hotels
```
GET /hotels
```
**Headers:** `Authorization: Bearer <token>`

#### 9. Search Hotels
```
GET /hotels/search?location=Mumbai&checkIn=2024-01-15&checkOut=2024-01-17&guests=2
```
**Headers:** `Authorization: Bearer <token>`

#### 10. Get Hotel by ID
```
GET /hotels/:id
```
**Headers:** `Authorization: Bearer <token>`

#### 11. Check Hotel Availability
```
GET /hotels/availability/check?hotelId=123&checkIn=2024-01-15&checkOut=2024-01-17&guests=2
```
**Headers:** `Authorization: Bearer <token>`

#### 12. Get User Bookings
```
GET /hotels/bookings/user
```
**Headers:** `Authorization: Bearer <token>`

### Company Business Routes (Company Only)

#### 13. Get Company Dashboard
```
GET /employee/dashboard/company
```
**Headers:** `Authorization: Bearer <company_token>`

#### 14. Get Company Profile
```
GET /employee/profile/company
```
**Headers:** `Authorization: Bearer <company_token>`

#### 15. Update Company Profile
```
PUT /employee/profile/company
```
**Headers:** `Authorization: Bearer <company_token>`
**Body:**
```json
{
  "name": "Updated Company Name",
  "agencyName": "Updated Agency Name",
  "numPeople": 15,
  "gst": "gst_file_path",
  "docs": ["doc1_path", "doc2_path"]
}
```

#### 16. Get Company Bookings
```
GET /employee/bookings/company
```
**Headers:** `Authorization: Bearer <company_token>`

#### 17. Get Company Revenue
```
GET /employee/revenue/company
```
**Headers:** `Authorization: Bearer <company_token>`

### Markup Management Routes (Company Only)

#### 18. Set Company Markup
```
POST /company/markup
```
**Headers:** `Authorization: Bearer <company_token>`
**Body:**
```json
{
  "type": "percentage",
  "value": 10.5,
  "isActive": true
}
```
**Description:** Set markup configuration for the company. Type can be "percentage" or "fixed".

#### 19. Get Company Markup
```
GET /company/markup
```
**Headers:** `Authorization: Bearer <company_token>`
**Description:** Retrieve current markup configuration for the company.

#### 20. Calculate Markup
```
POST /company/markup/calculate
```
**Headers:** `Authorization: Bearer <company_token>`
**Body:**
```json
{
  "basePrice": 1000
}
```
**Description:** Calculate markup amount for a given base price using current markup settings.

#### 21. Toggle Markup Active Status
```
PUT /company/markup/toggle
```
**Headers:** `Authorization: Bearer <company_token>`
**Body:**
```json
{
  "isActive": false
}
```
**Description:** Activate or deactivate markup without changing the configuration.

### Employee Routes (Employee Only)

#### 22. Get Employee Profile
```
GET /employee/profile/me
```
**Headers:** `Authorization: Bearer <employee_token>`

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Error Codes

- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error

## User Model Structure

### Company User
```json
{
  "_id": "ObjectId",
  "phone": "1234567890",
  "name": "Company Name",
  "agencyName": "Agency Name",
  "numPeople": 10,
  "gst": "file_path",
  "docs": ["doc1", "doc2"],
  "password": "hashed_password",
  "role": "company",
  "companyNumber": 1001,
  "isActive": false,
  "markup": {
    "type": "percentage",
    "value": 0,
    "isActive": true
  },
  "employees": [
    {
      "employeeId": "EMP1001001",
      "name": "Employee Name",
      "phone": "9876543210",
      "password": "hashed_password",
      "employeeNumber": 1,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Employee User
```json
{
  "_id": "ObjectId",
  "phone": "9876543210",
  "name": "Employee Name",
  "password": "hashed_password",
  "role": "employee",
  "company": "ObjectId",
  "employeeId": "EMP1001001",
  "employeeNumber": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Middleware

### isAuth
- Verifies JWT token
- Sets user information in request object

### isCompany
- Ensures user has company role
- Required for company-only routes

### isEmployee
- Ensures user has employee role
- Required for employee-only routes

### isCompanyOrEmployee
- Allows both company and employee roles
- Used for shared routes like hotel operations

### isEmployeeOfCompany
- Verifies employee belongs to a valid company
- Checks if employee is active
- Used for employee routes

## Usage Examples

### Company Registration Flow
1. Send OTP: `POST /auth/send-otp`
2. Verify OTP: `POST /auth/verify-otp`
3. Complete registration: `POST /auth/complete-signup`

### Employee Management Flow
1. Company login: `POST /auth/login`
2. Add employee: `POST /auth/employees`
3. View employees: `GET /auth/employees`

### Hotel Operations Flow
1. Login (company or employee): `POST /auth/login`
2. Search hotels: `GET /hotels/search`
3. Check availability: `GET /hotels/availability/check`
4. View bookings: `GET /hotels/bookings/user`

## Security Notes

- All passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- Employee tokens are validated against company records
- Company numbers are unique and auto-generated
- Employee IDs follow pattern: `EMP{companyNumber}{employeeNumber}` 