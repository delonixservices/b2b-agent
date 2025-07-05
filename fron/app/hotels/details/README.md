# Hotel Booking System

This directory contains the hotel booking functionality including hotel details, reviews, and booking process.

## Components

### Hotel Details Page (`page.tsx`)
- Displays comprehensive hotel information
- Shows available room packages with pricing
- Integrates booking modal for reservation process
- Links to hotel reviews page

### Booking Modal (`components/BookingModal.tsx`)
- Multi-step booking process:
  1. **Booking Policy**: Retrieves and displays booking terms
  2. **Guest Information**: Collects contact and guest details
  3. **Confirmation**: Shows booking success

### Hotel Reviews Page (`../review/page.tsx`)
- Displays hotel reviews and ratings
- Filtering by rating (1-5 stars)
- Sorting by date, rating, or helpfulness
- Rating breakdown statistics

## API Integration

### Hotel API Service (`../../services/hotelApi.ts`)
Centralized API service for hotel-related operations:

- `getBookingPolicy()`: Retrieves booking policy for selected package
- `prebook()`: Processes hotel prebooking
- `searchPackages()`: Fetches available hotel packages

### Backend Endpoints Used
- `POST /api/hotels/packages`: Get hotel packages
- `POST /api/hotels/bookingpolicy`: Get booking policy
- `POST /api/hotels/prebook`: Process prebooking

## Booking Flow

1. **Package Selection**: User selects a room package from hotel details
2. **Booking Policy**: System retrieves booking terms and conditions
3. **Guest Information**: User fills contact and guest details
4. **Prebooking**: System processes the booking request
5. **Confirmation**: User receives booking confirmation

## Features

### Hotel Details
- Hotel images and basic information
- Amenities list
- Star ratings and reviews summary
- Available room packages with pricing
- Markup calculations and display

### Booking Process
- Multi-step modal interface
- Form validation
- Guest information collection
- Coupon code support
- Real-time error handling

### Reviews System
- Comprehensive review display
- Rating filters and sorting
- Helpful/not helpful voting
- Rating breakdown statistics

## Usage

### Navigation
- From hotel search results → Hotel details page
- From hotel details → Reviews page
- From hotel details → Booking modal

### Booking Process
1. Select a room package
2. Click "Proceed to Booking"
3. Review booking policy
4. Fill guest information
5. Confirm booking

## Technical Details

### State Management
- React hooks for local state
- Form validation
- Loading states and error handling

### API Integration
- TypeScript interfaces for type safety
- Centralized API service
- Error handling and retry logic

### UI/UX
- Responsive design
- Loading indicators
- Error messages
- Form validation feedback
- Modal-based booking flow

## Dependencies

- Next.js 13+ with App Router
- TypeScript
- Tailwind CSS
- React hooks

## Environment Variables

Ensure the backend API is running on `http://localhost:3334` or update the `API_BASE_URL` in `hotelApi.ts`. 