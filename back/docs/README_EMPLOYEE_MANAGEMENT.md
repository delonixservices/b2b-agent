# Employee Management System with Admin Verification

This system allows companies/agencies to create and manage employee IDs for their employees. These employee IDs have limited access - only for hotel booking and viewing their own information, without dashboard access. **Companies must be verified by an admin before they can create employees or access hotel services.**

## Features

- **Company Management**: Companies can create, view, update, and delete employee IDs (after verification)
- **Employee Access**: Employees can login and view their own profile
- **Role-Based Access Control**: Employees have restricted access to only hotel booking features
- **Secure Authentication**: JWT-based authentication with role verification
- **Admin Verification System**: Companies are inactive by default and must be verified by admin
- **Owner/Admin Panel**: Super admin can verify companies and manage the platform

## Setup

### 1. Install Dependencies
```bash
cd back
npm install
```

### 2. Environment Variables
Make sure you have the following environment variables set in your `.env` file:
```
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=your_mongodb_connection_string
PORT=3334
```

### 3. Setup Super Admin
Create the initial super admin account:
```bash
node setup-super-admin.js
```
This creates a super admin with:
- Username: `superadmin`
- Password: `admin123`
- Email: `admin@b2b-agent.com`

### 4. Start the Server
```bash
npm start
# or for development
npm run dev
```

## Company Verification Flow

1. **Company Registration**: Companies register through normal signup process
2. **Pending Status**: Companies are created with `isActive: false` by default
3. **Admin Review**: Super admin reviews pending companies in admin panel
4. **Verification**: Admin verifies companies by setting `isActive: true`
5. **Full Access**: Verified companies can create employees and access hotel services
6. **Restricted Access**: Unverified companies receive appropriate error messages

## API Usage

### Admin/Owner Workflow

1. **Admin Login**
   ```bash
   POST /api/owner/login
   {
     "username": "superadmin",
     "password": "admin123"
   }
   ```

2. **View Dashboard Stats**
   ```bash
   GET /api/owner/dashboard/stats
   Authorization: Bearer <admin_token>
   ```

3. **Review Pending Companies**
   ```bash
   GET /api/owner/companies?status=pending
   Authorization: Bearer <admin_token>
   ```

4. **Verify Company**
   ```bash
   PUT /api/owner/companies/:companyId/verify
   Authorization: Bearer <admin_token>
   {
     "action": "verify"
   }
   ```

### Company Workflow (After Verification)

1. **Company Signup/Login**
   - Use existing auth APIs to create a company account
   - Login to get company token

2. **Create Employee IDs** (Only if verified)
   ```bash
   POST /api/auth/employees
   Authorization: Bearer <company_token>
   {
     "name": "Employee Name",
     "phone": "1234567890",
     "password": "employee_password"
   }
   ```

3. **Manage Employees**
   - List all employees: `GET /api/auth/employees`
   - Deactivate employee: `PUT /api/auth/employees/:employeeId/deactivate`

### Employee Workflow

1. **Employee Login**
   ```bash
   POST /api/auth/login
   {
     "phone": "1234567890",
     "password": "employee_password"
   }
   ```

2. **View Profile**
   ```bash
   GET /api/employees/profile
   Authorization: Bearer <employee_token>
   ```

3. **Hotel Booking** (Only if company is verified)
   - Use existing hotel booking APIs with employee token
   - Access is restricted to booking operations only

## Testing

### Test Admin/Owner APIs
```bash
cd back
node test_owner_apis.js
```

### Test Employee Management
```bash
cd back
node test_employee_apis.js
```

### Test Company Creation
```bash
cd back
node test_company_creation.js
```

## Security Features

- **Role-Based Access**: Employees can only access their own data and hotel booking
- **Company Isolation**: Companies can only manage their own employees
- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: All inputs are validated and sanitized
- **Admin Verification**: Companies must be verified before accessing services
- **Verification Status Check**: All protected operations check company verification status

## API Documentation

For detailed API documentation, see:
- `docs/EMPLOYEE_API_DOCUMENTATION.md` - Employee management APIs
- `docs/OWNER_ADMIN_API_DOCUMENTATION.md` - Owner/Admin APIs
- `docs/COMPANY_EMPLOYEE_API_DOCUMENTATION.md` - Company and employee APIs

## Database Schema

### Company Schema
```javascript
{
  phone: String (unique),
  name: String,
  agencyName: String,
  numPeople: Number,
  gst: String,
  docs: [String],
  password: String (hashed),
  companyNumber: Number (unique),
  isActive: Boolean (default: false) // Must be verified by admin
}
```

### Employee Schema
```javascript
{
  employeeId: String (unique),
  name: String,
  phone: String (unique),
  password: String (hashed),
  employeeNumber: Number,
  company: ObjectId (reference to company),
  companyNumber: Number,
  isActive: Boolean (default: true)
}
```

### Admin Schema
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  name: String,
  role: String (enum: ['super_admin', 'admin']),
  isActive: Boolean (default: true)
}
```

## Integration with Existing System

### Verified Companies Can:
- ✅ Create and manage employees
- ✅ Access hotel booking services
- ✅ View company dashboard
- ✅ Access all business features

### Unverified Companies:
- ❌ Cannot create employees
- ❌ Cannot access hotel services
- ❌ Receive verification pending messages
- ✅ Can view their profile and status

### Employees Can:
- ✅ Book hotels (if company is verified)
- ✅ View their own profile
- ❌ Cannot access dashboard features
- ❌ Cannot access company management features

## Error Handling

The system provides comprehensive error handling:
- 400: Bad Request (invalid input)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions or unverified company)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error

### Common Error Messages for Unverified Companies:
- "Your account is pending verification. Please wait for admin approval before creating employees."
- "Your account is pending verification. Please wait for admin approval before accessing hotel services."

All errors return consistent JSON responses with descriptive messages. 