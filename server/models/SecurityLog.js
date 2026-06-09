const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  event: {
    type: String,
    required: true,
    enum: ['connected', 'disconnected', 'token_refreshed', 'publish_attempt', 'error', 'login_success', 'login_failed']
  },
  platform: {
    type: String,
    required: true
  },
  ip: String,
  userAgent: String,
  errorMessage: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('SecurityLog', securityLogSchema);
