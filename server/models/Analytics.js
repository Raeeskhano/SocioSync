const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  platform: { type: String, required: true },
  date: { type: Date, required: true }, // The day this data point represents
  impressions: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  engagedUsers: { type: Number, default: 0 },
  engagementRate: { type: Number, default: 0 },
  audienceCountry: String,
  audienceAge: String,
  audienceGender: String,
  peakPostTime: String,
  fetchedAt: { type: Date, default: Date.now }
});

// Compound index for efficient upsert and retrieval
analyticsSchema.index({ userId: 1, postId: 1, date: 1 }, { unique: true });
analyticsSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
