const express = require('express');
const {
  ownerLogin,
  getAllCompanies,
  getCompanyById,
  verifyCompany,
  getDashboardStats,
  createSuperAdmin
} = require('../controllers/ownerController');
const { isAuth, isAdmin } = require('../middleware/isauth');

const router = express.Router();

// Public routes
router.post('/login', ownerLogin);
router.post('/setup-super-admin', createSuperAdmin); // One-time setup route

// Protected routes (admin only)
router.get('/dashboard/stats', isAuth, isAdmin, getDashboardStats);
router.get('/companies', isAuth, isAdmin, getAllCompanies);
router.get('/companies/:companyId', isAuth, isAdmin, getCompanyById);
router.put('/companies/:companyId/verify', isAuth, isAdmin, verifyCompany);

module.exports = router;
