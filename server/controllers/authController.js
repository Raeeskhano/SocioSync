const { validationResult } = require('express-validator');
const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const generateToken = require('../utils/generateToken');

const logEvent = async (userId, event, req, error = null) => {
  if (!userId) return;
  try {
    await SecurityLog.create({
      userId,
      event,
      platform: 'local',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      errorMessage: error
    });
  } catch (err) {
    console.error('Failed to log security event:', err);
  }
};

const registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, errors: [{ field: 'confirmPassword', message: 'Passwords do not match' }] });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logEvent(user._id, 'login_failed', req, 'Invalid email or password');
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
    await logEvent(user._id, 'login_success', req);

    const token = generateToken(user._id);

    const mappedLinkedAccounts = user.linkedAccounts.map(account => ({
      platform: account.platform,
      status: account.status,
    }));

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
        timezone: user.timezone,
        storageUsedMB: user.storageUsedMB,
        storageLimitMB: user.storageLimitMB,
        linkedAccounts: mappedLinkedAccounts,
        lastLoginAt: new Date(),
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const mappedLinkedAccounts = user.linkedAccounts.map(account => ({
      platform: account.platform,
      status: account.status,
    }));

    const userData = user.toObject();
    userData.linkedAccounts = mappedLinkedAccounts;
    userData.id = userData._id;
    delete userData._id;
    delete userData.__v;

    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

const connectPlatform = async (req, res, next) => {
  try {
    // TODO: implement
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

const connectPlatformCallback = async (req, res, next) => {
  try {
    const platform = req.authInfo && req.authInfo.platform ? req.authInfo.platform : 'unknown';
    // Success redirect to frontend
    res.redirect(`${process.env.CLIENT_URL}/integrations?connected=${platform}`);
  } catch (error) {
    next(error);
  }
};

const disconnectPlatform = async (req, res, next) => {
  try {
    // TODO: implement
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  connectPlatform,
  connectPlatformCallback,
  disconnectPlatform
};
