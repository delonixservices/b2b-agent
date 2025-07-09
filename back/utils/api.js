const axios = require('axios');

class ApiService {
  constructor() {
    this.baseURL = process.env.HOTEL_APIURL;
    this.authKey = process.env.HOTEL_APIAUTH;
    
    console.log('API Service initialized with:', {
      baseURL: this.baseURL ? 'Set' : 'Not set',
      authKey: this.authKey ? 'Set' : 'Not set'
    });
    
    if (!this.baseURL) {
      throw new Error('HOTEL_APIURL environment variable is required');
    }
    
    if (!this.authKey) {
      throw new Error('HOTEL_APIAUTH environment variable is required');
    }
  }

  // Create axios instance with default config
  get client() {
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });
  }

  // Generic GET request
  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error('API GET request failed:', error.message);
      throw error;
    }
  }

  // Generic POST request
  async post(endpoint, data = {}) {
    console.log('=== API POST REQUEST START ===');
    console.log('Endpoint:', endpoint);
    console.log('Base URL:', this.baseURL);
    console.log('Full URL:', this.baseURL + endpoint);
    
    try {
      // Add authentication to the request payload
      const requestPayload = {
        ...data,
        authentication: {
          authorization_key: this.authKey
        }
      };
      
      console.log('Request payload:', JSON.stringify(requestPayload, null, 2));
      console.log('Request timestamp:', new Date().toISOString());
      
      const requestStartTime = Date.now();
      
      const response = await this.client.post(endpoint, requestPayload);
      
      const requestEndTime = Date.now();
      console.log('API request completed in:', requestEndTime - requestStartTime, 'ms');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response data keys:', Object.keys(response.data || {}));
      console.log('=== API POST REQUEST END ===');
      
      // Check for error codes in the response data
      if (response.data && (response.data.errorCode || response.data.errorMsg)) {
        console.error('=== API ERROR RESPONSE DETECTED ===');
        console.error('Error Code:', response.data.errorCode);
        console.error('Error Message:', response.data.errorMsg);
        console.error('Full Error Response:', JSON.stringify(response.data, null, 2));
        
        const errorMessage = response.data.errorMsg || `API Error: ${response.data.errorCode || 'Unknown error'}`;
        const apiError = new Error(errorMessage);
        apiError.name = 'APIError';
        apiError.errorCode = response.data.errorCode;
        apiError.errorMsg = response.data.errorMsg;
        apiError.status = response.status;
        apiError.responseData = response.data;
        throw apiError;
      }
      
      return response.data;
    } catch (error) {
      console.error('=== API POST REQUEST ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error response status:', error.response?.status);
      console.error('Error response status text:', error.response?.statusText);
      console.error('Error response data:', error.response?.data);
      console.error('Error config:', {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout,
        headers: error.config?.headers
      });
      console.error('=== API POST REQUEST ERROR END ===');
      throw error;
    }
  }

  // Generic PUT request
  async put(endpoint, data = {}) {
    try {
      const response = await this.client.put(endpoint, data);
      return response.data;
    } catch (error) {
      console.error('API PUT request failed:', error.message);
      throw error;
    }
  }

  // Generic DELETE request
  async delete(endpoint) {
    try {
      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error('API DELETE request failed:', error.message);
      throw error;
    }
  }
}

// Create and export a singleton instance
const api = new ApiService();
module.exports = api; 