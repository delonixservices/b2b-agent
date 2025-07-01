const express = require('express');
const { 
  getCompanyDashboard,
  getCompanyProfile,
  updateCompanyProfile,
  getCompanyBookings,
  getCompanyRevenue
} = require('../controllers/employeeController');
const { isAuth, isCompany } = require('../middleware/isauth');

const router = express.Router();

// Company dashboard and business routes (company only)
router.get('/dashboard', isAuth, isCompany, getCompanyDashboard);
router.get('/profile', isAuth, isCompany, getCompanyProfile);
router.put('/profile', isAuth, isCompany, updateCompanyProfile);
router.get('/bookings', isAuth, isCompany, getCompanyBookings);
router.get('/revenue', isAuth, isCompany, getCompanyRevenue);

module.exports = router; 