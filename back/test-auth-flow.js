// Test that simulates the auth controller flow
const { sendLoginOTP } = require('./services/smsService');

// Simulate the OTP store from auth controller
const otpStore = {};

async function testAuthFlow() {
  const phone = '8287204314';
  
  console.log('=== Testing Auth Controller Flow ===');
  console.log('Phone:', phone);
  
  try {
    console.log('\n1. Attempting to send OTP via SMS...');
    const { otp, response } = await sendLoginOTP(phone);
    
    // Store OTP in memory store with purpose
    otpStore[phone] = { otp, purpose: 'signup' };
    
    console.log('✅ SMS OTP generated:', otp);
    console.log('✅ OTP stored in memory');
    console.log('OTP Store:', otpStore);
    
  } catch (smsError) {
    console.log('❌ SMS sending failed:', smsError.message);
    
    // Fallback to hardcoded OTP for development/testing
    const fallbackOtp = '111111';
    otpStore[phone] = { otp: fallbackOtp, purpose: 'signup' };
    
    console.log('✅ Fallback OTP set:', fallbackOtp);
    console.log('✅ OTP stored in memory');
    console.log('OTP Store:', otpStore);
  }
  
  // Test verification
  console.log('\n2. Testing OTP verification...');
  const testOtps = ['111111', '6982', '000000'];
  
  for (const testOtp of testOtps) {
    console.log(`\nTesting OTP: ${testOtp}`);
    
    const storedOtp = otpStore[phone];
    console.log('Stored OTP:', storedOtp);
    
    if (!storedOtp) {
      console.log('❌ No OTP found in store');
      break;
    }
    
    const storedOtpValue = typeof storedOtp === 'string' ? storedOtp : storedOtp.otp;
    console.log('Stored OTP Value:', storedOtpValue);
    console.log('Comparing:', storedOtpValue, '===', testOtp, '=', storedOtpValue === testOtp);
    
    if (storedOtpValue === testOtp) {
      console.log('✅ OTP verification successful!');
      break;
    } else {
      console.log('❌ OTP verification failed');
    }
  }
}

testAuthFlow(); 