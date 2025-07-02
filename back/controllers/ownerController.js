const Admin = require('../models/admin');
const { Company, Employee } = require('../models/user');
const Markup = require('../models/markup');
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
      query.status = 'pending';
    } else if (status === 'verified') {
      query.status = 'verified';
    } else if (status === 'deactivated') {
      query.status = 'deactivated';
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
    const { action } = req.body; // 'verify' or 'deactivate'

    if (!['verify', 'deactivate'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "verify" or "deactivate"'
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
      // This handles both initial verification and reactivation
      const wasDeactivated = company.status === 'deactivated';
      company.isActive = true;
      company.status = 'verified';
      await company.save();

      const message = wasDeactivated ? 'Company reactivated successfully' : 'Company verified successfully';
      res.status(200).json({
        success: true,
        message,
        data: { company }
      });
    } else {
      // Deactivate the company
      company.isActive = false;
      company.status = 'deactivated';
      await company.save();

      res.status(200).json({
        success: true,
        message: 'Company deactivated successfully',
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
    const pendingCompanies = await Company.countDocuments({ status: 'pending' });
    const verifiedCompanies = await Company.countDocuments({ status: 'verified' });
    const deactivatedCompanies = await Company.countDocuments({ status: 'deactivated' });
    const totalEmployees = await Employee.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        totalCompanies,
        pendingCompanies,
        verifiedCompanies,
        deactivatedCompanies,
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

// Create or update global markup (only one markup allowed)
const createMarkup = async (req, res) => {
  try {
    const { name, description, type, value } = req.body;
    const adminId = req.user.id; // From auth middleware

    if (!name || !type || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and value are required'
      });
    }

    // Validate type
    if (!['fixed', 'percentage'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "fixed" or "percentage"'
      });
    }

    // Validate value based on type
    if (type === 'percentage' && (value < 0 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Percentage value must be between 0 and 100'
      });
    }

    if (type === 'fixed' && value < 0) {
      return res.status(400).json({
        success: false,
        message: 'Fixed value must be greater than or equal to 0'
      });
    }

    // Check if markup already exists
    let markup = await Markup.findOne();
    
    if (markup) {
      // Update existing markup
      markup.name = name;
      markup.description = description;
      markup.type = type;
      markup.value = value;
      markup.createdBy = adminId;
      
      await markup.save();
      
      res.status(200).json({
        success: true,
        message: 'Markup updated successfully',
        data: { markup }
      });
    } else {
      // Create new markup
      markup = new Markup({
        name,
        description,
        type,
        value,
        createdBy: adminId
      });

      await markup.save();

      res.status(201).json({
        success: true,
        message: 'Markup created successfully',
        data: { markup }
      });
    }

  } catch (error) {
    console.error('Create markup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get global markup
const getAllMarkups = async (req, res) => {
  try {
    const markup = await Markup.findOne()
      .populate('createdBy', 'name username');

    res.status(200).json({
      success: true,
      message: markup ? 'Markup retrieved successfully' : 'No markup found',
      data: {
        markup,
        exists: !!markup
      }
    });

  } catch (error) {
    console.error('Get markup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get markup by ID
const getMarkupById = async (req, res) => {
  try {
    const { markupId } = req.params;

    const markup = await Markup.findById(markupId)
      .populate('createdBy', 'name username');

    if (!markup) {
      return res.status(404).json({
        success: false,
        message: 'Markup not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Markup retrieved successfully',
      data: { markup }
    });

  } catch (error) {
    console.error('Get markup by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update markup
const updateMarkup = async (req, res) => {
  try {
    const { markupId } = req.params;
    const { name, description, type, value, isActive } = req.body;

    const markup = await Markup.findById(markupId);
    if (!markup) {
      return res.status(404).json({
        success: false,
        message: 'Markup not found'
      });
    }

    // Validate type if provided
    if (type && !['fixed', 'percentage'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "fixed" or "percentage"'
      });
    }

    // Validate value based on type
    if (value !== undefined) {
      const markupType = type || markup.type;
      if (markupType === 'percentage' && (value < 0 || value > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Percentage value must be between 0 and 100'
        });
      }

      if (markupType === 'fixed' && value < 0) {
        return res.status(400).json({
          success: false,
          message: 'Fixed value must be greater than or equal to 0'
        });
      }
    }

    // Update fields
    if (name !== undefined) markup.name = name;
    if (description !== undefined) markup.description = description;
    if (type !== undefined) markup.type = type;
    if (value !== undefined) markup.value = value;
    if (isActive !== undefined) markup.isActive = isActive;

    await markup.save();

    res.status(200).json({
      success: true,
      message: 'Markup updated successfully',
      data: { markup }
    });

  } catch (error) {
    console.error('Update markup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete markup (disabled - global markup cannot be deleted)
const deleteMarkup = async (req, res) => {
  try {
    res.status(403).json({
      success: false,
      message: 'Global markup cannot be deleted. You can only update it.'
    });
  } catch (error) {
    console.error('Delete markup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Calculate markup for a given amount
const calculateMarkup = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    // Get the global markup
    const markup = await Markup.findOne({ isActive: true });

    if (!markup) {
      return res.status(404).json({
        success: false,
        message: 'No active markup found'
      });
    }

    let markupAmount = 0;
    
    if (markup.type === 'percentage') {
      markupAmount = (amount * markup.value) / 100;
    } else {
      markupAmount = markup.value;
    }

    const finalAmount = amount + markupAmount;

    res.status(200).json({
      success: true,
      message: 'Markup calculated successfully',
      data: {
        originalAmount: amount,
        markup: {
          id: markup._id,
          name: markup.name,
          type: markup.type,
          value: markup.value,
          amount: markupAmount
        },
        finalAmount
      }
    });

  } catch (error) {
    console.error('Calculate markup error:', error);
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
  createSuperAdmin,
  createMarkup,
  getAllMarkups,
  getMarkupById,
  updateMarkup,
  deleteMarkup,
  calculateMarkup
}; 