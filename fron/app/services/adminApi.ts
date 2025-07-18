import { API_BASE_URL } from '../utils/config';

export interface Admin {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
}

export interface Company {
  _id: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  status: 'pending' | 'verified' | 'deactivated';
  createdAt: string;
  updatedAt: string;
  companyNumber?: number;
}

export interface DashboardStats {
  totalCompanies: number;
  pendingCompanies: number;
  verifiedCompanies: number;
  deactivatedCompanies: number;
  totalEmployees: number;
}

export interface Config {
  _id: string;
  markup: {
    type: 'fixed' | 'percentage';
    value: number;
  };
  service_charge: {
    type: 'fixed' | 'percentage';
    value: number;
  };
  processing_fee: number;
  cancellation_charge: {
    type: 'fixed' | 'percentage';
    value: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ConfigResponse {
  success: boolean;
  message: string;
  data: {
    config: Config;
  };
}

export interface MarkupConfigResponse {
  success: boolean;
  message: string;
  data: {
    markup: {
      type: 'fixed' | 'percentage';
      value: number;
    };
  };
}

export interface MarkupCalculationResponse {
  success: boolean;
  message: string;
  data: {
    originalAmount: number;
    markup: {
      type: 'fixed' | 'percentage';
      value: number;
      amount: number;
    };
    finalAmount: number;
  };
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
  status?: 'pending' | 'verified' | 'deactivated',
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

// Verify/Deactivate Company
export const verifyCompany = async (token: string, companyId: string, action: 'verify' | 'deactivate') => {
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

// Create Super Admin (One-time setup)
export const createSuperAdmin = async (username: string, email: string, password: string, name: string) => {
  const response = await fetch(`${API_BASE_URL}/api/owner/setup-super-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password, name }),
  });

  if (!response.ok) {
    throw new Error('Failed to create super admin');
  }

  return response.json();
};

// Utility function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('adminToken');
};

// Utility function to get admin token
export const getAdminToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
};

// Utility function to get admin info
export const getAdminInfo = (): Admin | null => {
  if (typeof window === 'undefined') return null;
  const adminInfo = localStorage.getItem('adminInfo');
  return adminInfo ? JSON.parse(adminInfo) : null;
};

// Utility function to logout admin
export const logoutAdmin = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminInfo');
};

// Configuration API Functions

// Get Configuration
export const getConfig = async (token: string): Promise<ConfigResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/config`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch configuration');
  }

  return response.json();
};

// Get Markup Configuration
export const getMarkupConfig = async (token: string): Promise<MarkupConfigResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/config/markup`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch markup configuration');
  }

  return response.json();
};

// Create/Update Configuration
export const createConfig = async (
  token: string,
  configData: {
    markup: {
      type: 'fixed' | 'percentage';
      value: number;
    };
    service_charge: {
      type: 'fixed' | 'percentage';
      value: number;
    };
    processing_fee: number;
    cancellation_charge: {
      type: 'fixed' | 'percentage';
      value: number;
    };
  }
): Promise<ConfigResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/config`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(configData),
  });

  if (!response.ok) {
    throw new Error('Failed to create/update configuration');
  }

  return response.json();
};

// Update Configuration (Partial)
export const updateConfig = async (
  token: string,
  configData: {
    markup?: {
      type?: 'fixed' | 'percentage';
      value?: number;
    };
    service_charge?: {
      type?: 'fixed' | 'percentage';
      value?: number;
    };
    processing_fee?: number;
    cancellation_charge?: {
      type?: 'fixed' | 'percentage';
      value?: number;
    };
  }
): Promise<ConfigResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/config`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(configData),
  });

  if (!response.ok) {
    throw new Error('Failed to update configuration');
  }

  return response.json();
};

// Delete Configuration (Not allowed)
export const deleteConfig = async (token: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/config`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete configuration');
  }

  return response.json();
};

// Calculate Markup
export const calculateMarkup = async (
  token: string,
  amount: number
): Promise<MarkupCalculationResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/config/calculate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    throw new Error('Failed to calculate markup');
  }

  return response.json();
};

// Utility function to refresh dashboard data
export const refreshDashboardData = async (token: string) => {
  try {
    const [stats, companies] = await Promise.all([
      getDashboardStats(token),
      getAllCompanies(token, undefined, 1, 10)
    ]);
    return { stats, companies };
  } catch (error) {
    throw new Error('Failed to refresh dashboard data');
  }
};

// Wallet Management APIs

// Get All Companies with Wallet Balances
export const getAllCompaniesWithWallets = async (
  token: string,
  status?: 'pending' | 'verified' | 'deactivated',
  page?: number,
  limit?: number
): Promise<CompaniesWithWalletsResponse> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());

  const response = await fetch(`${API_BASE_URL}/api/owner/companies/wallets?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch companies with wallets');
  }

  return response.json();
};

// Get Company Wallet Balance
export const getCompanyWallet = async (
  token: string,
  companyId: string
): Promise<CompanyWalletResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/companies/${companyId}/wallet`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch company wallet');
  }

  return response.json();
};

// Update Company Wallet Balance
export const updateCompanyWallet = async (
  token: string,
  companyId: string,
  walletData: {
    amount: number;
    action: 'add' | 'deduct';
    reason?: string;
  }
): Promise<UpdateWalletResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/companies/${companyId}/wallet`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(walletData),
  });

  if (!response.ok) {
    throw new Error('Failed to update company wallet');
  }

  return response.json();
};

// Type Definitions for Wallet APIs

export interface CompanyWallet {
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface CompanyWithWallet extends Company {
  wallet: CompanyWallet;
}

export interface CompaniesWithWalletsResponse {
  success: boolean;
  message: string;
  data: {
    companies: CompanyWithWallet[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface CompanyWalletResponse {
  success: boolean;
  message: string;
  data: {
    companyId: string;
    companyName: string;
    wallet: CompanyWallet;
  };
}

export interface UpdateWalletResponse {
  success: boolean;
  message: string;
  data: {
    companyId: string;
    companyName: string;
    oldBalance: number;
    newBalance: number;
    amount: number;
    action: 'add' | 'deduct';
    reason: string;
    currency: string;
    lastUpdated: string;
  };
}

// Markup Management Interfaces
export interface Markup {
  _id: string;
  name: string;
  description?: string;
  type: 'fixed' | 'percentage';
  value: number;
  isActive: boolean;
  hotelId: string;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MarkupResponse {
  success: boolean;
  message: string;
  data: {
    markup: Markup;
  };
}

export interface MarkupsResponse {
  success: boolean;
  message: string;
  data: {
    markups: Markup[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalMarkups: number;
    };
  };
}

// Get Markup by ID
export const getMarkupById = async (token: string, markupId: string): Promise<MarkupResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/markups/${markupId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch markup details');
  }

  return response.json();
};

// Update Markup
export const updateMarkup = async (
  token: string,
  markupId: string,
  markupData: {
    name: string;
    description?: string;
    type: 'fixed' | 'percentage';
    value: number;
    isActive: boolean;
  }
): Promise<MarkupResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/markups/${markupId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(markupData),
  });

  if (!response.ok) {
    throw new Error('Failed to update markup');
  }

  return response.json();
};

// Delete Markup
export const deleteMarkup = async (token: string, markupId: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/markups/${markupId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete markup');
  }

  return response.json();
};

// Get All Markups
export const getAllMarkups = async (
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<MarkupsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/api/owner/markups?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch markups');
  }

  return response.json();
};

// Create Markup
export const createMarkup = async (
  token: string,
  markupData: {
    name: string;
    description?: string;
    type: 'fixed' | 'percentage';
    value: number;
    isActive: boolean;
    hotelId: string;
  }
): Promise<MarkupResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/owner/markups`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(markupData),
  });

  if (!response.ok) {
    throw new Error('Failed to create markup');
  }

  return response.json();
}; 