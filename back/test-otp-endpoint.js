// Test script for OTP endpoint
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3335/api';

async function testOTPEndpoint() {
  try {
    console.log('=== Testing OTP Endpoint ===');
    
    // Test sending OTP
    console.log('1. Testing send OTP...');
    const sendResponse = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
      phone: '1234567890'
    });
    
    console.log('Send OTP Response:', sendResponse.data);
    
    if (sendResponse.data.success) {
      console.log('✅ OTP sent successfully');
      
      // Test verifying OTP (using fallback OTP)
      console.log('\n2. Testing verify OTP...');
      const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        phone: '1234567890',
        otp: '111111' // Fallback OTP
      });
      
      console.log('Verify OTP Response:', verifyResponse.data);
      
      if (verifyResponse.data.success) {
        console.log('✅ OTP verified successfully');
        console.log('Temp Token:', verifyResponse.data.data.tempToken);
      } else {
        console.log('❌ OTP verification failed');
      }
    } else {
      console.log('❌ OTP sending failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testOTPEndpoint(); 