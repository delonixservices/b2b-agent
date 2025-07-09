const express = require('express');
const {
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
} = require('../controllers/ownerController');
const { isAuth, isAdmin } = require('../middleware/isauth');
const isSuperAdmin = require('../middleware/isadmin');
const { getEmployeesByCompanyId } = require('../controllers/employeeController');

const router = express.Router();

// Public routes
router.post('/login', ownerLogin);
router.post('/setup-super-admin', createSuperAdmin);

// Protected routes
router.get('/dashboard/stats', isAuth, isAdmin, getDashboardStats);
router.get('/companies', isAuth, isAdmin, getAllCompanies);
router.get('/companies/wallets', isAuth, isAdmin, getAllCompaniesWithWallets);
router.get('/companies/:companyId', isAuth, isAdmin, getCompanyById);
router.put('/companies/:companyId/verify', isAuth, isAdmin, verifyCompany);

// Wallet management routes
router.get('/companies/:companyId/wallet', isAuth, isAdmin, getCompanyWallet);
router.put('/companies/:companyId/wallet', isAuth, isAdmin, updateCompanyWallet);

// Configuration routes
router.post('/config', isAuth, isSuperAdmin, createConfig);
router.get('/config', isAuth, isAdmin, getConfig);
router.put('/config', isAuth, isSuperAdmin, updateConfig);
router.delete('/config', isAuth, isSuperAdmin, deleteConfig);
router.post('/config/calculate', isAuth, isAdmin, calculateMarkup);
router.get('/config/markup', isAuth, isAdmin, getMarkup);

// Employee routes
router.get('/companies/:companyId/employees', isAuth, isAdmin, getEmployeesByCompanyId);

module.exports = router;
