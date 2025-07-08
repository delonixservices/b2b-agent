const axios = require('axios');

class SmsService {
  constructor() {
    this.apiKey = process.env.SMS_API_KEY;
    this.senderId = process.env.SMS_SENDER_ID || 'TRIPBZ';
    this.baseUrl = process.env.SMS_API_URL || 'https://api.textlocal.in/send/';
  }

  async send(to, message) {
    try {
      if (!this.apiKey) {
        console.warn('SMS API key not configured, skipping SMS send');
        return { type: 'success', message: 'SMS skipped - no API key' };
      }

      const payload = {
        apikey: this.apiKey,
        numbers: to,
        message: message,
        sender: this.senderId
      };

      const response = await axios.post(this.baseUrl, payload);
      
      if (response.data.status === 'success') {
        console.log('SMS sent successfully to:', to);
        return { type: 'success', messageId: response.data.message_id };
      } else {
        console.error('SMS sending failed:', response.data);
        return { type: 'error', message: response.data.message };
      }
    } catch (error) {
      console.error('SMS service error:', error.message);
      return { type: 'error', message: error.message };
    }
  }
}

module.exports = new SmsService(); 