const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelConrtoller');
const paymentController = require('../controllers/paymentConrtoller');
const { isAuth, isCompanyOrEmployee, isActive } = require('../middleware/isauth');

// All hotel routes require authentication for company/employee access
router.post('/suggest', isAuth, isCompanyOrEmployee, isActive, hotelController.suggest);
router.post('/search', isAuth, isCompanyOrEmployee, isActive, hotelController.searchHotels);
router.post('/packages', isAuth, isCompanyOrEmployee, isActive, hotelController.searchPackages);
router.post('/bookingpolicy', isAuth, isCompanyOrEmployee, isActive, hotelController.bookingpolicy);
router.post('/prebook', isAuth, isCompanyOrEmployee, isActive, hotelController.prebook);
router.get('/transaction-identifier', isAuth, isCompanyOrEmployee, isActive, hotelController.getTransactionIdentifier);

// Payment routes
router.get('/process-payment/:id', paymentController.processPayment);
router.post('/payment-response-handler', paymentController.paymentResponseHandler);
router.post('/confirm-booking', isAuth, isCompanyOrEmployee, isActive, paymentController.confirmBooking);

module.exports = router;
