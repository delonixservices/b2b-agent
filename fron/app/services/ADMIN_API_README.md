# Admin API Documentation

This document provides comprehensive information about all the admin APIs available in the frontend application.

## Base Configuration

The API base URL is configured in `adminApi.ts`:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334';
```

## Available APIs

### 1. Authentication APIs

#### Admin Login
```typescript
adminLogin(username: string, password: string): Promise<LoginResponse>
```
- **Endpoint**: `POST /api/owner/login`
- **Description**: Authenticates admin user and returns JWT token
- **Response**: Returns token and admin information
- **Usage**: Used in admin login page

#### Create Super Admin
```typescript
createSuperAdmin(username: string, email: string, password: string, name: string)
```
- **Endpoint**: `POST /api/owner/setup-super-admin`
- **Description**: Creates the initial super admin account (one-time setup)
- **Usage**: Used in admin setup page

### 2. Dashboard APIs

#### Get Dashboard Statistics
```typescript
getDashboardStats(token: string): Promise<DashboardStats>
```
- **Endpoint**: `GET /api/owner/dashboard/stats`
- **Description**: Retrieves dashboard statistics (company counts, employee counts)
- **Headers**: Requires Authorization Bearer token
- **Response**: Returns total companies, pending companies, verified companies, deactivated companies, and total employees

### 3. Company Management APIs

#### Get All Companies
```typescript
getAllCompanies(token: string, status?: 'pending' | 'verified' | 'deactivated', page?: number, limit?: number): Promise<CompaniesResponse>
```
- **Endpoint**: `GET /api/owner/companies`
- **Description**: Retrieves paginated list of companies with optional status filter
- **Headers**: Requires Authorization Bearer token
- **Query Parameters**:
  - `status`: Filter by company status (optional)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Response**: Returns companies array and pagination information

#### Get Company Details
```typescript
getCompanyById(token: string, companyId: string): Promise<CompanyDetailsResponse>
```
- **Endpoint**: `GET /api/owner/companies/:companyId`
- **Description**: Retrieves detailed information about a specific company
- **Headers**: Requires Authorization Bearer token
- **Response**: Returns company details and employee count

#### Verify/Deactivate Company
```typescript
verifyCompany(token: string, companyId: string, action: 'verify' | 'deactivate')
```
- **Endpoint**: `PUT /api/owner/companies/:companyId/verify`
- **Description**: Verifies or deactivates a company
- **Headers**: Requires Authorization Bearer token
- **Body**: `{ action: 'verify' | 'deactivate' }`
- **Usage**: Used in admin dashboard for company management

### 4. Utility Functions

#### Authentication Utilities
```typescript
isAuthenticated(): boolean
getAdminToken(): string | null
getAdminInfo(): Admin | null
logoutAdmin(): void
```
- **Description**: Helper functions for managing admin authentication state
- **Usage**: Used throughout the admin interface for authentication checks

#### Data Refresh Utility
```typescript
refreshDashboardData(token: string)
```
- **Description**: Refreshes both dashboard stats and companies data simultaneously
- **Usage**: Used after company status changes to update the dashboard

## Type Definitions

### Admin Interface
```typescript
interface Admin {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
}
```

### Company Interface
```typescript
interface Company {
  _id: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  status: 'pending' | 'verified' | 'deactivated';
  createdAt: string;
  updatedAt: string;
}
```

### Dashboard Stats Interface
```typescript
interface DashboardStats {
  totalCompanies: number;
  pendingCompanies: number;
  verifiedCompanies: number;
  deactivatedCompanies: number;
  totalEmployees: number;
}
```

### Response Interfaces
```typescript
interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    admin: Admin;
  };
}

interface CompaniesResponse {
  success: boolean;
  message: string;
  data: {
    companies: Company[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCompanies: number;
    };
  };
}

interface CompanyDetailsResponse {
  success: boolean;
  message: string;
  data: {
    company: Company;
    employeeCount: number;
  };
}
```

## Usage Examples

### 1. Admin Login
```typescript
import { adminLogin } from '../services/adminApi';

const handleLogin = async (username: string, password: string) => {
  try {
    const response = await adminLogin(username, password);
    if (response.success) {
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminInfo', JSON.stringify(response.data.admin));
      // Redirect to dashboard
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### 2. Fetch Dashboard Data
```typescript
import { getDashboardStats, getAllCompanies } from '../services/adminApi';

const fetchDashboardData = async () => {
  const token = localStorage.getItem('adminToken');
  if (!token) return;

  try {
    const [stats, companies] = await Promise.all([
      getDashboardStats(token),
      getAllCompanies(token, 'pending', 1, 10)
    ]);
    // Update state with fetched data
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  }
};
```

### 3. Company Management
```typescript
import { verifyCompany } from '../services/adminApi';

const handleVerifyCompany = async (companyId: string, action: 'verify' | 'deactivate') => {
  const token = localStorage.getItem('adminToken');
  if (!token) return;

  try {
    await verifyCompany(token, companyId, action);
    // Refresh dashboard data
    await refreshDashboardData(token);
  } catch (error) {
    console.error('Failed to update company status:', error);
  }
};
```

### 4. Authentication Check
```typescript
import { isAuthenticated, logoutAdmin } from '../services/adminApi';

// Check if admin is logged in
if (!isAuthenticated()) {
  // Redirect to login
}

// Logout admin
const handleLogout = () => {
  logoutAdmin();
  // Redirect to login page
};
```

## Error Handling

All API functions throw errors when the request fails. Common error scenarios:

1. **Network errors**: Connection issues or server unavailable
2. **Authentication errors**: Invalid or expired token
3. **Validation errors**: Invalid input data
4. **Server errors**: Internal server errors (500 status)

### Error Handling Example
```typescript
try {
  const response = await adminLogin(username, password);
  // Handle success
} catch (error) {
  if (error.message.includes('Invalid credentials')) {
    // Handle authentication error
  } else if (error.message.includes('Network')) {
    // Handle network error
  } else {
    // Handle other errors
  }
}
```

## Security Considerations

1. **Token Storage**: Admin tokens are stored in localStorage
2. **Token Validation**: All protected endpoints require valid JWT token
3. **Token Expiration**: Tokens expire after 7 days
4. **CORS**: Ensure proper CORS configuration on backend
5. **HTTPS**: Use HTTPS in production for secure communication

## Backend Integration

The admin APIs integrate with the following backend endpoints:

- `back/controllers/ownerController.js`: Contains all admin business logic
- `back/routes/owner.js`: Defines admin API routes
- `back/middleware/isauth.js`: Provides authentication middleware
- `back/models/admin.js`: Admin user model
- `back/models/user.js`: Company and Employee models

## Frontend Pages

The admin APIs are used in the following frontend pages:

1. **`/admin/login`**: Admin authentication
2. **`/admin/setup`**: Initial super admin creation
3. **`/admin/dashboard`**: Main admin dashboard with company management

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3334
```

This should be set to your backend API URL in production. 