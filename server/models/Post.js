const mongoose = require('mongoose');

const PlatformSchema = new mongoose.Schema({
  name: String,
  status: { type: String, default: 'pending' },
  platformPostId: String,
  error: String,
  publishedAt: Date
});

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caption: String,
  mediaUrl: String,
  mediaType: { type: String, enum: ['image', 'video', 'reel'], default: 'image' },
  mediaMimeType: String,
  platforms: [PlatformSchema],
  status: { type: String, enum: ['draft', 'scheduled', 'published', 'partial', 'failed'], default: 'draft' },
  scheduledAt: Date,
  publishedAt: Date,
  reach: { type: Number, default: 0 },
  engagement: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
