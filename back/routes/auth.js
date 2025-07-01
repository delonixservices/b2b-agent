const express = require('express');
const { 
  sendOtp, 
  verifyOtp, 
  completeSignup, 
  login,
  addEmployee,
  getEmployees,
  deactivateEmployee
} = require('../controllers/authConrtoller');
const { isAuth, isCompany } = require('../middleware/isauth');

const router = express.Router();

// Public routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/complete-signup', completeSignup);
router.post('/login', login);

// Company only routes (employee management)
router.post('/employees', isAuth, isCompany, addEmployee);
router.get('/employees', isAuth, isCompany, getEmployees);
router.put('/employees/:employeeId/deactivate', isAuth, isCompany, deactivateEmployee);

module.exports = router; 