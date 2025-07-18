// Comprehensive OTP test to debug the issue
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3335/api';
const TEST_PHONE = '8287204314';

async function comprehensiveOTPTest() {
  try {
    console.log('=== Comprehensive OTP Test ===');
    console.log('Phone:', TEST_PHONE);
    console.log('API URL:', API_BASE_URL);
    
    // Test 1: Check if server is responding
    console.log('\n1. Testing server connectivity...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Server is responding');
    } catch (error) {
      console.log('⚠️  Server health endpoint not available, but continuing...');
    }
    
    // Test 2: Send OTP
    console.log('\n2. Sending OTP...');
    const sendResponse = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
      phone: TEST_PHONE
    });
    
    console.log('Send Response:', JSON.stringify(sendResponse.data, null, 2));
    
    if (sendResponse.data.success) {
      console.log('✅ OTP sent successfully');
      
      // Test 3: Try verification immediately
      console.log('\n3. Testing immediate verification with fallback OTP...');
      
      const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        phone: TEST_PHONE,
        otp: '111111'
      });
      
      console.log('Verify Response:', JSON.stringify(verifyResponse.data, null, 2));
      
      if (verifyResponse.data.success) {
        console.log('✅ OTP verification successful!');
        console.log('Temp Token:', verifyResponse.data.data.tempToken);
      } else {
        console.log('❌ OTP verification failed');
        console.log('Error message:', verifyResponse.data.message);
        
        // Test 4: Try with different OTPs
        console.log('\n4. Testing with different OTPs...');
        const testOtps = ['111111', '000000', '123456', '999999', '888888'];
        
        for (const otp of testOtps) {
          try {
            const testResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
              phone: TEST_PHONE,
              otp: otp
            });
            
            if (testResponse.data.success) {
              console.log(`✅ SUCCESS with OTP: ${otp}`);
              break;
            } else {
              console.log(`❌ Failed with OTP: ${otp} - ${testResponse.data.message}`);
            }
          } catch (error) {
            console.log(`❌ Error with OTP: ${otp} - ${error.response?.data?.message || error.message}`);
          }
        }
      }
    } else {
      console.log('❌ OTP sending failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Full error:', error);
  }
}

comprehensiveOTPTest(); 