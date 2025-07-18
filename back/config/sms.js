module.exports = {
    authKey: process.env.SMS_AUTH_KEY,
    senderId: process.env.SENDERID,
  
    templates: {
      login_otp: {
        flow_id: process.env.LOGIN_OTP_TEMPLATE_ID,
        variables: ['var'], // OTP
      },
      reset_password_otp: {
        flow_id: process.env.RESET_PASSWORD_OTP_TEMPLATE_ID,
        variables: ['var'], // OTP
      },
      booking_confirmation: {
        flow_id: process.env.BOOKING_CONFIRMATION_TEMPLATE_ID,
        variables: ['var1', 'var2', 'var3'], // Name, Hotel Name, Booking ID
      }
    }
  };