const axios = require('axios');

const API_BASE_URL = 'http://localhost:3335/api';
const TEST_PHONE = '8287204314';

async function testServerStatus() {
  try {
    console.log('=== Testing Server Status ===');
    
    // Test 1: Check if server is responding
    console.log('1. Testing server connectivity...');
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/send-otp`, {
        timeout: 5000
      });
      console.log('✅ Server is responding');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Server is not running on port 3335');
        console.log('Please start the server with: npm start');
        return;
      } else if (error.response?.status === 405) {
        console.log('✅ Server is running (405 is expected for GET on POST endpoint)');
      } else {
        console.log('⚠️  Server response:', error.response?.status, error.response?.statusText);
      }
    }
    
    // Test 2: Send OTP
    console.log('\n2. Sending OTP...');
    const sendResponse = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
      phone: TEST_PHONE
    }, {
      timeout: 10000
    });
    
    console.log('Send Response:', JSON.stringify(sendResponse.data, null, 2));
    
    if (sendResponse.data.success) {
      console.log('✅ OTP sent successfully');
      
      // Test 3: Verify immediately
      console.log('\n3. Verifying OTP immediately...');
      const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        phone: TEST_PHONE,
        otp: '111111'
      }, {
        timeout: 10000
      });
      
      console.log('Verify Response:', JSON.stringify(verifyResponse.data, null, 2));
      
      if (verifyResponse.data.success) {
        console.log('✅ OTP verification successful!');
      } else {
        console.log('❌ OTP verification failed');
        console.log('Error:', verifyResponse.data.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('Server is not running. Please start it with: npm start');
    }
  }
}

testServerStatus(); 