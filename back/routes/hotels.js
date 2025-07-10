const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelConrtoller');
const paymentController = require('../controllers/paymentConrtoller');
const { isAuth, isCompanyOrEmployee, isActive } = require('../middleware/isauth');

// All hotel routes require authentication for company/employee access
router.post('/suggest', isAuth, isCompanyOrEmployee, isActive, hotelController.suggest);
router.post('/search', isAuth, isCompanyOrEmployee, isActive, hotelController.search);
router.post('/searchHotels', isAuth, isCompanyOrEmployee, isActive, hotelController.searchHotels);
router.post('/searchHotelsByCity', isAuth, isCompanyOrEmployee, isActive, hotelController.searchHotelsByCity);
router.post('/packages', isAuth, isCompanyOrEmployee, isActive, hotelController.searchPackages);
router.post('/bookingpolicy', isAuth, isCompanyOrEmployee, isActive, hotelController.bookingpolicy);
router.post('/prebook', isAuth, isCompanyOrEmployee, isActive, hotelController.prebook);
router.get('/transaction-identifier', isAuth, isCompanyOrEmployee, isActive, hotelController.getTransactionIdentifier);
router.post('/get-hotel-id', isAuth, isCompanyOrEmployee, isActive, hotelController.getHotelId);

// Payment routes
router.get('/process-payment/:id', paymentController.processPayment);
router.post('/payment-response-handler', paymentController.paymentResponseHandler);
router.post('/process-wallet-payment', isAuth, isCompanyOrEmployee, isActive, hotelController.processWalletPayment);
router.post('/confirm-booking', isAuth, isCompanyOrEmployee, isActive, paymentController.confirmBooking);

// Wallet payment routes
router.get('/wallet/balance', isAuth, isCompanyOrEmployee, isActive, paymentController.getWalletBalance);
router.post('/wallet/check-eligibility', isAuth, isCompanyOrEmployee, isActive, paymentController.checkWalletPaymentEligibility);
router.post('/wallet/payment', isAuth, isCompanyOrEmployee, isActive, paymentController.processWalletPayment);

module.exports = router;
