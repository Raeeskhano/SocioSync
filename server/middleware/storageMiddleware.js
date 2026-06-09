const User = require('../models/User');

const checkAndRecordStorage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const fileSizeMB = req.file.size / (1024 * 1024);
    const newUsage = user.storageUsedMB + fileSizeMB;
    
    if (newUsage > user.storageLimitMB) {
      return res.status(413).json({ success: false, message: 'Storage limit exceeded.' });
    }
    
    user.storageUsedMB = Math.round(newUsage * 100) / 100;
    await user.save();
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { checkAndRecordStorage };
