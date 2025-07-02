const express = require('express');
const router = express.Router();
const suggestController = require('../controllers/suggestController');

// Suggest API endpoint
router.post('/suggest', suggestController.suggest);

module.exports = router;
