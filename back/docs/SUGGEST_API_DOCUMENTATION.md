# Suggest API Documentation

## Overview
The Suggest API provides autosuggest functionality by making requests to an external API, processing the response data, and returning formatted results with pagination support.

## Environment Variables Required

Add these to your `.env` file:

```env
HOTEL_APIURL=https://api.example.com
HOTEL_APIAUTH=your-external-api-auth-key
```

## API Endpoint

### POST /api/hotels/suggest

Get autosuggest results for hotels, cities, and POIs.

#### Request Body

```json
{
  "query": "search term",
  "page": 1,
  "perPage": 10,
  "currentItemsCount": 0
}
```

#### Parameters

- `query` (string, required): Search term (minimum 3 characters)
- `page` (number, optional): Page number (default: 1, minimum: 1)
- `perPage` (number, optional): Items per page (default: 10, minimum: 10, maximum: 50)
- `currentItemsCount` (number, optional): Current items count for pagination (default: 0)

#### Response Format

```json
{
  "data": [
    {
      "id": "region_id",
      "name": "Location Name",
      "displayName": "Location Name | (Hotel Count)",
      "hotelCount": 150,
      "transaction_identifier": "unique_transaction_id"
    }
  ],
  "status": "complete|in-progress",
  "currentItemsCount": 10,
  "totalItemsCount": 25,
  "page": 1,
  "perPage": 10,
  "totalPages": 3
}
```

#### Response Fields

- `data` (array): Array of suggestion items
  - `id`: Region or location ID
  - `name`: Location name
  - `displayName`: Formatted display name
  - `hotelCount`: Number of hotels in the area
  - `transaction_identifier`: Unique transaction identifier
- `status` (string): "complete" or "in-progress"
- `currentItemsCount` (number): Number of items in current response
- `totalItemsCount` (number): Total number of items available
- `page` (number): Current page number
- `perPage` (number): Items per page
- `totalPages` (number): Total number of pages

#### Error Responses

**400 Bad Request**
```json
{
  "message": "perPage should not be greater than 50"
}
```

**500 Internal Server Error**
```json
{
  "message": "Internal server error"
}
```

## Features

1. **External API Integration**: Makes requests to configured external API
2. **Data Processing**: Processes and formats response data
3. **Pagination Support**: Handles pagination with configurable page sizes
4. **Input Validation**: Validates query length and pagination parameters
5. **Error Handling**: Comprehensive error handling and logging
6. **Multiple Data Types**: Supports cities, hotels, and POIs

## Usage Example

```javascript
// Frontend example
const response = await fetch('/api/hotels/suggest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'new york',
    page: 1,
    perPage: 20,
    currentItemsCount: 0
  })
});

const data = await response.json();
console.log(data);
```

## Notes

- Query must be at least 3 characters long
- Maximum 50 items per page allowed
- External API must be configured with proper authentication
- No Redis caching implemented (as requested)
- Supports both cities and hotels in the same response 