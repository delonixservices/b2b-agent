// Simple OTP test script
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3335/api';
const TEST_PHONE = '8287204314'; // Use your actual phone number

async function testOTP() {
  try {
    console.log('=== Testing OTP with your phone number ===');
    console.log('Phone:', TEST_PHONE);
    
    // Step 1: Send OTP
    console.log('\n1. Sending OTP...');
    const sendResponse = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
      phone: TEST_PHONE
    });
    
    console.log('Send Response:', sendResponse.data);
    
    if (sendResponse.data.success) {
      console.log('✅ OTP sent successfully');
      
      // Step 2: Wait a moment and verify with fallback OTP
      console.log('\n2. Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('3. Verifying with fallback OTP (111111)...');
      const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        phone: TEST_PHONE,
        otp: '111111'
      });
      
      console.log('Verify Response:', verifyResponse.data);
      
      if (verifyResponse.data.success) {
        console.log('✅ OTP verified successfully!');
        console.log('Temp Token:', verifyResponse.data.data.tempToken);
      } else {
        console.log('❌ OTP verification failed');
        console.log('Error:', verifyResponse.data.message);
      }
    } else {
      console.log('❌ OTP sending failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testOTP(); 