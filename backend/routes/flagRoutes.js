const express = require('express');
const router = express.Router();

const flagController = require('../controllers/flagController');

router.post('/validate-flag', flagController.validateFlag);

module.exports = router;
