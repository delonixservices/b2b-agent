# Authentication API Documentation

## Base URL
```
http://localhost:3334/api/auth
```

## Authentication Flow

### 1. Send OTP for Signup
**POST** `/send-otp`

Send OTP to the provided phone number for user registration.

**Request Body:**
```json
{
  "phone": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "1234567890"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "User already exists with this phone number"
}
```

### 2. Verify OTP for Signup
**POST** `/verify-otp`

Verify the OTP and create a temporary user account.

**Request Body:**
```json
{
  "phone": "1234567890",
  "otp": "111111"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

### 3. Complete Signup
**POST** `/complete-signup`

Complete the user registration with additional details and password.

**Request Body:**
```json
{
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "name": "John Doe",
  "agencyName": "Travel Agency",
  "numPeople": 10,
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signup completed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "phone": "1234567890",
      "name": "John Doe",
      "agencyName": "Travel Agency",
      "numPeople": 10
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "All fields are required"
}
```

### 4. Login
**POST** `/login`

Login with phone number and password.

**Request Body:**
```json
{
  "phone": "1234567890",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "phone": "1234567890",
      "name": "John Doe",
      "agencyName": "Travel Agency",
      "numPeople": 10
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send-otp` | Send OTP for signup |
| POST | `/verify-otp` | Verify OTP and create temp user |
| POST | `/complete-signup` | Complete signup with details |
| POST | `/login` | Login with phone and password |

## Notes

- **OTP**: For demo purposes, the OTP is hardcoded as `111111`
- **Token Expiry**: 
  - Temporary token: 10 minutes
  - Login token: 7 days
- **Password**: Passwords are hashed using bcrypt
- **Phone Number**: Must be unique in the system

## Testing with cURL

### Send OTP
```bash
curl -X POST http://localhost:3334/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:3334/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890", "otp": "111111"}'
```

### Complete Signup
```bash
curl -X POST http://localhost:3334/api/auth/complete-signup \
  -H "Content-Type: application/json" \
  -d '{
    "tempToken": "YOUR_TEMP_TOKEN",
    "name": "John Doe",
    "agencyName": "Travel Agency",
    "numPeople": 10,
    "password": "securepassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3334/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890", "password": "securepassword123"}'
``` 