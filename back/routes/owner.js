const express = require('express');
const {
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
} = require('../controllers/ownerController');
const { isAuth, isAdmin } = require('../middleware/isauth');
const { getEmployeesByCompanyId } = require('../controllers/employeeController');

const router = express.Router();

// Public routes
router.post('/login', ownerLogin);
router.post('/setup-super-admin', createSuperAdmin); // One-time setup route

// Protected routes (admin only)
router.get('/dashboard/stats', isAuth, isAdmin, getDashboardStats);
router.get('/companies', isAuth, isAdmin, getAllCompanies);
router.get('/companies/:companyId', isAuth, isAdmin, getCompanyById);
router.get('/companies/:companyId/employees', isAuth, isAdmin, getEmployeesByCompanyId);
router.put('/companies/:companyId/verify', isAuth, isAdmin, verifyCompany);

// Markup routes
router.post('/markups', isAuth, isAdmin, createMarkup);
router.get('/markups', isAuth, isAdmin, getAllMarkups);
router.get('/markups/:markupId', isAuth, isAdmin, getMarkupById);
router.put('/markups/:markupId', isAuth, isAdmin, updateMarkup);
router.delete('/markups/:markupId', isAuth, isAdmin, deleteMarkup);
router.post('/markups/calculate', isAuth, isAdmin, calculateMarkup);

module.exports = router;
