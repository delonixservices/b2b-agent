const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334';

export interface Admin {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
}

export interface Company {
  _id: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalCompanies: number;
  pendingCompanies: number;
  verifiedCompanies: number;
  totalEmployees: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    admin: Admin;
  };
}

export interface CompaniesResponse {
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

export interface CompanyDetailsResponse {
  success: boolean;
  message: string;
  data: {
    company: Company;
    employeeCount: number;
  };
}

// Admin Login
export const adminLogin = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
};

// Get Dashboard Statistics
export const getDashboardStats = async (token: string): Promise<DashboardStats> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/dashboard/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }

  const data = await response.json();
  return data.data;
};

// Get All Companies
export const getAllCompanies = async (
  token: string,
  status?: 'pending' | 'verified',
  page: number = 1,
  limit: number = 10
): Promise<CompaniesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (status) {
    params.append('status', status);
  }

  const response = await fetch(`${API_BASE_URL}/api/owner/companies?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch companies');
  }

  return response.json();
};

// Get Company Details
export const getCompanyById = async (token: string, companyId: string): Promise<CompanyDetailsResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/companies/${companyId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch company details');
  }

  return response.json();
};

// Verify/Reject Company
export const verifyCompany = async (token: string, companyId: string, action: 'verify' | 'reject') => {
  const response = await fetch(`${API_BASE_URL}/api/owner/companies/${companyId}/verify`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    throw new Error('Failed to update company status');
  }

  return response.json();
}; 