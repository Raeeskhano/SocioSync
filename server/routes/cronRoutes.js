const express = require('express');
const router = express.Router();
const cronController = require('../controllers/cronController');

// Middleware to secure cron routes
const verifyCronSecret = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    req.query.secret === process.env.CRON_SECRET
  ) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized cron request' });
};

router.use(verifyCronSecret);

router.post('/publish', cronController.runPublishScheduledPosts);
router.post('/analytics', cronController.runFetchAnalytics);
router.post('/health', cronController.runCheckTokenHealth);

// For Vercel Cron which uses GET requests by default
router.get('/publish', cronController.runPublishScheduledPosts);
router.get('/analytics', cronController.runFetchAnalytics);
router.get('/health', cronController.runCheckTokenHealth);

module.exports = router;
