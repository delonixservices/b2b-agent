# Markup API Documentation

## Overview
The Markup API allows owners/admins to manage markup rules for pricing calculations. Markups can be either fixed amounts or percentages and can be applied to different categories.

## Base URL
```
/api/owner
```

## Authentication
All endpoints require authentication with admin privileges. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Create Markup
**POST** `/markups`

Creates a new markup rule.

**Request Body:**
```json
{
  "name": "Standard Markup",
  "description": "Standard markup for all bookings",
  "type": "percentage", // "fixed" or "percentage"
  "value": 15 // percentage (0-100) or fixed amount
}
```

**Response:**
```json
{
  "success": true,
  "message": "Markup created successfully",
  "data": {
    "markup": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Standard Markup",
      "description": "Standard markup for all bookings",
      "type": "percentage",
      "value": 15,
      "isActive": true,
      "createdBy": "60f7b3b3b3b3b3b3b3b3b3b4",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### 2. Get All Markups
**GET** `/markups`

Retrieves all markups with optional filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `isActive` (optional): Filter by active status ("true"/"false")

**Response:**
```json
{
  "success": true,
  "message": "Markups retrieved successfully",
  "data": {
    "markups": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "name": "Standard Markup",
        "description": "Standard markup for all bookings",
        "type": "percentage",
        "value": 15,
        "isActive": true,
        "createdBy": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
          "name": "Admin User",
          "username": "admin"
        },
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalMarkups": 1
    }
  }
}
```

### 3. Get Markup by ID
**GET** `/markups/:markupId`

Retrieves a specific markup by ID.

**Response:**
```json
{
  "success": true,
  "message": "Markup retrieved successfully",
  "data": {
    "markup": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Standard Hotel Markup",
      "description": "Standard markup for hotel bookings",
      "type": "percentage",
      "value": 15,
      "category": "hotels",
      "priority": 1,
      "isActive": true,
      "createdBy": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "name": "Admin User",
        "username": "admin"
      },
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### 4. Update Markup
**PUT** `/markups/:markupId`

Updates an existing markup.

**Request Body:**
```json
{
  "name": "Updated Markup",
  "description": "Updated description",
  "type": "fixed",
  "value": 50,
  "isActive": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Markup updated successfully",
  "data": {
    "markup": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Updated Markup",
      "description": "Updated description",
      "type": "fixed",
      "value": 50,
      "isActive": false,
      "createdBy": "60f7b3b3b3b3b3b3b3b3b3b4",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### 5. Delete Markup
**DELETE** `/markups/:markupId`

Deletes a markup permanently.

**Response:**
```json
{
  "success": true,
  "message": "Markup deleted successfully"
}
```

### 6. Calculate Markup
**POST** `/markups/calculate`

Calculates markup for a given amount and category.

**Request Body:**
```json
{
  "amount": 1000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Markup calculated successfully",
  "data": {
    "originalAmount": 1000,
    "totalMarkup": 150,
    "finalAmount": 1150,
            "markupBreakdown": [
          {
            "markupId": "60f7b3b3b3b3b3b3b3b3b3b3",
            "name": "Standard Markup",
            "type": "percentage",
            "value": 15,
            "amount": 150
          }
        ]
  }
}
```

## Markup Types

### Fixed Markup
- Adds a fixed amount to the original price
- Example: If value is 50, adds ₹50 to any amount

### Percentage Markup
- Adds a percentage of the original price
- Value must be between 0-100
- Example: If value is 15, adds 15% of the original amount

## Markup Application
- All active markups are applied to every transaction
- Markups are applied in order of creation (newest first)
- Multiple markups can be applied to the same transaction

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Percentage value must be between 0 and 100"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Markup not found"
}
```

### Unauthorized Error (401)
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Usage Examples

### Creating a Percentage Markup
```bash
curl -X POST /api/owner/markups \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Service Fee",
    "description": "Standard service fee for all bookings",
    "type": "percentage",
    "value": 10
  }'
```

### Creating a Fixed Markup
```bash
curl -X POST /api/owner/markups \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Processing Fee",
    "description": "Fixed processing fee for all bookings",
    "type": "fixed",
    "value": 100
  }'
```

### Calculating Markup
```bash
curl -X POST /api/owner/markups/calculate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000
  }'
``` 