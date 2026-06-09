const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getIntegrations,
  disconnectIntegration,
  reconnectIntegration,
  getSecurityLogs
} = require('../controllers/integrationController');

router.use(protect);

router.get('/', getIntegrations);
router.get('/security-logs', getSecurityLogs);
router.delete('/:platform', disconnectIntegration);
router.post('/:platform/reconnect', reconnectIntegration);

module.exports = router;
