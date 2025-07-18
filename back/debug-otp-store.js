// Debug script to check OTP store state
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3335/api';
const TEST_PHONE = '8287204314';

async function debugOTPStore() {
  try {
    console.log('=== Debugging OTP Store ===');
    console.log('Phone:', TEST_PHONE);
    
    // Step 1: Send OTP and check response
    console.log('\n1. Sending OTP...');
    const sendResponse = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
      phone: TEST_PHONE
    });
    
    console.log('Send Response:', sendResponse.data);
    
    if (sendResponse.data.success) {
      console.log('✅ OTP sent successfully');
      
      // Step 2: Try different OTPs
      const testOtpList = ['111111', '000000', '123456', '999999'];
      
      for (const testOtp of testOtpList) {
        console.log(`\n2. Testing OTP: ${testOtp}`);
        
        try {
          const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
            phone: TEST_PHONE,
            otp: testOtp
          });
          
          console.log(`Response for ${testOtp}:`, verifyResponse.data);
          
          if (verifyResponse.data.success) {
            console.log(`✅ SUCCESS with OTP: ${testOtp}`);
            break;
          }
        } catch (error) {
          console.log(`❌ Failed with ${testOtp}:`, error.response?.data?.message || error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugOTPStore(); 