// API Configuration
export const getApiBaseUrl = (): string => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // In browser, try to get from environment variable
    const apiPath = process.env.NEXT_PUBLIC_API_PATH;
    if (apiPath) {
      return apiPath;
    }
    
    // Fallback for development
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3334';
    }
    
    // Production fallback - you can set this to your production URL
    return 'https://holidays-b2b-node22.qbthl0.easypanel.host';
  }
  
  // Server-side fallback
  return process.env.NEXT_PUBLIC_API_PATH || 'http://localhost:3334';
};

export const API_BASE_URL = getApiBaseUrl(); 