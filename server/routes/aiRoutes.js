const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/authMiddleware');
const {
  suggestDrafts,
  generateCopy,
  generateImages,
  saveImageCreation,
  rewriteCaption,
  getRecentCreations,
  exportCreation
} = require('../controllers/aiController');

// Rate limiting: max 20 AI requests per user per hour
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: 'Too many AI requests. Please try again in an hour.' },
  keyGenerator: (req) => req.user.id, // Limit per user ID
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);

router.post('/suggest-drafts', aiRateLimiter, suggestDrafts);
router.post('/rewrite-caption', aiRateLimiter, rewriteCaption);
router.post('/generate-copy', aiRateLimiter, generateCopy);
router.post('/generate-images', aiRateLimiter, generateImages);
router.post('/save-image', saveImageCreation);
router.get('/recent-creations', getRecentCreations);
router.post('/export', aiRateLimiter, exportCreation);

module.exports = router;
