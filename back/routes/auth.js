const express = require('express');
const { 
  sendOtp, 
  verifyOtp, 
  completeSignup, 
  login,
  addEmployee,
  getEmployees,
  deactivateEmployee,
  submitBusinessDetails,
  saveBusinessDetails,
  getBusinessDetails,
  uploadLogo,
  getLogo,
  sendPasswordResetOtp,
  resetPassword
} = require('../controllers/authConrtoller');
const { isAuth, isCompany, isActive } = require('../middleware/isauth');

const router = express.Router();

// Public routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/complete-signup', completeSignup);
router.post('/login', login);
router.post('/business-details', submitBusinessDetails);
router.post('/send-password-reset-otp', sendPasswordResetOtp);
router.post('/reset-password', resetPassword);

// Company only routes (employee management)
router.post('/employees', isAuth, isCompany, isActive, addEmployee);
router.get('/employees', isAuth, isCompany, isActive, getEmployees);
router.put('/employees/:employeeId/deactivate', isAuth, isCompany, isActive, deactivateEmployee);

// Company business details routes
router.post('/save-business-details', isAuth, isCompany, saveBusinessDetails);
router.get('/business-details', isAuth, isCompany, getBusinessDetails);

// Company logo routes
router.post('/upload-logo', isAuth, isCompany, uploadLogo);
router.get('/logo', isAuth, isCompany, getLogo);

module.exports = router; 