const express = require('express');
const { getEmployeeProfile, updateEmployeeProfile } = require('../controllers/employeeController');
const { isAuth, isEmployee } = require('../middleware/isauth');

const router = express.Router();

// Employee routes (require employee authentication)
router.get('/profile', isAuth, isEmployee, getEmployeeProfile);
router.put('/profile', isAuth, isEmployee, updateEmployeeProfile);

module.exports = router; 