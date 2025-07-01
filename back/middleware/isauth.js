const jwt = require('jsonwebtoken');
const { Company, Employee } = require('../models/user');
const Admin = require('../models/admin');

// Middleware to check if user is authenticated
const isAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Get user from database based on type
    let user;
    let userType;
    
    if (decoded.type === 'company') {
      user = await Company.findById(decoded.id).select('-password');
      userType = 'company';
    } else if (decoded.type === 'employee') {
      user = await Employee.findById(decoded.id).select('-password');
      userType = 'employee';
    } else if (decoded.type === 'admin') {
      user = await Admin.findById(decoded.id).select('-password');
      userType = 'admin';
    } else {
      // Fallback for old tokens without type
      user = await Company.findById(decoded.id).select('-password');
      if (user) {
        userType = 'company';
      } else {
        user = await Employee.findById(decoded.id).select('-password');
        if (user) {
          userType = 'employee';
        } else {
          user = await Admin.findById(decoded.id).select('-password');
          if (user) {
            userType = 'admin';
          }
        }
      }
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Set user info in request
    req.user = {
      id: user._id,
      phone: user.phone,
      name: user.name,
      type: userType
    };

    // Add type-specific fields
    if (userType === 'company') {
      req.user.agencyName = user.agencyName;
      req.user.numPeople = user.numPeople;
      req.user.companyNumber = user.companyNumber;
      req.user.isActive = user.isActive;
    } else if (userType === 'employee') {
      req.user.employeeId = user.employeeId;
      req.user.employeeNumber = user.employeeNumber;
      req.user.company = user.company;
      req.user.companyNumber = user.companyNumber;
    } else if (userType === 'admin') {
      req.user.username = user.username;
      req.user.email = user.email;
      req.user.role = user.role;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware to check if user is a company
const isCompany = async (req, res, next) => {
  try {
    if (req.user.type !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Company role required.'
      });
    }
    next();
  } catch (error) {
    console.error('Company middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to check if user is an admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to check if user is an employee
const isEmployee = async (req, res, next) => {
  try {
    if (req.user.type !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Employee role required.'
      });
    }
    next();
  } catch (error) {
    console.error('Employee middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to check if user is company or employee (for hotel routes)
const isCompanyOrEmployee = async (req, res, next) => {
  try {
    if (req.user.type !== 'company' && req.user.type !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Company or Employee role required.'
      });
    }
    next();
  } catch (error) {
    console.error('Company or Employee middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to check if employee belongs to the company
const isEmployeeOfCompany = async (req, res, next) => {
  try {
    if (req.user.type === 'employee') {
      // Verify employee belongs to a company
      if (!req.user.company) {
        return res.status(403).json({
          success: false,
          message: 'Employee must be associated with a company.'
        });
      }
      
      // Check if company exists and employee is active
      const company = await Company.findById(req.user.company);
      if (!company) {
        return res.status(403).json({
          success: false,
          message: 'Company not found.'
        });
      }
      
      const employee = await Employee.findById(req.user.id);
      if (!employee || !employee.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Employee not found or inactive.'
        });
      }
    }
    next();
  } catch (error) {
    console.error('Employee of company middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = { 
  isAuth, 
  isCompany, 
  isEmployee, 
  isAdmin,
  isCompanyOrEmployee,
  isEmployeeOfCompany 
}; 