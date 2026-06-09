const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const LinkedAccountSchema = new mongoose.Schema({
  platform: String,
  accessToken: String,
  refreshToken: String,
  tokenExpiresAt: Date,
  accountId: String,
  accountName: String,
  accountHandle: String,
  avatarUrl: String,
  followerCount: Number,
  status: { type: String, default: 'connected' },
  errorMessage: String,
  lastSyncedAt: Date,
  connectedAt: Date
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  avatarUrl: { type: String, default: null },
  bio: { type: String, default: '' },
  timezone: { type: String, default: 'America/New_York' },
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  storageUsedMB: { type: Number, default: 0 },
  storageLimitMB: { type: Number, default: 1024000 },
  statusBadge: { type: String, default: '', maxlength: 20, trim: true },
  linkedAccounts: [LinkedAccountSchema],
  lastLoginAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
