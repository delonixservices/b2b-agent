# Wallet API Documentation

## Overview

The Wallet API provides functionality for companies to manage their wallet balances and make payments using wallet funds instead of payment gateways. This feature allows companies to pre-load their accounts and make instant bookings without external payment processing.

## Features

- **Wallet Balance Management**: Companies can view their current wallet balance
- **Wallet Payments**: Make hotel bookings using wallet balance instead of payment gateway
- **Admin Wallet Management**: Admins can add/deduct funds from company wallets
- **Payment Eligibility Check**: Check if wallet payment is possible for a booking
- **Automatic Refunds**: Failed bookings automatically refund wallet amounts

## Base URL
```
http://localhost:3334/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## User Types

### Company User
- Can view own wallet balance
- Can make wallet payments for bookings
- Can check payment eligibility

### Employee User
- Can view company wallet balance
- Can make wallet payments for bookings (deducts from company wallet)
- Can check payment eligibility

### Admin User
- Can view all company wallet balances
- Can add/deduct funds from any company wallet
- Can manage wallet operations

## API Endpoints

### 1. Get Wallet Balance (Company/Employee)
```
GET /hotels/wallet/balance
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Wallet balance retrieved successfully",
  "data": {
    "companyId": "60f7b3b3b3b3b3b3b3b3b3b",
    "companyName": "ABC Travel Agency",
    "wallet": {
      "balance": 5000,
      "currency": "INR",
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 2. Check Wallet Payment Eligibility
```
POST /hotels/wallet/check-eligibility
```
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "transactionId": "60f7b3b3b3b3b3b3b3b3b3b",
  "bookingId": "booking_123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet payment eligibility checked",
  "data": {
    "eligible": true,
    "requiredAmount": 2500,
    "currentBalance": 5000,
    "currency": "INR",
    "insufficientAmount": 0
  }
}
```

### 3. Process Wallet Payment
```
POST /hotels/wallet/payment
```
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "transactionId": "60f7b3b3b3b3b3b3b3b3b3b",
  "bookingId": "booking_123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet payment and booking completed successfully",
  "data": {
    "bookingId": "60f7b3b3b3b3b3b3b3b3b3b",
    "status": "confirmed",
    "paymentMethod": "wallet",
    "amount": 2500,
    "walletTransaction": {
      "companyId": "60f7b3b3b3b3b3b3b3b3b3b",
      "companyName": "ABC Travel Agency",
      "oldBalance": 5000,
      "newBalance": 2500,
      "amount": 2500,
      "reason": "Booking payment - booking_123456",
      "currency": "INR",
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    },
    "voucherUrl": "http://localhost:3000/hotels/hotelvoucher?id=60f7b3b3b3b3b3b3b3b3b3b"
  }
}
```

## Admin Wallet Management APIs

### 4. Get All Companies with Wallet Balances
```
GET /owner/companies/wallets?page=1&limit=10&status=verified
```
**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by company status

**Response:**
```json
{
  "success": true,
  "message": "Companies with wallet balances retrieved successfully",
  "data": {
    "companies": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b",
        "name": "ABC Travel Agency",
        "phone": "1234567890",
        "companyNumber": 1001,
        "status": "verified",
        "isActive": true,
        "wallet": {
          "balance": 5000,
          "currency": "INR",
          "lastUpdated": "2024-01-15T10:30:00.000Z"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 5. Get Company Wallet Balance (Admin)
```
GET /owner/companies/:companyId/wallet
```
**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Wallet balance retrieved successfully",
  "data": {
    "companyId": "60f7b3b3b3b3b3b3b3b3b3b",
    "companyName": "ABC Travel Agency",
    "wallet": {
      "balance": 5000,
      "currency": "INR",
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 6. Update Company Wallet Balance (Admin)
```
PUT /owner/companies/:companyId/wallet
```
**Headers:** `Authorization: Bearer <admin_token>`

**Body:**
```json
{
  "amount": 1000,
  "action": "add",
  "reason": "Monthly credit"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet credited successfully",
  "data": {
    "companyId": "60f7b3b3b3b3b3b3b3b3b3b",
    "companyName": "ABC Travel Agency",
    "oldBalance": 5000,
    "newBalance": 6000,
    "amount": 1000,
    "action": "add",
    "reason": "Monthly credit",
    "currency": "INR",
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

## Database Schema

### Company Model Updates
The Company schema has been extended with wallet fields:

```javascript
wallet: {
  balance: { type: Number, default: 0, min: 0 }, // Current wallet balance
  currency: { type: String, default: 'INR' }, // Currency for wallet
  lastUpdated: { type: Date, default: Date.now } // Last wallet update timestamp
}
```

## Payment Flow

### 1. Standard Payment Gateway Flow
1. User creates booking
2. Redirected to payment gateway
3. Payment processed externally
4. Booking confirmed after payment success

### 2. Wallet Payment Flow
1. User creates booking
2. Check wallet balance and eligibility
3. Process wallet payment (deduct from balance)
4. Confirm booking immediately
5. Send notifications and documents

## Error Handling

### Insufficient Balance
```json
{
  "success": false,
  "message": "Insufficient wallet balance",
  "data": {
    "requiredAmount": 2500,
    "currentBalance": 1000,
    "currency": "INR"
  }
}
```

### Booking Session Expired
```json
{
  "success": false,
  "message": "Booking session expired. Please try again."
}
```

### Invalid User Type
```json
{
  "success": false,
  "message": "Invalid user type for wallet payment"
}
```

## Security Features

- **Balance Validation**: Prevents over-drafting wallet
- **Session Validation**: Ensures booking sessions are valid
- **User Authorization**: Only authenticated companies/employees can access wallet
- **Admin Controls**: Only admins can modify wallet balances
- **Transaction Logging**: All wallet operations are logged
- **Automatic Refunds**: Failed bookings automatically refund wallet amounts

## Usage Examples

### Company Making Wallet Payment
```javascript
// 1. Check wallet balance
const balanceResponse = await fetch('/api/hotels/wallet/balance', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Check payment eligibility
const eligibilityResponse = await fetch('/api/hotels/wallet/check-eligibility', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    transactionId: 'transaction_id',
    bookingId: 'booking_id'
  })
});

// 3. Process wallet payment
const paymentResponse = await fetch('/api/hotels/wallet/payment', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    transactionId: 'transaction_id',
    bookingId: 'booking_id'
  })
});
```

### Admin Managing Company Wallet
```javascript
// Add funds to company wallet
const addFundsResponse = await fetch('/api/owner/companies/company_id/wallet', {
  method: 'PUT',
  headers: { 
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 1000,
    action: 'add',
    reason: 'Monthly credit'
  })
});

// Deduct funds from company wallet
const deductFundsResponse = await fetch('/api/owner/companies/company_id/wallet', {
  method: 'PUT',
  headers: { 
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 500,
    action: 'deduct',
    reason: 'Service charge'
  })
});
```

## Integration Notes

- Wallet payments bypass the external payment gateway
- All wallet transactions are logged for audit purposes
- Failed bookings automatically trigger wallet refunds
- Wallet balance is checked before processing payments
- Companies can use both wallet and payment gateway options
- Employee bookings deduct from their company's wallet balance

## Testing

### Test Wallet APIs
```bash
cd back
node test_wallet_apis.js
```

### Test Wallet Payment Flow
```bash
cd back
node test_wallet_payment.js
```

### Test Admin Wallet Management
```bash
cd back
node test_admin_wallet.js
``` 