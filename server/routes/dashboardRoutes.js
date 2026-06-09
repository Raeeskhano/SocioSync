const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getSummary,
  getGrowthChart,
  getChannels,
  getUsage
} = require('../controllers/dashboardController');

router.use(protect);

router.get('/summary', getSummary);
router.get('/growth-chart', getGrowthChart);
router.get('/channels', getChannels);
router.get('/usage', getUsage);

module.exports = router;
