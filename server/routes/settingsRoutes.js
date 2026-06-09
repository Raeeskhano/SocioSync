const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/upload');
const {
  getProfile,
  updateProfile,
  uploadAvatar: uploadAvatarController,
  getSession,
  getApiKeys,
  generateApiKey,
  revokeApiKey,
  updateStorage
} = require('../controllers/settingsController');

// ─── Validation middleware ──────────────────────────────────────────────────
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// Valid IANA timezone check
const isValidTimezone = (tz) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const profileValidators = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('First name must be 1–50 characters.'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Last name must be 1–50 characters.'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio must be 500 characters or fewer.'),
  body('timezone')
    .optional()
    .custom((value) => {
      if (!isValidTimezone(value)) {
        throw new Error('Invalid IANA timezone string.');
      }
      return true;
    }),
  body('statusBadge')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Status badge must be 20 characters or fewer.')
];

const apiKeyValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('API key name is required.')
    .isLength({ max: 100 }).withMessage('Key name must be 100 characters or fewer.')
];

// ─── All routes require authentication ──────────────────────────────────────
router.use(protect);

// Profile
router.get('/profile', getProfile);
router.put('/profile', profileValidators, handleValidation, updateProfile);

// Avatar
router.post('/avatar', uploadAvatar, uploadAvatarController);

// Session
router.get('/session', getSession);

// API Keys
router.get('/api-keys', getApiKeys);
router.post('/api-keys', apiKeyValidators, handleValidation, generateApiKey);
router.delete('/api-keys/:id', revokeApiKey);

// Storage (internal use by publish/upload flows)
router.put('/storage', updateStorage);

module.exports = router;
