const axios = require('axios');

class ApiService {
  constructor() {
    this.baseURL = process.env.HOTEL_APIURL;
    this.authKey = process.env.HOTEL_APIAUTH;
    
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
    try {
      // Add authentication to the request payload
      const requestPayload = {
        ...data,
        authentication: {
          authorization_key: this.authKey
        }
      };
      
      console.log('info: Making API request:', {
        params: JSON.stringify(requestPayload),
        url: this.baseURL + endpoint
      });
      
      const response = await this.client.post(endpoint, requestPayload);
      return response.data;
    } catch (error) {
      console.error('API POST request failed:', error.message);
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