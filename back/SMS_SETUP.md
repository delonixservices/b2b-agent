# SMS Setup Guide

This application uses MSG91 for sending SMS OTPs. Follow these steps to configure SMS functionality:

## Required Environment Variables

Add these variables to your `.env` file:

```env
# SMS Configuration (MSG91)
SMS_AUTH_KEY=your_msg91_auth_key_here
SENDERID=your_sender_id_here

# SMS Template IDs (MSG91 Flow IDs)
LOGIN_OTP_TEMPLATE_ID=your_login_otp_flow_id_here
RESET_PASSWORD_OTP_TEMPLATE_ID=your_reset_password_otp_flow_id_here
BOOKING_CONFIRMATION_TEMPLATE_ID=your_booking_confirmation_flow_id_here
```

## MSG91 Setup Steps

1. **Create MSG91 Account**: Sign up at [MSG91](https://msg91.com/)

2. **Get Auth Key**: 
   - Go to your MSG91 dashboard
   - Copy your Auth Key from the API section

3. **Set Sender ID**:
   - Configure your sender ID (usually 6 characters)
   - This will appear as the sender name in SMS

4. **Create Flow Templates**:
   - Create a flow for login OTP
   - Create a flow for password reset OTP
   - Note down the Flow IDs for each template

## Template Variables

The SMS templates expect these variables:

- **Login OTP**: `{var}` - The OTP code
- **Password Reset OTP**: `{var}` - The OTP code
- **Booking Confirmation**: `{var1}` (Name), `{var2}` (Hotel), `{var3}` (Booking ID)

## Development Mode

In development mode (`NODE_ENV=development`), if SMS sending fails, the system will fall back to using a hardcoded OTP (`111111`) for testing purposes.

## API Endpoints

### OTP for Signup
- **POST** `/auth/send-otp`
- **Body**: `{ "phone": "1234567890" }`

### Verify OTP for Signup
- **POST** `/auth/verify-otp`
- **Body**: `{ "phone": "1234567890", "otp": "123456" }`

### Password Reset OTP
- **POST** `/auth/send-password-reset-otp`
- **Body**: `{ "phone": "1234567890" }`

### Reset Password
- **POST** `/auth/reset-password`
- **Body**: `{ "phone": "1234567890", "otp": "123456", "newPassword": "newpassword123" }`

## Features

- ✅ Dynamic OTP generation
- ✅ SMS delivery via MSG91
- ✅ OTP expiration (5 minutes)
- ✅ Fallback mode for development
- ✅ Password reset functionality
- ✅ Support for both companies and employees 