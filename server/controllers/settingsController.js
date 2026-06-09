const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');
const UAParser = require('ua-parser-js');
const User = require('../models/User');
const ApiKey = require('../models/ApiKey');

// ─── GET /api/settings/profile ──────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      'firstName lastName email bio timezone avatarUrl storageUsedMB storageLimitMB plan statusBadge'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const storagePercent = user.storageLimitMB > 0
      ? Math.round((user.storageUsedMB / user.storageLimitMB) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        bio: user.bio,
        timezone: user.timezone,
        avatarUrl: user.avatarUrl,
        storageUsedMB: user.storageUsedMB,
        storageLimitMB: user.storageLimitMB,
        storagePercent,
        plan: user.plan,
        statusBadge: user.statusBadge || ''
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/settings/profile ──────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, bio, timezone, statusBadge } = req.body;

    // Build update object with only provided fields
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (timezone !== undefined) updates.timezone = timezone;
    if (statusBadge !== undefined) updates.statusBadge = statusBadge.trim();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    ).select('firstName lastName email bio timezone avatarUrl storageUsedMB storageLimitMB plan statusBadge');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const storagePercent = user.storageLimitMB > 0
      ? Math.round((user.storageUsedMB / user.storageLimitMB) * 100)
      : 0;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        bio: user.bio,
        timezone: user.timezone,
        avatarUrl: user.avatarUrl,
        storageUsedMB: user.storageUsedMB,
        storageLimitMB: user.storageLimitMB,
        storagePercent,
        plan: user.plan,
        statusBadge: user.statusBadge || ''
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/settings/avatar ──────────────────────────────────────────────
const uploadAvatarHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    // With multer-storage-cloudinary, req.file.path contains the secure Cloudinary URL
    const avatarUrl = req.file.path;

    await User.findByIdAndUpdate(req.user.id, { avatarUrl });

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully.',
      data: { avatarUrl }
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/settings/session ──────────────────────────────────────────────
const getSession = async (req, res, next) => {
  try {
    const parser = new UAParser(req.headers['user-agent']);
    const browserInfo = parser.getBrowser();
    const osInfo = parser.getOS();

    // Get client IP — handle proxy & local dev
    let ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip;
    if (ip === '::1' || ip === '127.0.0.1') ip = '127.0.0.1 (localhost)';
    // Take first IP if comma-separated (proxy chain)
    if (ip.includes(',')) ip = ip.split(',')[0].trim();

    res.status(200).json({
      success: true,
      data: {
        browser: `${browserInfo.name || 'Unknown'} ${browserInfo.version || ''}`.trim(),
        os: `${osInfo.name || 'Unknown'} ${osInfo.version || ''}`.trim(),
        ip,
        lastActive: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/settings/api-keys ─────────────────────────────────────────────
const getApiKeys = async (req, res, next) => {
  try {
    const keys = await ApiKey.find({ userId: req.user.id, isActive: true })
      .sort({ createdAt: -1 })
      .select('name keyPrefix lastUsedAt createdAt isActive');

    const formattedKeys = keys.map(k => ({
      id: k._id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
      isActive: k.isActive
    }));

    res.status(200).json({ success: true, data: formattedKeys });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/settings/api-keys ────────────────────────────────────────────
const generateApiKey = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'API key name is required.' });
    }

    // Generate the raw key
    const rawKey = 'sk_live_' + crypto.randomBytes(32).toString('hex');
    const keyPrefix = rawKey.substring(0, 16);

    // Hash the full key for secure storage
    const salt = await bcrypt.genSalt(10);
    const keyHash = await bcrypt.hash(rawKey, salt);

    const apiKey = await ApiKey.create({
      userId: req.user.id,
      name: name.trim(),
      keyHash,
      keyPrefix
    });

    res.status(201).json({
      success: true,
      message: 'Save this key now — it will not be shown again.',
      data: {
        id: apiKey._id,
        name: apiKey.name,
        fullKey: rawKey,
        keyPrefix: apiKey.keyPrefix,
        createdAt: apiKey.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/settings/api-keys/:id ──────────────────────────────────────
const revokeApiKey = async (req, res, next) => {
  try {
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!apiKey) {
      return res.status(404).json({ success: false, message: 'API key not found.' });
    }

    apiKey.isActive = false;
    await apiKey.save();

    res.status(200).json({ success: true, message: 'API key revoked successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/settings/storage (internal use) ───────────────────────────────
const updateStorage = async (req, res, next) => {
  try {
    const { fileSizeMB } = req.body;

    if (fileSizeMB === undefined || typeof fileSizeMB !== 'number' || fileSizeMB < 0) {
      return res.status(400).json({ success: false, message: 'Valid fileSizeMB is required.' });
    }

    const user = await User.findById(req.user.id).select('storageUsedMB storageLimitMB');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const newUsage = user.storageUsedMB + fileSizeMB;

    if (newUsage > user.storageLimitMB) {
      return res.status(413).json({
        success: false,
        message: 'Storage limit exceeded.',
        data: {
          currentUsageMB: user.storageUsedMB,
          limitMB: user.storageLimitMB,
          requestedMB: fileSizeMB
        }
      });
    }

    user.storageUsedMB = Math.round(newUsage * 100) / 100; // 2 decimal precision
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        storageUsedMB: user.storageUsedMB,
        storageLimitMB: user.storageLimitMB,
        storagePercent: Math.round((user.storageUsedMB / user.storageLimitMB) * 100)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar: uploadAvatarHandler,
  getSession,
  getApiKeys,
  generateApiKey,
  revokeApiKey,
  updateStorage
};
