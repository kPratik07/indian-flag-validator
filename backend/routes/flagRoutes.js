const express = require('express');
const router = express.Router();

const flagController = require('../controllers/flagController');

// POST /api/validate-flag
router.post('/validate-flag', flagController.validateFlag);

module.exports = router;
