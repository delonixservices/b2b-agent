const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelConrtoller');
const { isAuth, isCompanyOrEmployee, isActive } = require('../middleware/isauth');

// All hotel routes require authentication for company/employee access
router.post('/suggest', isAuth, isCompanyOrEmployee, isActive, hotelController.suggest);
router.post('/search', isAuth, isCompanyOrEmployee, isActive, hotelController.searchHotels);
router.post('/packages', isAuth, isCompanyOrEmployee, isActive, hotelController.searchPackages);
router.post('/bookingpolicy', isAuth, isCompanyOrEmployee, isActive, hotelController.bookingpolicy);
router.post('/prebook', isAuth, isCompanyOrEmployee, isActive, hotelController.prebook);

module.exports = router;
