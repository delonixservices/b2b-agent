const express = require('express');
const { 
  getCompanyDashboard,
  getCompanyProfile,
  updateCompanyProfile,
  getCompanyBookings,
  getCompanyRevenue,
  setCompanyMarkup,
  getCompanyMarkup,
  calculateMarkup,
  toggleMarkup
} = require('../controllers/employeeController');
const { isAuth, isCompany, isActive } = require('../middleware/isauth');

const router = express.Router();

// Company dashboard and business routes (company only)
router.get('/dashboard', isAuth, isCompany, isActive, getCompanyDashboard);
router.get('/profile', isAuth, isCompany, isActive, getCompanyProfile);
router.put('/profile', isAuth, isCompany, isActive, updateCompanyProfile);
router.get('/bookings', isAuth, isCompany, isActive, getCompanyBookings);
router.get('/revenue', isAuth, isCompany, isActive, getCompanyRevenue);

// Markup routes (company only)
router.post('/markup', isAuth, isCompany, isActive, setCompanyMarkup);
router.get('/markup', isAuth, isCompany, isActive, getCompanyMarkup);
router.post('/markup/calculate', isAuth, isCompany, isActive, calculateMarkup);
router.put('/markup/toggle', isAuth, isCompany, isActive, toggleMarkup);

module.exports = router; 