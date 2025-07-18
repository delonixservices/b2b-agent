console.log('=== Simple Test ===');

try {
  console.log('1. Loading SMS service...');
  const smsService = require('./services/smsService');
  console.log('✅ SMS service loaded successfully');
  
  console.log('2. Available functions:', Object.keys(smsService));
  
  console.log('3. Testing OTP generation...');
  const otp = smsService.generateOTP ? smsService.generateOTP() : 'Function not exported';
  console.log('Generated OTP:', otp);
  
} catch (error) {
  console.error('❌ Error:', error.message);
} 