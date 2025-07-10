# Hotel ID-Based Pagination Feature

## Overview

This feature allows the frontend to receive a list of hotel IDs from the URL, display the first 50 hotels, and then provide a "Load More" button to fetch the next 50 hotels in batches. This enables efficient pagination through large sets of specific hotels.

## How It Works

### 1. URL Structure

The listing page accepts hotel IDs through the URL parameter `hotelIds`:

```
/hotels/listing?area=...&checkIn=...&checkOut=...&rooms=...&adults=...&hotelIds=["hotel_001","hotel_002",...,"hotel_150"]
```

### 2. Frontend Processing

1. **Initial Load**: The frontend extracts hotel IDs from the URL and splits them into batches of 50
2. **First Request**: Sends the first 50 hotel IDs to the backend API
3. **Display**: Shows the first 50 hotels with a "Load More" button
4. **Load More**: When clicked, sends the next 50 hotel IDs to fetch more hotels
5. **Progress Tracking**: Shows progress bar and batch information

### 3. Backend Processing

1. **Validation**: Validates the hotel IDs array in the request
2. **API Call**: Sends the hotel IDs to the external hotel search API
3. **Markup Application**: Applies owner markup to all hotel packages
4. **Response**: Returns the processed hotels with pagination information

## Implementation Details

### Frontend Components

#### `page.tsx` (Listing Page)
- Manages hotel ID batches and pagination state
- Handles "Load More" functionality
- Tracks loaded batches and progress

#### `HotelList.tsx`
- Displays hotels with pagination controls
- Shows progress bar for batch loading
- Handles loading states and completion messages

#### `hotelUtils.ts`
- `splitHotelIdsIntoBatches()`: Splits hotel IDs into 50-item batches
- `getHotelIdsForPage()`: Gets hotel IDs for a specific page
- `generateListingUrlWithHotelIds()`: Creates URLs with hotel IDs

### Backend Controller

#### `hotelConrtoller.js` - `searchHotels` function
- Validates hotel IDs parameter
- Sends hotel IDs to external API via `hotel_id_list`
- Handles pagination calculation based on total hotel IDs
- Applies markup to hotel packages

## Usage Examples

### 1. Small Hotel List (≤50 hotels)
```
hotelIds=["hotel_001","hotel_002","hotel_003"]
```
- All hotels loaded on first page
- No "Load More" button
- Shows "End of results" message

### 2. Medium Hotel List (51-100 hotels)
```
hotelIds=["hotel_001",...,"hotel_075"]
```
- First 50 hotels loaded initially
- "Load More" button appears
- Clicking loads remaining 25 hotels
- Shows progress: "Loaded 1 of 2 batches"

### 3. Large Hotel List (>100 hotels)
```
hotelIds=["hotel_001",...,"hotel_250"]
```
- First 50 hotels loaded initially
- "Load More" button for remaining batches
- Progress bar shows completion percentage
- Multiple "Load More" clicks to load all hotels

## API Request Format

### Request Body
```json
{
  "details": [...],
  "area": {...},
  "checkindate": "2024-01-15",
  "checkoutdate": "2024-01-17",
  "page": 1,
  "perPage": 50,
  "currentHotelsCount": 0,
  "hotelIds": ["hotel_001", "hotel_002", ..., "hotel_050"],
  "filters": {...}
}
```

### Response Format
```json
{
  "success": true,
  "message": "Hotels retrieved successfully",
  "data": {
    "hotels": [...],
    "pagination": {
      "currentHotelsCount": 50,
      "totalHotelsCount": 150,
      "totalPages": 3,
      "pollingStatus": "in-progress",
      "page": 1,
      "perPage": 50
    },
    "price": {
      "minPrice": 1000,
      "maxPrice": 5000
    }
  }
}
```

## Testing

### Test Page
Visit `/hotels/test-hotel-ids` to test the functionality with sample hotel IDs.

### Sample Hotel IDs for Testing
- **Small List**: `hotel_001,hotel_002,hotel_003,hotel_004,hotel_005`
- **Medium List**: `hotel_001,hotel_002,...,hotel_060` (60 hotels)
- **Large List**: `hotel_001,hotel_002,...,hotel_150` (150 hotels)

## Benefits

1. **Efficient Pagination**: Load hotels in manageable batches
2. **Better UX**: Progressive loading with progress indicators
3. **Reduced API Load**: Smaller, focused API requests
4. **Flexible Search**: Search specific hotel sets from external sources
5. **Performance**: Avoid loading all hotels at once

## Error Handling

- **Invalid Hotel IDs**: Returns 400 error with validation details
- **API Failures**: Graceful fallback with error messages
- **Network Issues**: Retry mechanisms and timeout handling
- **Empty Results**: User-friendly "No hotels found" messages

## Future Enhancements

1. **Caching**: Cache hotel data for frequently accessed hotel sets
2. **Parallel Loading**: Load multiple batches simultaneously
3. **Smart Batching**: Dynamic batch sizes based on hotel availability
4. **Search Within Results**: Filter loaded hotels without new API calls 