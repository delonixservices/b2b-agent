// Debug script to test OTP functionality
const { sendLoginOTP } = require('./services/smsService');

console.log('=== OTP Debug Script ===');
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SMS_AUTH_KEY:', process.env.SMS_AUTH_KEY ? 'SET' : 'NOT SET');
console.log('SENDERID:', process.env.SENDERID ? 'SET' : 'NOT SET');
console.log('LOGIN_OTP_TEMPLATE_ID:', process.env.LOGIN_OTP_TEMPLATE_ID ? 'SET' : 'NOT SET');

console.log('\nTesting SMS Service...');

async function testOTP() {
  try {
    console.log('Attempting to send OTP to 1234567890...');
    const result = await sendLoginOTP('1234567890');
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testOTP(); 