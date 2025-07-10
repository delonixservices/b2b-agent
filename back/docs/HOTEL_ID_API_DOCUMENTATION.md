# Hotel ID API Documentation

## Overview
The Hotel ID API provides functionality to extract hotel IDs from hotel names by using the autosuggest service. This API is particularly useful when users select a specific hotel instead of a city, as it extracts the city name from the hotel name and retrieves the appropriate hotel ID for search operations.

## API Endpoint

### POST /api/hotels/get-hotel-id

Get hotel ID from hotel name by extracting city and using autosuggest service.

#### Request Body

```json
{
  "hotelName": "New Haven Hotel Greater Kailash - New Delhi, E - 512, Greater Kailash Part - 2, New Delhi"
}
```

#### Parameters

- `hotelName` (string, required): Full hotel name including location information

#### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Hotel ID retrieved successfully",
  "data": {
    "hotelName": "New Haven Hotel Greater Kailash - New Delhi",
    "hotelId": "3H8m",
    "type": "hotel",
    "cityName": "New Delhi",
    "transaction_identifier": "c36413f8b1c54223b83d3e01ca488f5e",
    "displayName": "New Haven Hotel Greater Kailash - New Delhi"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Hotel name is required and must be a non-empty string"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Hotel not found in the specified city",
  "data": {
    "hotelName": "Non-existent Hotel",
    "cityName": "New Delhi",
    "availableHotels": 5,
    "availableCities": 2
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "message": "Hotel search service temporarily unavailable",
  "error": "External API error",
  "errorCode": "API_ERROR_001"
}
```

#### Response Fields

- `success` (boolean): Indicates if the request was successful
- `message` (string): Human-readable message about the operation result
- `data` (object): Contains the hotel information
  - `hotelName` (string): The matched hotel name
  - `hotelId` (string): The unique hotel identifier
  - `type` (string): Type of result (usually "hotel")
  - `cityName` (string): Extracted city name from the hotel name
  - `transaction_identifier` (string): Unique transaction identifier
  - `displayName` (string): Formatted display name for the hotel

## Features

1. **City Extraction**: Automatically extracts city name from hotel name (after the last comma)
2. **Autosuggest Integration**: Uses the existing autosuggest service to find hotel matches
3. **Caching Support**: Leverages Redis caching for improved performance
4. **Error Handling**: Comprehensive error handling with fallback mechanisms
5. **Exact and Partial Matching**: Supports both exact and partial hotel name matching

## How It Works

1. **Input Processing**: Takes a hotel name as input
2. **City Extraction**: Splits the hotel name by commas and extracts the last part as the city name
3. **Autosuggest Query**: Uses the extracted city name to query the autosuggest service
4. **Hotel Matching**: Searches through the autosuggest results to find the best hotel match
5. **ID Retrieval**: Returns the hotel ID and related information

## Usage Example

```javascript
// Frontend example
const response = await fetch('/api/hotels/get-hotel-id', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_token_here'
  },
  body: JSON.stringify({
    hotelName: 'New Haven Hotel Greater Kailash - New Delhi, E - 512, Greater Kailash Part - 2, New Delhi'
  })
});

const data = await response.json();
console.log('Hotel ID:', data.data.hotelId);
```

## Integration with Search

This API is designed to work seamlessly with the existing hotel search functionality:

1. When a user selects a hotel from autosuggest, this API is called to get the hotel ID
2. The hotel ID is then used in the search request to find specific hotel packages
3. The search results will be filtered to show only the selected hotel

## Error Handling

The API handles various error scenarios:

- **Invalid Input**: Returns 400 for missing or invalid hotel names
- **Hotel Not Found**: Returns 404 when no matching hotel is found
- **Service Unavailable**: Returns 500 for external API errors
- **Timeout Errors**: Returns 504 for request timeouts
- **Network Errors**: Returns 503 for connection issues

## Caching

The API uses Redis caching to improve performance:

- Cache key format: `autosuggest:{cityName}`
- Cache duration: 2 hours (7200 seconds)
- Cache is automatically invalidated on errors

## Authentication

This endpoint requires authentication:
- Requires valid JWT token in Authorization header
- Supports both company and employee access
- Token must be active and not expired

## Rate Limiting

The API respects the same rate limiting as other hotel endpoints:
- Rate limit window: 15 minutes
- Maximum requests per window: 100 requests

## Notes

- Hotel names should include city information for better matching
- The API automatically handles hotel names with or without commas
- Fallback mechanisms ensure graceful degradation on errors
- All operations are logged for debugging and monitoring purposes 