const { Company, Employee } = require('../models/user');
const Hotel = require('../models/hotels');

// Get company dashboard data (company only)
const getCompanyDashboard = async (req, res) => {
  try {
    const companyId = req.user.id;
    
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Get active employees count
    const activeEmployees = await Employee.countDocuments({ 
      company: companyId, 
      isActive: true 
    });
    
    // Get total employees count
    const totalEmployees = await Employee.countDocuments({ company: companyId });
    
    // Mock data for dashboard
    const dashboardData = {
      companyInfo: {
        name: company.name,
        agencyName: company.agencyName,
        companyNumber: company.companyNumber,
        totalEmployees,
        activeEmployees,
        isActive: company.isActive
      },
      stats: {
        totalBookings: company.isActive ? 150 : 0,
        monthlyRevenue: company.isActive ? 25000 : 0,
        pendingBookings: company.isActive ? 5 : 0,
        completedBookings: company.isActive ? 145 : 0
      },
      recentActivity: company.isActive ? [
        {
          type: 'booking',
          message: 'New booking created by EMP1001001',
          timestamp: new Date()
        },
        {
          type: 'employee',
          message: 'Employee EMP1001002 added',
          timestamp: new Date(Date.now() - 86400000)
        }
      ] : [
        {
          type: 'verification',
          message: 'Account verification pending. Please wait for admin approval.',
          timestamp: new Date()
        }
      ]
    };
    
    res.status(200).json({
      success: true,
      message: 'Company dashboard data retrieved successfully',
      data: dashboardData
    });
  } catch (error) {
    console.error('Get company dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get company profile (company only)
const getCompanyProfile = async (req, res) => {
  try {
    const companyId = req.user.id;
    
    const company = await Company.findById(companyId).select('-password');
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Company profile retrieved successfully',
      data: { company }
    });
  } catch (error) {
    console.error('Get company profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update company profile (company only)
const updateCompanyProfile = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { name, agencyName, numPeople, gst, docs } = req.body;
    
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Update fields if provided
    if (name) company.name = name;
    if (agencyName) company.agencyName = agencyName;
    if (numPeople) company.numPeople = numPeople;
    if (gst) company.gst = gst;
    if (docs) company.docs = docs;
    
    await company.save();
    
    res.status(200).json({
      success: true,
      message: 'Company profile updated successfully',
      data: { company }
    });
  } catch (error) {
    console.error('Update company profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get company's booking history (company only)
const getCompanyBookings = async (req, res) => {
  try {
    const companyId = req.user.id;
    
    // In a real app, you would fetch bookings from a Booking model
    // For now, returning mock data
    const mockBookings = [
      {
        id: '1',
        hotelName: 'Luxury Hotel',
        employeeName: 'John Doe',
        employeeId: 'EMP1001001',
        checkIn: '2024-01-15',
        checkOut: '2024-01-17',
        guests: 2,
        status: 'confirmed',
        totalAmount: 2000,
        commission: 200
      },
      {
        id: '2',
        hotelName: 'Business Hotel',
        employeeName: 'Jane Smith',
        employeeId: 'EMP1001002',
        checkIn: '2024-01-20',
        checkOut: '2024-01-22',
        guests: 1,
        status: 'pending',
        totalAmount: 1500,
        commission: 150
      }
    ];
    
    res.status(200).json({
      success: true,
      message: 'Company bookings retrieved successfully',
      data: { bookings: mockBookings }
    });
  } catch (error) {
    console.error('Get company bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get company's revenue and commission (company only)
const getCompanyRevenue = async (req, res) => {
  try {
    const companyId = req.user.id;
    
    // Mock revenue data
    const revenueData = {
      totalRevenue: 50000,
      totalCommission: 5000,
      monthlyRevenue: [
        { month: 'Jan', revenue: 15000, commission: 1500 },
        { month: 'Feb', revenue: 18000, commission: 1800 },
        { month: 'Mar', revenue: 17000, commission: 1700 }
      ],
      topPerformingEmployees: [
        { employeeId: 'EMP1001001', name: 'John Doe', bookings: 25, revenue: 15000 },
        { employeeId: 'EMP1001002', name: 'Jane Smith', bookings: 20, revenue: 12000 }
      ]
    };
    
    res.status(200).json({
      success: true,
      message: 'Company revenue data retrieved successfully',
      data: revenueData
    });
  } catch (error) {
    console.error('Get company revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get employee profile (employee only)
const getEmployeeProfile = async (req, res) => {
  try {
    const employeeId = req.user.id;
    
    const employee = await Employee.findById(employeeId)
      .select('-password')
      .populate('company', 'name agencyName companyNumber');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Employee profile retrieved successfully',
      data: { employee }
    });
  } catch (error) {
    console.error('Get employee profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update employee profile (employee only)
const updateEmployeeProfile = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { name, phone } = req.body;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Update fields if provided
    if (name) employee.name = name;
    if (phone) {
      // Check if phone is already taken by another employee
      const existingEmployee = await Employee.findOne({ 
        phone, 
        _id: { $ne: employeeId } 
      });
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already in use'
        });
      }
      employee.phone = phone;
    }
    
    await employee.save();
    
    res.status(200).json({
      success: true,
      message: 'Employee profile updated successfully',
      data: { employee }
    });
  } catch (error) {
    console.error('Update employee profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getCompanyDashboard,
  getCompanyProfile,
  updateCompanyProfile,
  getCompanyBookings,
  getCompanyRevenue,
  getEmployeeProfile,
  updateEmployeeProfile
}; 