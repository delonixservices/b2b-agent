// Authentication utility functions

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Alias for getAuthToken for compatibility
export const getToken = (): string | null => {
  return getAuthToken();
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const clearAuthData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const setAuthData = (token: string, user: any): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUserData = (): any | null => {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

// Admin authentication functions
export const getAdminToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
};

export const isAdminAuthenticated = (): boolean => {
  return !!getAdminToken();
};

export const clearAdminAuthData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('adminToken');
  localStorage.removeItem('admin');
};

export const setAdminAuthData = (token: string, admin: any): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('adminToken', token);
  localStorage.setItem('admin', JSON.stringify(admin));
};

export const getAdminData = (): any | null => {
  if (typeof window === 'undefined') return null;
  const adminData = localStorage.getItem('admin');
  return adminData ? JSON.parse(adminData) : null;
};

export const logoutAdmin = (): void => {
  clearAdminAuthData();
};

// API headers with authentication
export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Check if token is expired (basic check)
export const isTokenExpired = (): boolean => {
  const token = getAuthToken();
  if (!token) return true;
  
  try {
    // Basic JWT expiration check (this is a simplified version)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    // If we can't parse the token, consider it expired
    return true;
  }
}; 