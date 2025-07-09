# API Error Handling Documentation

## Overview

This document describes the error handling improvements made to the B2B Agent backend to properly handle external API errors and provide better error responses to clients.

## Problem

The external hotel API was returning 202 status codes with error information in the response body (containing `errorCode` and `errorMsg` fields), but the application was not properly detecting and handling these error responses. This resulted in:

1. Generic error messages to clients
2. Poor debugging information
3. Inconsistent error handling across different API endpoints

## Solution

### 1. Enhanced API Utility (`utils/api.js`)

Added comprehensive error detection in the `Api.post()` method:

```javascript
// Check for error codes in the response data
if (response.data && (response.data.errorCode || response.data.errorMsg)) {
  console.error('=== API ERROR RESPONSE DETECTED ===');
  console.error('Error Code:', response.data.errorCode);
  console.error('Error Message:', response.data.errorMsg);
  
  const errorMessage = response.data.errorMsg || `API Error: ${response.data.errorCode || 'Unknown error'}`;
  const apiError = new Error(errorMessage);
  apiError.name = 'APIError';
  apiError.errorCode = response.data.errorCode;
  apiError.errorMsg = response.data.errorMsg;
  apiError.status = response.status;
  apiError.responseData = response.data;
  throw apiError;
}
```

### 2. Improved Controller Error Handling

Updated all controller functions to handle different types of errors:

#### API Errors (`error.name === 'APIError'`)
- Returns 500 status with specific error message
- Includes error code and message from external API
- Provides user-friendly error message

#### Timeout Errors
- Returns 504 status (Gateway Timeout)
- Indicates request took too long to complete
- Suggests retrying the request

#### Network Errors (`ECONNREFUSED`, `ENOTFOUND`)
- Returns 503 status (Service Unavailable)
- Indicates connection issues
- Suggests trying again later

#### Generic Errors
- Returns 500 status with error message
- Provides fallback error handling

### 3. Updated Endpoints

The following endpoints now have improved error handling:

1. **Search Hotels** (`/api/hotels/search`)
   - Handles API errors from external hotel search service
   - Provides specific error messages for different failure scenarios

2. **Hotel Suggestions** (`/api/hotels/suggest`)
   - Handles API errors from external autosuggest service
   - Graceful fallback when suggestion service is unavailable

3. **Search Packages** (`/api/hotels/searchPackages`)
   - Handles API errors when fetching hotel packages
   - Better error messages for package search failures

4. **Booking Policy** (`/api/hotels/bookingpolicy`)
   - Handles API errors from booking policy service
   - Improved error handling for booking policy requests

## Error Response Format

All error responses now follow a consistent format:

```json
{
  "message": "User-friendly error message",
  "error": "Technical error details",
  "errorCode": "API_ERROR_CODE" // Only for API errors
}
```

## HTTP Status Codes

- **400**: Bad Request (validation errors)
- **404**: Not Found (no hotels/packages found)
- **500**: Internal Server Error (API errors, generic errors)
- **503**: Service Unavailable (network/connection errors)
- **504**: Gateway Timeout (timeout errors)

## Testing

A test script (`test_api_error_handling.js`) has been created to verify error handling:

```bash
node test_api_error_handling.js
```

## Benefits

1. **Better User Experience**: Users receive clear, actionable error messages
2. **Improved Debugging**: Detailed error logging for troubleshooting
3. **Consistent Error Handling**: All endpoints follow the same error handling pattern
4. **Graceful Degradation**: Application continues to function even when external services are unavailable
5. **Better Monitoring**: Clear error codes and messages for monitoring and alerting

## Future Improvements

1. Add retry logic for transient errors
2. Implement circuit breaker pattern for external API calls
3. Add metrics and monitoring for API error rates
4. Create fallback data sources for critical services 