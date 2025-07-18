// Environment utility for frontend
export const isDevelopment = process.env.NODE_ENV === 'development'

// Get environment-specific messages
export const getOtpMessage = (phone: string) => {
  if (isDevelopment) {
    return {
      main: `OTP sent to ${phone}`,
      sub: '(Demo OTP: 111111)'
    }
  }
  return {
    main: `OTP sent to ${phone}`,
    sub: 'Check your SMS for the OTP'
  }
} 