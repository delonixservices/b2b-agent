// Test OTP generation directly
const { sendLoginOTP } = require('./services/smsService');

async function testOTPGeneration() {
  try {
    console.log('=== Testing OTP Generation ===');
    
    console.log('1. Testing sendLoginOTP function...');
    const result = await sendLoginOTP('8287204314');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
    
    // Check if this is the expected SMS configuration error
    if (error.message.includes('SMS configuration incomplete')) {
      console.log('\n✅ This is the expected error - SMS config is missing');
      console.log('The auth controller should catch this and use fallback OTP');
    }
  }
}

testOTPGeneration(); 