// Middleware to check if user is super admin
const isSuperAdmin = async (req, res, next) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin role required.'
      });
    }

    next();
  } catch (error) {
    console.error('Super admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = isSuperAdmin; 