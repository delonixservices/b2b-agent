const Admin = require('../models/admin');
const { Company, Employee } = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Owner/Admin Login
const ownerLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: admin._id, type: 'admin', role: admin.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      }
    });

  } catch (error) {
    console.error('Owner login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all companies (pending and verified)
const getAllCompanies = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status === 'pending') {
      query.isActive = false;
    } else if (status === 'verified') {
      query.isActive = true;
    }

    const companies = await Company.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Company.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Companies retrieved successfully',
      data: {
        companies,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCompanies: total
        }
      }
    });

  } catch (error) {
    console.error('Get all companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get company details by ID
const getCompanyById = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId).select('-password');
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get employee count for this company
    const employeeCount = await Employee.countDocuments({ company: companyId });

    res.status(200).json({
      success: true,
      message: 'Company details retrieved successfully',
      data: {
        company,
        employeeCount
      }
    });

  } catch (error) {
    console.error('Get company by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify/Activate company
const verifyCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { action } = req.body; // 'verify' or 'reject'

    if (!['verify', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "verify" or "reject"'
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (action === 'verify') {
      company.isActive = true;
      await company.save();

      res.status(200).json({
        success: true,
        message: 'Company verified successfully',
        data: { company }
      });
    } else {
      // For rejection, we could either delete the company or keep it inactive
      // Here we'll keep it inactive but you can modify as needed
      res.status(200).json({
        success: true,
        message: 'Company rejected',
        data: { company }
      });
    }

  } catch (error) {
    console.error('Verify company error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const pendingCompanies = await Company.countDocuments({ isActive: false });
    const verifiedCompanies = await Company.countDocuments({ isActive: true });
    const totalEmployees = await Employee.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        totalCompanies,
        pendingCompanies,
        verifiedCompanies,
        totalEmployees
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create initial super admin (for setup)
const createSuperAdmin = async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if super admin already exists
    const existingAdmin = await Admin.findOne({ role: 'super_admin' });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Super admin already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create super admin
    const superAdmin = new Admin({
      username,
      email,
      password: hashedPassword,
      name,
      role: 'super_admin'
    });

    await superAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      data: {
        admin: {
          id: superAdmin._id,
          username: superAdmin.username,
          email: superAdmin.email,
          name: superAdmin.name,
          role: superAdmin.role
        }
      }
    });

  } catch (error) {
    console.error('Create super admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  ownerLogin,
  getAllCompanies,
  getCompanyById,
  verifyCompany,
  getDashboardStats,
  createSuperAdmin
}; 