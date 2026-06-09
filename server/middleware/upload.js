const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const mediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sociosync/media',
    resource_type: 'auto', // supports image and video
    allowed_formats: ['jpg', 'png', 'gif', 'webp', 'mp4', 'mov'],
  },
});

const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sociosync/avatars',
    allowed_formats: ['jpg', 'png', 'webp'],
  },
});

const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
}).single('file');

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).single('avatar');

module.exports = { uploadMedia, uploadAvatar };
