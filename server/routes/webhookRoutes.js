const express = require('express');
const router = express.Router();
const { apiKeyAuth } = require('../middleware/apiKeyAuth');
const { receiveData } = require('../controllers/webhookController');

router.post('/incoming', apiKeyAuth, receiveData);

module.exports = router;
