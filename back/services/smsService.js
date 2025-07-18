const axios = require('axios');
const http = require('http');
const { authKey, senderId, templates } = require('../config/sms');

function generateOTP(length = 4) {
  const digits = '0123456789';
  return Array.from({ length }, () => digits[Math.floor(Math.random() * 10)]).join('');
}

// Generic flow-based SMS sender
async function sendSMSViaFlow(mobile, templateKey, values = []) {
  const template = templates[templateKey];
  if (!template) throw new Error(`Template "${templateKey}" not found`);

  // Check if required environment variables are set
  if (!authKey || !senderId || !template.flow_id) {
    throw new Error('SMS configuration incomplete. Missing authKey, senderId, or template flow_id.');
  }

  // Build variable payload (e.g., { VAR1: value1, VAR2: value2 })
  const variablePayload = {};
  template.variables.forEach((key, index) => {
    variablePayload[key] = values[index];
  });

  try {
    const response = await axios.post(
      'https://api.msg91.com/api/v5/flow/',
      {
        flow_id: template.flow_id,
        sender: senderId,
        mobiles: mobile,
        ...variablePayload,
      },
      {
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`SMS [${templateKey}] sent to ${mobile}`, response.data);
    return response.data;
  } catch (error) {
    console.error(` Error sending SMS [${templateKey}] to ${mobile}:`, error?.response?.data || error.message);
    throw error;
  }
}

// Login OTP sender
async function sendLoginOTP(mobile) {
  const otp = generateOTP();
  console.log(otp);
  const response = await sendSMSViaFlow(mobile, 'login_otp', [otp]);
  return { otp, response };
}

//Password reset OTP sender
async function sendPasswordResetOTP(mobile) {
  const otp = generateOTP();
  const response = await sendSMSViaFlow(mobile, 'reset_password_otp', [otp]);
  return { otp, response };
}

// Booking confirmation sender (expects 3 vars: Name, Hotel, Booking ID)
async function sendSms(to, msg) {
  return new Promise((resolve, reject) => {
    const request = `/api/sendhttp.php?country=91&sender=${senderId}&route=4&mobiles=${to}&authkey=${authKey}&message=${encodeURIComponent(msg)}`;

    const options = {
      method: 'GET',
      hostname: 'api.msg91.com',
      path: request,
      headers: {},
    };

    const req = http.request(options, function (res) {
      let chunks = [];

      res.on('data', function (chunk) {
        chunks.push(chunk);
      });

      res.on('end', function () {
        const body = Buffer.concat(chunks).toString();
        try {
          console.log(`SMS sent to ${to}: ${msg}`);
          console.log(`MSG91 response: ${body}`);

          resolve(body);
        } catch (error) {
          console.error('Error parsing response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Error sending SMS:', e.message);
      reject(e);
    });

    req.end();
  });
}



module.exports = {
  sendLoginOTP,
  sendPasswordResetOTP,
  sendSms
}
