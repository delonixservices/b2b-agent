// Test the new database-based OTP system
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3335/api';
const TEST_PHONE = '8287204314';

async function testDatabaseOTP() {
  try {
    console.log('=== Testing Database-Based OTP System ===');
    console.log('Phone:', TEST_PHONE);
    
    // Test 1: Send OTP
    console.log('\n1. Sending OTP...');
    const sendResponse = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
      phone: TEST_PHONE
    });
    
    console.log('Send Response:', JSON.stringify(sendResponse.data, null, 2));
    
    if (sendResponse.data.success) {
      console.log('✅ OTP sent successfully');
      
      // Test 2: Verify with fallback OTP
      console.log('\n2. Verifying with fallback OTP (111111)...');
      const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        phone: TEST_PHONE,
        otp: '111111'
      });
      
      console.log('Verify Response:', JSON.stringify(verifyResponse.data, null, 2));
      
      if (verifyResponse.data.success) {
        console.log('✅ OTP verification successful!');
        console.log('Temp Token:', verifyResponse.data.data.tempToken);
        
        // Test 3: Try to verify again (should fail)
        console.log('\n3. Testing duplicate verification (should fail)...');
        try {
          const duplicateResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
            phone: TEST_PHONE,
            otp: '111111'
          });
          console.log('❌ Duplicate verification should have failed');
        } catch (error) {
          if (error.response?.data?.message === 'OTP not found or expired') {
            console.log('✅ Duplicate verification correctly failed');
          } else {
            console.log('❌ Unexpected error:', error.response?.data?.message);
          }
        }
      } else {
        console.log('❌ OTP verification failed');
        console.log('Error:', verifyResponse.data.message);
      }
    } else {
      console.log('❌ OTP sending failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDatabaseOTP(); 