const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const mongoose = require('mongoose');

// Helper to log security events
const logEvent = async (userId, event, platform, req, error = null) => {
  await SecurityLog.create({
    userId,
    event,
    platform,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    errorMessage: error
  });
};

const getIntegrations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('linkedAccounts');
    
    // Return decrypted display data (already stored decrypted-friendly fields in schema)
    // We never return accessToken/refreshToken here
    const integrations = user.linkedAccounts.map(acc => ({
      platform: acc.platform,
      accountName: acc.accountName,
      accountHandle: acc.accountHandle,
      avatarUrl: acc.avatarUrl,
      followerCount: acc.followerCount,
      status: acc.status,
      lastSyncedAt: acc.lastSyncedAt,
      errorMessage: acc.errorMessage,
      connectedAt: acc.connectedAt
    }));

    res.status(200).json({ success: true, data: integrations });
  } catch (error) {
    next(error);
  }
};

const disconnectIntegration = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const user = await User.findById(req.user.id);
    
    const account = user.linkedAccounts.find(acc => acc.platform === platform);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Integration not found' });
    }

    // Optional: Revoke token with platform API here if needed
    // For now, just remove from local DB
    user.linkedAccounts = user.linkedAccounts.filter(acc => acc.platform !== platform);
    await user.save();

    await logEvent(user._id, 'disconnected', platform, req);

    res.status(200).json({ success: true, message: `${platform} disconnected successfully` });
  } catch (error) {
    next(error);
  }
};

const reconnectIntegration = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const user = await User.findById(req.user.id);

    const account = user.linkedAccounts.find(acc => acc.platform === platform);
    if (account) {
      account.status = 'pending';
      account.errorMessage = null;
      await user.save();
    }

    // Return the OAuth redirect URL
    // Frontend will use this to redirect the user
    const redirectUrls = {
      linkedin: '/api/auth/connect/linkedin',
      facebook: '/api/auth/connect/facebook',
      instagram: '/api/auth/connect/facebook',
      twitter: '/api/auth/connect/twitter'
    };

    // Save userId to session so the subsequent GET redirect (which won't have the Bearer token) can identify the user
    req.session.userId = req.user.id;

    res.status(200).json({ 
      success: true, 
      redirectUrl: redirectUrls[platform.toLowerCase()] 
    });
  } catch (error) {
    next(error);
  }
};

const getSecurityLogs = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await SecurityLog.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIntegrations,
  disconnectIntegration,
  reconnectIntegration,
  getSecurityLogs
};
