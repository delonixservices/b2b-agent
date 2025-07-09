const Admin = require('../models/admin');
const { Company, Employee } = require('../models/user');
const Config = require('../models/config');
const Hotel = require('../models/hotels');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const isSuperAdmin = require('../middleware/isadmin');
const markupService = require('../services/markupService');

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

// Create or update global configuration (only super admin can create/update)
const createConfig = async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.type !== 'admin' || req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admin can manage configuration.'
      });
    }

    const { 
      markup, 
      service_charge, 
      processing_fee, 
      cancellation_charge 
    } = req.body;

    // Validate required fields
    if (!markup || !service_charge || processing_fee === undefined || !cancellation_charge) {
      return res.status(400).json({
        success: false,
        message: 'All configuration fields are required: markup, service_charge, processing_fee, cancellation_charge'
      });
    }

    // Validate markup
    if (!markup.type || !['percentage', 'fixed'].includes(markup.type) || markup.value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Markup must have valid type (percentage/fixed) and value'
      });
    }

    if (markup.type === 'percentage' && (markup.value < 0 || markup.value > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Markup percentage value must be between 0 and 100'
      });
    }

    if (markup.type === 'fixed' && markup.value < 0) {
      return res.status(400).json({
        success: false,
        message: 'Markup fixed value must be greater than or equal to 0'
      });
    }

    // Validate service_charge
    if (!service_charge.type || !['percentage', 'fixed'].includes(service_charge.type) || service_charge.value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Service charge must have valid type (percentage/fixed) and value'
      });
    }

    if (service_charge.type === 'percentage' && (service_charge.value < 0 || service_charge.value > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Service charge percentage value must be between 0 and 100'
      });
    }

    if (service_charge.type === 'fixed' && service_charge.value < 0) {
      return res.status(400).json({
        success: false,
        message: 'Service charge fixed value must be greater than or equal to 0'
      });
    }

    // Validate processing_fee
    if (processing_fee < 0) {
      return res.status(400).json({
        success: false,
        message: 'Processing fee must be greater than or equal to 0'
      });
    }

    // Validate cancellation_charge
    if (!cancellation_charge.type || !['percentage', 'fixed'].includes(cancellation_charge.type) || cancellation_charge.value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation charge must have valid type (percentage/fixed) and value'
      });
    }

    if (cancellation_charge.type === 'percentage' && (cancellation_charge.value < 0 || cancellation_charge.value > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation charge percentage value must be between 0 and 100'
      });
    }

    if (cancellation_charge.type === 'fixed' && cancellation_charge.value < 0) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation charge fixed value must be greater than or equal to 0'
      });
    }

    // Create or update configuration
    const configData = {
      markup,
      service_charge,
      processing_fee,
      cancellation_charge
    };

    const config = await markupService.updateConfig(configData);

    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      data: { config }
    });

  } catch (error) {
    console.error('Create config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current configuration
const getConfig = async (req, res) => {
  try {
    const config = await markupService.getConfig();

    res.status(200).json({
      success: true,
      message: 'Configuration retrieved successfully',
      data: { config }
    });

  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get markup configuration
const getMarkup = async (req, res) => {
  try {
    const markup = await markupService.getMarkup();

    res.status(200).json({
      success: true,
      message: 'Markup configuration retrieved successfully',
      data: { markup }
    });

  } catch (error) {
    console.error('Get markup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update configuration (only super admin can update)
const updateConfig = async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.type !== 'admin' || req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admin can update configuration.'
      });
    }

    const { 
      markup, 
      service_charge, 
      processing_fee, 
      cancellation_charge 
    } = req.body;

    // Get current config
    const currentConfig = await markupService.getConfig();
    
    // Update only provided fields
    const updateData = {};
    
    if (markup) {
      // Validate markup
      if (markup.type && !['percentage', 'fixed'].includes(markup.type)) {
        return res.status(400).json({
          success: false,
          message: 'Markup type must be either "percentage" or "fixed"'
        });
      }
      
      if (markup.value !== undefined) {
        const markupType = markup.type || currentConfig.markup.type;
        if (markupType === 'percentage' && (markup.value < 0 || markup.value > 100)) {
          return res.status(400).json({
            success: false,
            message: 'Markup percentage value must be between 0 and 100'
          });
        }
        
        if (markupType === 'fixed' && markup.value < 0) {
          return res.status(400).json({
            success: false,
            message: 'Markup fixed value must be greater than or equal to 0'
          });
        }
      }
      
      updateData.markup = {
        type: markup.type || currentConfig.markup.type,
        value: markup.value !== undefined ? markup.value : currentConfig.markup.value
      };
    }

    if (service_charge) {
      // Validate service_charge
      if (service_charge.type && !['percentage', 'fixed'].includes(service_charge.type)) {
        return res.status(400).json({
          success: false,
          message: 'Service charge type must be either "percentage" or "fixed"'
        });
      }
      
      if (service_charge.value !== undefined) {
        const serviceType = service_charge.type || currentConfig.service_charge.type;
        if (serviceType === 'percentage' && (service_charge.value < 0 || service_charge.value > 100)) {
          return res.status(400).json({
            success: false,
            message: 'Service charge percentage value must be between 0 and 100'
          });
        }
        
        if (serviceType === 'fixed' && service_charge.value < 0) {
          return res.status(400).json({
            success: false,
            message: 'Service charge fixed value must be greater than or equal to 0'
          });
        }
      }
      
      updateData.service_charge = {
        type: service_charge.type || currentConfig.service_charge.type,
        value: service_charge.value !== undefined ? service_charge.value : currentConfig.service_charge.value
      };
    }

    if (processing_fee !== undefined) {
      if (processing_fee < 0) {
        return res.status(400).json({
          success: false,
          message: 'Processing fee must be greater than or equal to 0'
        });
      }
      updateData.processing_fee = processing_fee;
    }

    if (cancellation_charge) {
      // Validate cancellation_charge
      if (cancellation_charge.type && !['percentage', 'fixed'].includes(cancellation_charge.type)) {
        return res.status(400).json({
          success: false,
          message: 'Cancellation charge type must be either "percentage" or "fixed"'
        });
      }
      
      if (cancellation_charge.value !== undefined) {
        const cancelType = cancellation_charge.type || currentConfig.cancellation_charge.type;
        if (cancelType === 'percentage' && (cancellation_charge.value < 0 || cancellation_charge.value > 100)) {
          return res.status(400).json({
            success: false,
            message: 'Cancellation charge percentage value must be between 0 and 100'
          });
        }
        
        if (cancelType === 'fixed' && cancellation_charge.value < 0) {
          return res.status(400).json({
            success: false,
            message: 'Cancellation charge fixed value must be greater than or equal to 0'
          });
        }
      }
      
      updateData.cancellation_charge = {
        type: cancellation_charge.type || currentConfig.cancellation_charge.type,
        value: cancellation_charge.value !== undefined ? cancellation_charge.value : currentConfig.cancellation_charge.value
      };
    }

    // Update configuration
    const config = await markupService.updateConfig(updateData);

    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      data: { config }
    });

  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete configuration (disabled - configuration cannot be deleted)
const deleteConfig = async (req, res) => {
  try {
    res.status(403).json({
      success: false,
      message: 'Configuration cannot be deleted. You can only update the values.'
    });
  } catch (error) {
    console.error('Delete config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Calculate markup for a given amount using global configuration
const calculateMarkup = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    // Get the global configuration
    const config = await markupService.getConfig();

    if (!config || !config.markup) {
      return res.status(404).json({
        success: false,
        message: 'No markup configuration found'
      });
    }

    let markupAmount = 0;
    
    if (config.markup.type === 'percentage') {
      markupAmount = (amount * config.markup.value) / 100;
    } else {
      markupAmount = config.markup.value;
    }

    const finalAmount = amount + markupAmount;

    res.status(200).json({
      success: true,
      message: 'Markup calculated successfully',
      data: {
        originalAmount: amount,
        markup: {
          type: config.markup.type,
          value: config.markup.value,
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

// Update company wallet balance (admin only)
const updateCompanyWallet = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { amount, action, reason } = req.body; // action: 'add' or 'deduct'

    if (!amount || !action || !['add', 'deduct'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Amount and action (add/deduct) are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Initialize wallet if it doesn't exist
    if (!company.wallet) {
      company.wallet = {
        balance: 0,
        currency: 'INR',
        lastUpdated: new Date()
      };
    }

    const oldBalance = company.wallet.balance;
    let newBalance;

    if (action === 'add') {
      newBalance = oldBalance + amount;
    } else {
      // Check if sufficient balance for deduction
      if (oldBalance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance for deduction',
          data: {
            currentBalance: oldBalance,
            requestedDeduction: amount
          }
        });
      }
      newBalance = oldBalance - amount;
    }

    // Update wallet
    company.wallet.balance = newBalance;
    company.wallet.lastUpdated = new Date();
    await company.save();

    res.status(200).json({
      success: true,
      message: `Wallet ${action === 'add' ? 'credited' : 'debited'} successfully`,
      data: {
        companyId: company._id,
        companyName: company.name,
        oldBalance,
        newBalance,
        amount,
        action,
        reason: reason || 'Admin update',
        currency: company.wallet.currency,
        lastUpdated: company.wallet.lastUpdated
      }
    });

  } catch (error) {
    console.error('Update company wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get company wallet balance
const getCompanyWallet = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId).select('name wallet');
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Initialize wallet if it doesn't exist
    if (!company.wallet) {
      company.wallet = {
        balance: 0,
        currency: 'INR',
        lastUpdated: new Date()
      };
      await company.save();
    }

    res.status(200).json({
      success: true,
      message: 'Wallet balance retrieved successfully',
      data: {
        companyId: company._id,
        companyName: company.name,
        wallet: company.wallet
      }
    });

  } catch (error) {
    console.error('Get company wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all companies with wallet balances
const getAllCompaniesWithWallets = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status && ['pending', 'verified', 'deactivated'].includes(status)) {
      query.status = status;
    }

    const companies = await Company.find(query)
      .select('name phone companyNumber status isActive wallet createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Company.countDocuments(query);

    // Ensure all companies have wallet initialized
    const companiesWithWallets = companies.map(company => {
      if (!company.wallet) {
        company.wallet = {
          balance: 0,
          currency: 'INR',
          lastUpdated: new Date()
        };
      }
      return company;
    });

    res.status(200).json({
      success: true,
      message: 'Companies with wallet balances retrieved successfully',
      data: {
        companies: companiesWithWallets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all companies with wallets error:', error);
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
  createConfig,
  getConfig,
  getMarkup,
  updateConfig,
  deleteConfig,
  calculateMarkup,
  updateCompanyWallet,
  getCompanyWallet,
  getAllCompaniesWithWallets
}; 