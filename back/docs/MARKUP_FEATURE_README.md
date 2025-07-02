# Markup Management Feature

## Overview

The markup management feature allows companies to set profit margins on hotel bookings. Companies can configure markup as either a percentage or fixed amount, and can activate/deactivate it as needed.

## Features

### 1. Markup Types
- **Percentage Markup**: Adds a percentage of the base price (e.g., 10% on ₹1000 = ₹100 markup)
- **Fixed Markup**: Adds a fixed amount regardless of the base price (e.g., ₹200 on any booking)

### 2. Markup Management
- Set markup type and value
- Activate/deactivate markup without changing configuration
- View current markup settings
- Calculate markup for any base price

### 3. Validation
- Percentage markup cannot exceed 100%
- Markup value must be non-negative
- Only valid markup types are accepted

## Database Schema

### Company Model Updates
The Company schema has been extended with markup fields:

```javascript
markup: {
  type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  value: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true }
}
```

## API Endpoints

### 1. Set Company Markup
```
POST /company/markup
```
**Request Body:**
```json
{
  "type": "percentage",
  "value": 15.5,
  "isActive": true
}
```

### 2. Get Company Markup
```
GET /company/markup
```

### 3. Calculate Markup
```
POST /company/markup/calculate
```
**Request Body:**
```json
{
  "basePrice": 1000
}
```

### 4. Toggle Markup Status
```
PUT /company/markup/toggle
```
**Request Body:**
```json
{
  "isActive": false
}
```

## Service Layer

### MarkupService Class

The `MarkupService` class provides the following methods:

#### `setMarkup(companyId, markupData)`
- Sets markup configuration for a company
- Validates markup type and value
- Returns updated company data

#### `getMarkup(companyId)`
- Retrieves current markup configuration
- Returns company markup data

#### `calculateMarkup(companyId, basePrice)`
- Calculates markup amount for a given base price
- Returns calculation details including final price
- Handles inactive markup (returns 0 markup)

#### `toggleMarkup(companyId, isActive)`
- Activates or deactivates markup
- Preserves markup configuration
- Returns updated markup status

## Frontend Implementation

### Markup Management Page
Located at: `fron/app/dashboard/Markup/page.tsx`

Features:
- **Current Status Display**: Shows active/inactive status and current markup
- **Configuration Form**: Set markup type and value
- **Markup Calculator**: Test markup calculations with any base price
- **Toggle Controls**: Activate/deactivate markup
- **Real-time Validation**: Form validation and error handling
- **Responsive Design**: Works on desktop and mobile

### Key Components
- Markup type selector (percentage/fixed)
- Value input with appropriate units
- Calculator with base price input
- Results display showing breakdown
- Status toggle button
- Information section explaining markup

## Usage Examples

### Setting Percentage Markup
```javascript
// Set 15% markup
const result = await MarkupService.setMarkup(companyId, {
  type: 'percentage',
  value: 15,
  isActive: true
});
```

### Setting Fixed Markup
```javascript
// Set ₹200 fixed markup
const result = await MarkupService.setMarkup(companyId, {
  type: 'fixed',
  value: 200,
  isActive: true
});
```

### Calculating Markup
```javascript
// Calculate markup for ₹1000 base price
const result = await MarkupService.calculateMarkup(companyId, 1000);
// Returns: { basePrice: 1000, markupAmount: 150, finalPrice: 1150 }
```

## Testing

### Test Script
Run the test script to verify markup functionality:

```bash
cd back
node test_markup.js
```

The test script covers:
- Setting percentage and fixed markup
- Retrieving markup configuration
- Calculating markup amounts
- Toggling markup status
- Error handling for invalid inputs

### Manual Testing
1. Login as a company
2. Navigate to `/dashboard/Markup`
3. Set markup type and value
4. Use calculator to test calculations
5. Toggle markup active status
6. Verify changes persist

## Integration Points

### Hotel Booking Flow
The markup service can be integrated into the hotel booking process:

```javascript
// Example integration in booking controller
const basePrice = hotel.price * nights;
const markupResult = await MarkupService.calculateMarkup(companyId, basePrice);
const finalPrice = markupResult.finalPrice;
```

### Revenue Calculations
Markup can be used in revenue calculations:

```javascript
// Calculate company revenue with markup
const bookingRevenue = basePrice + markupAmount;
const markupRevenue = markupAmount;
```

## Security Considerations

- Only authenticated companies can access markup endpoints
- Markup data is validated on both frontend and backend
- Company can only modify their own markup settings
- All markup operations are logged for audit purposes

## Future Enhancements

### Potential Features
1. **Markup History**: Track markup changes over time
2. **Conditional Markup**: Different markup for different hotel categories
3. **Bulk Markup Updates**: Update markup for multiple companies
4. **Markup Analytics**: Reports on markup performance
5. **Markup Templates**: Predefined markup configurations

### Integration Opportunities
1. **Hotel Booking System**: Apply markup during booking
2. **Invoice Generation**: Include markup in invoices
3. **Commission Calculations**: Use markup for commission calculations
4. **Reporting System**: Include markup data in reports

## Error Handling

### Common Errors
- **Invalid Markup Type**: Only 'percentage' or 'fixed' allowed
- **Invalid Percentage**: Cannot exceed 100%
- **Negative Value**: Markup value must be non-negative
- **Company Not Found**: Invalid company ID
- **Unauthorized Access**: Invalid or missing authentication

### Error Responses
```json
{
  "success": false,
  "message": "Percentage markup cannot exceed 100%"
}
```

## Performance Considerations

- Markup calculations are lightweight and fast
- Database queries are optimized with proper indexing
- Frontend uses efficient state management
- API responses are cached where appropriate

## Maintenance

### Database Migrations
If updating existing companies, ensure markup fields are added:

```javascript
// Migration script example
await Company.updateMany(
  { markup: { $exists: false } },
  { 
    $set: { 
      markup: { 
        type: 'percentage', 
        value: 0, 
        isActive: true 
      } 
    } 
  }
);
```

### Monitoring
- Monitor markup usage patterns
- Track calculation performance
- Log markup changes for audit
- Alert on unusual markup values 