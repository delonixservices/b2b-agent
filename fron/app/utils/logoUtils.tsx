import React from 'react';

// Logo utility functions for localStorage and server management

export interface LogoData {
  url: string;
  timestamp: number;
  source: 'local' | 'server';
}

// Save logo to localStorage
export const saveLogoToLocal = (logoUrl: string): void => {
  const logoData: LogoData = {
    url: logoUrl,
    timestamp: Date.now(),
    source: 'local'
  };
  localStorage.setItem('companyLogo', JSON.stringify(logoData));
};

// Get logo from localStorage
export const getLogoFromLocal = (): string | null => {
  const logoData = localStorage.getItem('companyLogo');
  if (!logoData) return null;
  
  try {
    const parsed: LogoData = JSON.parse(logoData);
    return parsed.url;
  } catch {
    // Fallback for old format (just URL string)
    return logoData;
  }
};

// Get logo data from localStorage
export const getLogoDataFromLocal = (): LogoData | null => {
  const logoData = localStorage.getItem('companyLogo');
  if (!logoData) return null;
  
  try {
    return JSON.parse(logoData);
  } catch {
    // Fallback for old format
    const url = logoData;
    return {
      url,
      timestamp: Date.now(),
      source: 'local'
    };
  }
};

// Remove logo from localStorage
export const removeLogoFromLocal = (): void => {
  localStorage.removeItem('companyLogo');
};

// Upload logo to server
export const uploadLogoToServer = async (logoUrl: string): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { success: false, message: 'Please login to upload logo' };
    }

    const response = await fetch('http://localhost:3334/api/auth/upload-logo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ logoUrl }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Save to localStorage after successful server upload
      saveLogoToLocal(logoUrl);
    }
    
    return data;
  } catch (error) {
    return { success: false, message: 'Network error. Please try again.' };
  }
};

// Load logo from server
export const loadLogoFromServer = async (): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { success: false, message: 'Please login to load logo' };
    }

    const response = await fetch('http://localhost:3334/api/auth/logo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success && data.data.logo) {
      // Save to localStorage after successful server load
      saveLogoToLocal(data.data.logo);
    }
    
    return data;
  } catch (error) {
    return { success: false, message: 'Failed to load logo from server' };
  }
};

// Validate logo URL
export const validateLogoUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Get logo display component
export const getLogoDisplay = (logoUrl: string, className: string = "w-8 h-8") => {
  if (!logoUrl) return null;
  
  return (
    <img 
      src={logoUrl} 
      alt="Company Logo" 
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}; 