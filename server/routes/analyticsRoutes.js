const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getSummary,
  getVelocity,
  getPlatformSplit,
  getTopPosts,
  getAudienceGeo,
  exportAnalytics,
  syncAnalytics
} = require('../controllers/analyticsController');

router.use(protect);

router.post('/sync', syncAnalytics);
router.get('/summary', getSummary);
router.get('/velocity', getVelocity);
router.get('/platform-split', getPlatformSplit);
router.get('/top-posts', getTopPosts);
router.get('/audience-geo', getAudienceGeo);
router.get('/export', exportAnalytics);

module.exports = router;
