const { sendLoginOTP } = require('./services/smsService');

console.log('=== Direct OTP Test ===');

async function testDirectOTP() {
  try {
    console.log('1. Calling sendLoginOTP...');
    const result = await sendLoginOTP('8287204314');
    console.log('✅ Success:', result);
  } catch (error) {
    console.log('❌ Error caught:', error.message);
    
    if (error.message.includes('SMS configuration incomplete')) {
      console.log('✅ This is expected - SMS config missing');
    }
  }
}

testDirectOTP(); 