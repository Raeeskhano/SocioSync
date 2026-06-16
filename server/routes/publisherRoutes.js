const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadMedia } = require('../middleware/upload');
const { checkAndRecordStorage } = require('../middleware/storageMiddleware');
const {
  publishPost,
  schedulePost,
  saveDraft,
  getRecentPosts,
  getPosts,
  getPost,
  deletePost,
  updatePost
} = require('../controllers/publisherController');

router.use(protect);

router.get('/recent', getRecentPosts);
router.post('/publish', uploadMedia, checkAndRecordStorage, publishPost);
router.post('/schedule', uploadMedia, checkAndRecordStorage, schedulePost);
router.post('/draft', saveDraft);
router.get('/', getPosts);
router.get('/:id', getPost);
router.put('/:id', uploadMedia, checkAndRecordStorage, updatePost);
router.delete('/:id', deletePost);

module.exports = router;
