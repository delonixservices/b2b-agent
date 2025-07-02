const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { Company, Employee } = require('../models/user');

// In-memory store for OTPs (for demo purposes)
const otpStore = {};

// Generate unique company number
const generateCompanyNumber = async () => {
  try {
    // Find the last company with a valid company number, excluding temporary companies
    const lastCompany = await Company.findOne({ 
      companyNumber: { $exists: true, $ne: null },
      name: { $ne: 'Temporary Company' }
    }).sort({ companyNumber: -1 });
    
    let nextNumber = 1001; // Default starting number
    
    if (lastCompany && lastCompany.companyNumber && !isNaN(lastCompany.companyNumber)) {
      nextNumber = lastCompany.companyNumber + 1;
    }
    
    console.log('Generated company number:', nextNumber);
    return nextNumber;
  } catch (error) {
    console.error('Error generating company number:', error);
    // Fallback to timestamp-based number if query fails
    return Math.floor(Date.now() / 1000) % 9000 + 1001;
  }
};

// Generate employee ID
const generateEmployeeId = (companyNumber, employeeNumber) => {
  if (!companyNumber || !employeeNumber) {
    throw new Error('Company number and employee number are required to generate employee ID');
  }
  const employeeId = `EMP${companyNumber}${employeeNumber.toString().padStart(3, '0')}`;
  console.log('Generated employee ID:', employeeId);
  return employeeId;
};

// Send OTP for company signup
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    // Check if company already exists
    const existingCompany = await Company.findOne({ phone });
    if (existingCompany) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company already exists with this phone number' 
      });
    }

    // Generate and store OTP (hardcoded for demo)
    const otp = '111111';
    otpStore[phone] = otp;

    // In a real application, you would send this OTP via SMS
    console.log(`OTP for ${phone}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: { phone }
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify OTP for company signup
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    // Check if OTP matches
    if (otpStore[phone] !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Create temporary company with phone number and temporary name/password
    const tempCompany = new Company({ 
      phone,
      name: 'Temporary Company',
      password: 'temp_password_123'
    });
    await tempCompany.save();

    // Generate temporary token for completing signup
    const tempToken = jwt.sign(
      { id: tempCompany._id, temp: true },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '10m' }
    );

    // Clear OTP from store
    delete otpStore[phone];
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: { tempToken }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Complete company signup with password and other details
const completeSignup = async (req, res) => {
  try {
    const { tempToken, name, agencyName, numPeople, password } = req.body;

    if (!tempToken || !name || !agencyName || !numPeople || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret');
    if (!decoded.temp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid temporary token'
      });
    }

    // Find and update company
    const company = await Company.findById(decoded.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate company number
    const companyNumber = await generateCompanyNumber();
    
    // Validate company number
    if (!companyNumber || isNaN(companyNumber)) {
      throw new Error('Failed to generate valid company number');
    }

    // Update company with complete details
    company.name = name;
    company.agencyName = agencyName;
    company.numPeople = numPeople;
    company.password = hashedPassword;
    company.companyNumber = companyNumber;
    await company.save();

    // Generate final token
    const token = jwt.sign(
      { id: company._id, type: 'company' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Company signup completed successfully',
      data: {
        token,
        company: {
          id: company._id,
          phone: company.phone,
          name: company.name,
          agencyName: company.agencyName,
          numPeople: company.numPeople,
          companyNumber: company.companyNumber
        }
      }
    });

  } catch (error) {
    console.error('Complete signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Login for both companies and employees
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone and password are required'
      });
    }

    // First try to find as company
    let user = await Company.findOne({ phone });
    let userType = 'company';

    // If not found as company, try as employee
    if (!user) {
      user = await Employee.findOne({ phone });
      userType = 'employee';
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Note: We allow inactive users to login but they will be restricted in protected routes
    // The isActive status will be checked in middleware for specific actions

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, type: userType },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Prepare response data
    const userData = {
      id: user._id,
      phone: user.phone,
      name: user.name
    };

    if (userType === 'company') {
      userData.agencyName = user.agencyName;
      userData.numPeople = user.numPeople;
      userData.companyNumber = user.companyNumber;
    } else {
      userData.employeeId = user.employeeId;
      userData.employeeNumber = user.employeeNumber;
      userData.companyNumber = user.companyNumber;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userData,
        userType
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add employee to company
const addEmployee = async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    const companyId = req.user.id;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and password are required'
      });
    }

    // Check if company exists and is active
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if company is active
    if (!company.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending verification. Please wait for admin approval before creating employees.'
      });
    }
    
    console.log('Adding employee to company:', {
      companyId,
      companyName: company.name,
      companyNumber: company.companyNumber
    });

    // Check if phone already exists in employees
    const existingEmployee = await Employee.findOne({ phone });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this phone number already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get next employee number for this company
    const lastEmployee = await Employee.findOne({ company: companyId }).sort({ employeeNumber: -1 });
    const employeeNumber = lastEmployee ? lastEmployee.employeeNumber + 1 : 1;
    
    const employeeId = generateEmployeeId(company.companyNumber, employeeNumber);
    console.log('Generated employee details:', { employeeNumber, employeeId, companyNumber: company.companyNumber });

    // Create employee
    const employee = new Employee({
      employeeId,
      name,
      phone,
      password: hashedPassword,
      employeeNumber,
      company: companyId,
      companyNumber: company.companyNumber
    });
    
    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee added successfully',
      data: {
        employee: {
          id: employee._id,
          name: employee.name,
          phone: employee.phone,
          employeeId: employee.employeeId,
          employeeNumber: employee.employeeNumber
        }
      }
    });

  } catch (error) {
    console.error('Add employee error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get company employees
const getEmployees = async (req, res) => {
  try {
    const companyId = req.user.id;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get all active employees for this company
    const employees = await Employee.find({ 
      company: companyId, 
      isActive: true 
    }).select('-password');

    res.status(200).json({
      success: true,
      message: 'Employees retrieved successfully',
      data: {
        employees
      }
    });

  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Deactivate employee
const deactivateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const companyId = req.user.id;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Find and deactivate employee
    const employee = await Employee.findOne({ 
      employeeId, 
      company: companyId 
    });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    employee.isActive = false;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Submit business details (public route)
const submitBusinessDetails = async (req, res) => {
  try {
    const { 
      gstNumber, 
      panNumber, 
      address, 
      billingAddress, 
      email, 
      phone 
    } = req.body;

    // Only address is mandatory
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate phone format if provided (basic validation for Indian numbers)
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format (should be 10 digits starting with 6-9)'
      });
    }

    // Create business details object
    const businessDetails = {
      gstNumber: gstNumber || null,
      panNumber: panNumber || null,
      address: address,
      billingAddress: billingAddress || address, // Use address as billing address if not provided
      email: email || null,
      phone: phone || null,
      submittedAt: new Date()
    };

    // In a real application, you might want to save this to a database
    // For now, we'll just return the collected data
    console.log('Business details submitted:', businessDetails);

    res.status(200).json({
      success: true,
      message: 'Business details submitted successfully',
      data: {
        businessDetails
      }
    });

  } catch (error) {
    console.error('Submit business details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Save business details to company (authenticated route)
const saveBusinessDetails = async (req, res) => {
  try {
    const { 
      gstNumber, 
      panNumber, 
      address, 
      billingAddress, 
      email, 
      phone,
      logoUrl
    } = req.body;
    
    const companyId = req.user.id;

    // Only address is mandatory
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate phone format if provided (basic validation for Indian numbers)
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format (should be 10 digits starting with 6-9)'
      });
    }

    // Find the company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if business details already exist
    if (company.businessDetails && company.businessDetails.address) {
      return res.status(400).json({
        success: false,
        message: 'Business details have already been submitted. You can only submit once.',
        data: {
          businessDetails: company.businessDetails
        }
      });
    }

    // Update company with business details
    company.businessDetails = {
      gstNumber: gstNumber || null,
      panNumber: panNumber || null,
      address: address,
      billingAddress: billingAddress || address,
      email: email || null,
      phone: phone || null,
      submittedAt: new Date()
    };

    // Update logo if provided
    if (logoUrl) {
      // Validate URL format
      try {
        new URL(logoUrl);
        company.logo = logoUrl;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid logo URL format'
        });
      }
    }

    await company.save();

    console.log('Business details saved to company:', companyId);

    res.status(200).json({
      success: true,
      message: 'Business details saved successfully',
      data: {
        businessDetails: company.businessDetails
      }
    });

  } catch (error) {
    console.error('Save business details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get business details for company
const getBusinessDetails = async (req, res) => {
  try {
    const companyId = req.user.id;

    // Find the company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Business details retrieved successfully',
      data: {
        businessDetails: company.businessDetails || null,
        logo: company.logo || null
      }
    });

  } catch (error) {
    console.error('Get business details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upload company logo
const uploadLogo = async (req, res) => {
  try {
    const { logoUrl } = req.body;
    const companyId = req.user.id;

    if (!logoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Logo URL is required'
      });
    }

    // Validate URL format
    try {
      new URL(logoUrl);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid logo URL format'
      });
    }

    // Find the company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Update company logo
    company.logo = logoUrl;
    await company.save();

    console.log('Logo uploaded for company:', companyId);

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logo: company.logo
      }
    });

  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get company logo
const getLogo = async (req, res) => {
  try {
    const companyId = req.user.id;

    // Find the company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logo retrieved successfully',
      data: {
        logo: company.logo || null
      }
    });

  } catch (error) {
    console.error('Get logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  completeSignup,
  login,
  addEmployee,
  getEmployees,
  deactivateEmployee,
  submitBusinessDetails,
  saveBusinessDetails,
  getBusinessDetails,
  uploadLogo,
  getLogo
};
