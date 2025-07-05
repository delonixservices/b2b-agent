# Booking Policy API Documentation

## Overview
The Booking Policy API allows clients to retrieve booking policies for hotel packages. This endpoint processes booking requests and returns detailed policy information including pricing, cancellation terms, and package details.

## Endpoint
```
POST /api/hotels/bookingpolicy
```

## Request Format

### Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "hotelId": "68690388113a07eab6dfefb7",
  "bookingKey": "1",
  "search": {
    "check_out_date": "2025-07-06",
    "child_count": 0,
    "room_count": 1,
    "source_market": "IN",
    "currency": "INR",
    "locale": "en-US",
    "hotel_id_list": ["104954"],
    "adult_count": 2,
    "check_in_date": "2025-07-05"
  },
  "transaction_id": "bc191b7863814f4c9f06ae3333823d39"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hotelId` | String | Yes | Unique identifier for the hotel |
| `bookingKey` | String | Yes | Booking key for the specific package |
| `search` | Object | Yes | Search parameters for the booking |
| `transaction_id` | String | Yes | Unique transaction identifier |

### Search Object Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `check_in_date` | String | Yes | Check-in date (YYYY-MM-DD format) |
| `check_out_date` | String | Yes | Check-out date (YYYY-MM-DD format) |
| `adult_count` | Number | Yes | Number of adults |
| `child_count` | Number | Yes | Number of children |
| `room_count` | Number | Yes | Number of rooms |
| `source_market` | String | No | Source market code (default: "IN") |
| `currency` | String | No | Currency code (default: "INR") |
| `locale` | String | No | Locale code (default: "en-US") |
| `hotel_id_list` | Array | No | List of hotel IDs |

## Response Format

### Success Response (200)
```json
{
  "data": {
    "booking_policy_id": "b5dcbfc1c9c04148a1b3cf2b35eac07d",
    "package": {
      "rate_type": "Dynamic",
      "booking_key": "1",
      "chargeable_rate_currency": "INR",
      "hotel_id": "104954",
      "room_details": {
        "supplier_description": "OYO",
        "room_code": 1,
        "room_view": "",
        "description": "Classic",
        "rate_plan_code": 0,
        "non_refundable": false,
        "beds": {},
        "food": "",
        "room_type": "Classic"
      },
      "room_rate_currency": "INR",
      "client_commission": 55.800000000000004,
      "client_commission_currency": "INR",
      "room_rate": 619.64,
      "taxes_and_fees": {
        "estimated_total": {
          "value": 74.36
        }
      },
      "indicative_market_rates": [
        {
          "market_rate_supplier": "",
          "market_rate": 694,
          "market_rate_currency": "INR"
        }
      ],
      "chargeable_rate": 1326.32,
      "base_amount": 936.92,
      "service_component": 389.4,
      "gst": 202.32
    },
    "event_id": "",
    "statusToken": "",
    "session_id": "",
    "cancellation_policy": {
      "cancellation_policies": [
        {
          "penalty_percentage": 0,
          "date_to": "",
          "date_from": ""
        }
      ],
      "remarks": "Incase of no show, no refund will be provided. For cancellation done prior 9 AM on 5 July,100% Refundable. For cancellation done post 9 AM on 5 July,Non Refundable. "
    }
  },
  "transaction_identifier": "bc191b7863814f4c9f06ae3333823d39",
  "id": "b5dcbfc1c9c04148a1b3cf2b35eac07d",
  "api": "post::bookingpolicy",
  "version": "v1"
}
```

### Response Parameters

#### Data Object
| Parameter | Type | Description |
|-----------|------|-------------|
| `booking_policy_id` | String | Unique booking policy identifier |
| `package` | Object | Package details including pricing and room information |
| `event_id` | String | Event identifier (if applicable) |
| `statusToken` | String | Status token for tracking |
| `session_id` | String | Session identifier |
| `cancellation_policy` | Object | Cancellation policy details |

#### Package Object
| Parameter | Type | Description |
|-----------|------|-------------|
| `rate_type` | String | Type of rate (e.g., "Dynamic", "Static") |
| `booking_key` | String | Booking key for the package |
| `chargeable_rate_currency` | String | Currency for chargeable rate |
| `hotel_id` | String | Hotel identifier |
| `room_details` | Object | Detailed room information |
| `room_rate_currency` | String | Currency for room rate |
| `client_commission` | Number | Commission amount |
| `client_commission_currency` | String | Currency for commission |
| `room_rate` | Number | Base room rate |
| `taxes_and_fees` | Object | Tax and fee breakdown |
| `indicative_market_rates` | Array | Market rate information |
| `chargeable_rate` | Number | Total chargeable amount |
| `base_amount` | Number | Base amount before taxes |
| `service_component` | Number | Service charge component |
| `gst` | Number | GST amount |

#### Room Details Object
| Parameter | Type | Description |
|-----------|------|-------------|
| `supplier_description` | String | Supplier's room description |
| `room_code` | Number | Room code |
| `room_view` | String | Room view description |
| `description` | String | Room description |
| `rate_plan_code` | Number | Rate plan code |
| `non_refundable` | Boolean | Whether the rate is non-refundable |
| `beds` | Object | Bed configuration |
| `food` | String | Food/meal plan |
| `room_type` | String | Type of room |

#### Cancellation Policy Object
| Parameter | Type | Description |
|-----------|------|-------------|
| `cancellation_policies` | Array | Array of cancellation policy rules |
| `remarks` | String | Additional cancellation policy remarks |

#### Cancellation Policy Rule
| Parameter | Type | Description |
|-----------|------|-------------|
| `penalty_percentage` | Number | Penalty percentage for cancellation |
| `date_to` | String | End date for this policy rule |
| `date_from` | String | Start date for this policy rule |

#### Response Metadata
| Parameter | Type | Description |
|-----------|------|-------------|
| `transaction_identifier` | String | Transaction identifier |
| `id` | String | Response identifier (same as booking_policy_id) |
| `api` | String | API endpoint identifier |
| `version` | String | API version |

## Error Responses

### Validation Error (400)
```json
{
  "message": "Validation failed..."
}
```

### Hotel Not Found (404)
```json
{
  "message": "Hotel not found"
}
```

### Package Not Found (404)
```json
{
  "message": "Package not found for the given booking key"
}
```

### Server Error (500)
```json
{
  "message": "Unable to get the booking policy - Invalid API response"
}
```

## Database Schema

The booking policy data is stored in the `BookingPolicy` collection with the following schema:

```javascript
{
  booking_policy: Object,        // The complete booking policy data
  search: Object,               // Search parameters used
  transaction_identifier: String, // Transaction identifier
  hotel: ObjectId,              // Reference to hotel document
  booking_policy_id: String,    // Unique booking policy ID
  event_id: String,             // Event identifier
  statusToken: String,          // Status token
  session_id: String,           // Session identifier
  created_at: Date,             // Creation timestamp
  updated_at: Date              // Last update timestamp
}
```

## Usage Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const bookingPolicyRequest = {
  hotelId: "68690388113a07eab6dfefb7",
  bookingKey: "1",
  search: {
    check_out_date: "2025-07-06",
    child_count: 0,
    room_count: 1,
    source_market: "IN",
    currency: "INR",
    locale: "en-US",
    hotel_id_list: ["104954"],
    adult_count: 2,
    check_in_date: "2025-07-05"
  },
  transaction_id: "bc191b7863814f4c9f06ae3333823d39"
};

try {
  const response = await axios.post('/api/hotels/bookingpolicy', bookingPolicyRequest);
  console.log('Booking Policy:', response.data);
} catch (error) {
  console.error('Error:', error.response.data);
}
```

### Frontend (React/TypeScript)
```typescript
import { hotelApi } from '../services/hotelApi';

const getBookingPolicy = async () => {
  try {
    const requestData = {
      hotelId: "68690388113a07eab6dfefb7",
      bookingKey: "1",
      search: {
        check_out_date: "2025-07-06",
        child_count: 0,
        room_count: 1,
        source_market: "IN",
        currency: "INR",
        locale: "en-US",
        hotel_id_list: ["104954"],
        adult_count: 2,
        check_in_date: "2025-07-05"
      },
      transaction_id: "bc191b7863814f4c9f06ae3333823d39"
    };

    const response = await hotelApi.getBookingPolicy(requestData);
    console.log('Booking Policy:', response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Notes

1. **Transaction ID**: Each request must include a unique transaction identifier for tracking purposes.
2. **Booking Key**: The booking key must correspond to an existing package for the specified hotel.
3. **Markup Application**: The system automatically applies owner markup to the package pricing.
4. **Data Persistence**: All booking policy requests are stored in the database for future reference.
5. **Error Handling**: The API provides detailed error messages for debugging purposes.

## Testing

You can test the API using the provided test file:

```bash
cd back
node test_booking_policy.js
```

This will send a test request and validate the response structure. 