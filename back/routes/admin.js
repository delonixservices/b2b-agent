const express = require('express');
const { Company, Employee } = require('../models/user');
const bcrypt = require('bcryptjs');
const { isAuth, isCompany } = require('../middleware/isauth');

const router = express.Router();

// Middleware to check if user is a company
function companyOnly(req, res, next) {
  // Assume JWT middleware sets req.user
  if (!req.user || req.user.type !== 'company') {
    return res.status(403).json({ message: 'Only companies can perform this action' });
  }
  next();
}

// Note: Employee creation is handled by /auth/employees route in authConrtoller.js
// This route was removed to avoid conflicts with the proper implementation

module.exports = router; 