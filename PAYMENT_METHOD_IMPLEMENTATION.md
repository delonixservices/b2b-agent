# Payment Method Selection Implementation Guide

## Overview

This guide explains how to implement a payment method selection system that allows users to choose between wallet payment and payment gateway (CCAvenue) for hotel bookings.

## Features Implemented

### 1. Backend APIs

#### New API Endpoint: `POST /api/hotels/process-wallet-payment`
- **Purpose**: Process payments directly from user's wallet
- **Authentication**: Required (JWT token)
- **Request Body**:
  ```json
  {
    "transactionId": "string",
    "bookingId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Payment processed successfully via wallet",
    "data": {
      "transactionId": "string",
      "bookingId": "string",
      "amount": 5000,
      "currency": "INR",
      "paymentMethod": "wallet",
      "status": "confirmed",
      "walletTransaction": {...}
    }
  }
  ```

#### Existing API Endpoint: `GET /api/hotels/process-payment/:id`
- **Purpose**: Redirect to CCAvenue payment gateway
- **Authentication**: Not required (public endpoint)
- **Response**: HTML form that auto-submits to CCAvenue

### 2. Frontend Components

#### PaymentMethodSelector Component
- **Location**: `fron/app/components/PaymentMethodSelector.tsx`
- **Features**:
  - Real-time wallet balance display
  - Sufficient balance validation
  - Visual payment method selection
  - Responsive design with Tailwind CSS

#### PaymentSuccess Component
- **Location**: `fron/app/components/PaymentSuccess.tsx`
- **Features**:
  - Success confirmation display
  - Booking details summary
  - Action buttons (Download, Email, Dashboard)
  - Clean, user-friendly interface

### 3. Updated Review Page
- **Location**: `fron/app/hotels/review/page.tsx`
- **Changes**:
  - Added payment method selection flow
  - Integrated wallet payment processing
  - Added success state handling
  - Enhanced error handling

## Implementation Flow

### 1. User Journey

```
1. User fills booking details
2. Clicks "Confirm Booking"
3. System creates prebook transaction
4. Payment method selector appears
5. User chooses payment method:
   - Wallet: Instant payment processing
   - Gateway: Redirect to CCAvenue
6. Payment processing
7. Success confirmation
```

### 2. Payment Method Selection

#### Wallet Payment Flow:
```
1. Check wallet balance
2. Validate sufficient funds
3. Process payment via wallet service
4. Update transaction status
5. Confirm booking with external API
6. Send notifications (SMS/Email)
7. Generate invoice/voucher
8. Show success page
```

#### Gateway Payment Flow:
```
1. Redirect to CCAvenue payment page
2. User completes payment on CCAvenue
3. CCAvenue redirects back with response
4. Process payment response
5. Confirm booking with external API
6. Send notifications (SMS/Email)
7. Generate invoice/voucher
8. Show success page
```

## Code Structure

### Backend Files Modified:

1. **`back/controllers/hotelConrtoller.js`**
   - Added `processWalletPayment` function
   - Integrated wallet service
   - Added payment response handling
   - Added notification sending

2. **`back/routes/hotels.js`**
   - Added wallet payment route
   - Applied authentication middleware

3. **`back/services/walletService.js`**
   - Existing wallet operations
   - Balance checking
   - Payment processing

### Frontend Files Modified:

1. **`fron/app/components/PaymentMethodSelector.tsx`** (New)
   - Payment method selection UI
   - Wallet balance display
   - Validation logic

2. **`fron/app/components/PaymentSuccess.tsx`** (New)
   - Success confirmation UI
   - Booking details display
   - Action buttons

3. **`fron/app/hotels/review/page.tsx`**
   - Added payment method selection
   - Integrated wallet payment
   - Added success handling

4. **`fron/app/services/hotelApi.ts`**
   - Added `processWalletPayment` function
   - Updated API endpoints

## Key Features

### 1. Real-time Wallet Balance
- Fetches current wallet balance
- Shows available funds
- Validates sufficient balance
- Displays shortfall if insufficient

### 2. Payment Method Validation
- Wallet: Checks balance before allowing selection
- Gateway: Always available
- Clear visual feedback for each option

### 3. Error Handling
- Network errors
- Insufficient balance
- Payment failures
- Authentication errors
- Booking failures with automatic refund

### 4. User Experience
- Clean, intuitive interface
- Loading states
- Success confirmations
- Clear error messages
- Responsive design

## Security Features

### 1. Authentication
- All wallet operations require JWT token
- User authorization checks
- Transaction ownership validation

### 2. Payment Security
- Wallet balance validation
- Transaction integrity checks
- Automatic refund on booking failure
- Secure API communication

### 3. Data Protection
- Sensitive data not logged
- Secure payment processing
- Encrypted communication

## Testing

### 1. Wallet Payment Testing
```bash
# Test wallet balance
curl -X GET "http://localhost:3334/api/hotels/wallet/balance" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test wallet payment
curl -X POST "http://localhost:3334/api/hotels/process-wallet-payment" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "TRANSACTION_ID",
    "bookingId": "BOOKING_ID"
  }'
```

### 2. Gateway Payment Testing
```bash
# Test payment gateway redirect
curl -X GET "http://localhost:3334/api/hotels/process-payment/BOOKING_ID"
```

## Configuration

### 1. Environment Variables
```env
# Wallet Configuration
WALLET_ENABLED=true
WALLET_CURRENCY=INR

# Payment Gateway Configuration
CCAVENUE_MERCHANT_ID=your_merchant_id
CCAVENUE_ACCESS_CODE=your_access_code
CCAVENUE_WORKING_KEY=your_working_key
CCAVENUE_API_URL=https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction
```

### 2. Frontend Configuration
```typescript
// API Base URL
const API_BASE_URL = 'http://localhost:3334'

// Payment Gateway URL
const PAYMENT_GATEWAY_URL = 'http://localhost:3334/api/hotels/process-payment'
```

## Deployment Considerations

### 1. Production Setup
- Use production CCAvenue credentials
- Enable HTTPS for all communications
- Set up proper error monitoring
- Configure email/SMS services

### 2. Performance Optimization
- Cache wallet balance
- Optimize API calls
- Use CDN for static assets
- Implement proper loading states

### 3. Monitoring
- Payment success/failure rates
- Wallet usage statistics
- Gateway performance metrics
- Error tracking and alerting

## Troubleshooting

### Common Issues:

1. **Wallet Balance Not Loading**
   - Check authentication token
   - Verify wallet service is running
   - Check network connectivity

2. **Payment Processing Fails**
   - Verify transaction exists
   - Check wallet balance
   - Validate booking session hasn't expired

3. **Gateway Redirect Issues**
   - Check CCAvenue credentials
   - Verify payment URL configuration
   - Check CORS settings

### Debug Steps:

1. Check browser console for errors
2. Verify API responses
3. Check server logs
4. Validate payment data
5. Test with different payment amounts

## Future Enhancements

### 1. Additional Payment Methods
- UPI integration
- Net banking
- Digital wallets (Paytm, PhonePe)
- International payment gateways

### 2. Enhanced Features
- Partial wallet payments
- Payment splitting
- Recurring payments
- Payment scheduling

### 3. Analytics
- Payment method preferences
- Success rate tracking
- User behavior analysis
- Revenue optimization

## Support

For technical support or questions about the payment method implementation:

1. Check the API documentation
2. Review server logs
3. Test with sample data
4. Contact the development team

---

This implementation provides a complete, secure, and user-friendly payment method selection system for the B2B hotel booking platform. 