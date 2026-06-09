const bcrypt = require('bcryptjs');
const ApiKey = require('../models/ApiKey');

const apiKeyAuth = async (req, res, next) => {
  try {
    const rawKey = req.header('x-api-key');
    if (!rawKey) {
      return res.status(401).json({ success: false, message: 'API key is missing' });
    }

    const keyPrefix = rawKey.substring(0, 16);
    
    // Find keys with this prefix
    const potentialKeys = await ApiKey.find({ keyPrefix, isActive: true });
    
    if (!potentialKeys || potentialKeys.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }

    let validKey = null;
    for (const key of potentialKeys) {
      const isMatch = await bcrypt.compare(rawKey, key.keyHash);
      if (isMatch) {
        validKey = key;
        break;
      }
    }

    if (!validKey) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }

    // Attach user id and proceed
    req.user = { id: validKey.userId };
    
    // Update last used asynchronously
    validKey.lastUsedAt = new Date();
    validKey.save().catch(err => console.error('Error updating API key last used:', err));

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { apiKeyAuth };
