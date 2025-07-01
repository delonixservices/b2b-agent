const Hotel = require('../models/hotels');
const { Company } = require('../models/user');

// Get all hotels (accessible by both company and employee)
const getAllHotels = async (req, res) => {
  try {
    // Check if user is a company and if it's active
    if (req.user.type === 'company') {
      const company = await Company.findById(req.user.id);
      if (!company || !company.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account is pending verification. Please wait for admin approval before accessing hotel services.'
        });
      }
    }

    const hotels = await Hotel.find({ isActive: true });
    
    res.status(200).json({
      success: true,
      message: 'Hotels retrieved successfully',
      data: { hotels }
    });
  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get hotel by ID (accessible by both company and employee)
const getHotelById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const hotel = await Hotel.findById(id);
    if (!hotel || !hotel.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Hotel retrieved successfully',
      data: { hotel }
    });
  } catch (error) {
    console.error('Get hotel by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Search hotels (accessible by both company and employee)
const searchHotels = async (req, res) => {
  try {
    const { location, checkIn, checkOut, guests } = req.query;
    
    let query = { isActive: true };
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    const hotels = await Hotel.find(query);
    
    res.status(200).json({
      success: true,
      message: 'Hotels searched successfully',
      data: { 
        hotels,
        searchCriteria: { location, checkIn, checkOut, guests }
      }
    });
  } catch (error) {
    console.error('Search hotels error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get hotel availability (accessible by both company and employee)
const getHotelAvailability = async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut, guests } = req.query;
    
    if (!hotelId || !checkIn || !checkOut || !guests) {
      return res.status(400).json({
        success: false,
        message: 'Hotel ID, check-in, check-out, and guests are required'
      });
    }
    
    const hotel = await Hotel.findById(hotelId);
    if (!hotel || !hotel.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    
    // Mock availability check (in real app, this would check actual bookings)
    const isAvailable = Math.random() > 0.3; // 70% chance of availability
    
    res.status(200).json({
      success: true,
      message: 'Hotel availability checked successfully',
      data: {
        hotelId,
        checkIn,
        checkOut,
        guests,
        isAvailable,
        price: hotel.price || 1000 // Mock price
      }
    });
  } catch (error) {
    console.error('Get hotel availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user's hotel bookings (accessible by both company and employee)
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // In a real app, you would fetch bookings from a Booking model
    // For now, returning mock data
    const mockBookings = [
      {
        id: '1',
        hotelName: 'Sample Hotel',
        checkIn: '2024-01-15',
        checkOut: '2024-01-17',
        guests: 2,
        status: 'confirmed',
        totalAmount: 2000
      }
    ];
    
    res.status(200).json({
      success: true,
      message: 'User bookings retrieved successfully',
      data: { bookings: mockBookings }
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllHotels,
  getHotelById,
  searchHotels,
  getHotelAvailability,
  getUserBookings
};
