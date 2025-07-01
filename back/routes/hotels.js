const express = require('express');
const {
  getAllHotels,
  getHotelById,
  searchHotels,
  getHotelAvailability,
  getUserBookings
} = require('../controllers/hotelConrtoller');
const { isAuth, isCompanyOrEmployee, isEmployeeOfCompany } = require('../middleware/isauth');

const router = express.Router();

// Hotel routes accessible by both company and employee
router.get('/', isAuth, isCompanyOrEmployee, isEmployeeOfCompany, getAllHotels);
router.get('/search', isAuth, isCompanyOrEmployee, isEmployeeOfCompany, searchHotels);
router.get('/:id', isAuth, isCompanyOrEmployee, isEmployeeOfCompany, getHotelById);
router.get('/availability/check', isAuth, isCompanyOrEmployee, isEmployeeOfCompany, getHotelAvailability);
router.get('/bookings/user', isAuth, isCompanyOrEmployee, isEmployeeOfCompany, getUserBookings);

module.exports = router; 