const mongoose = require('mongoose');

const aiCreationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text', 'image'], required: true },
  title: String,
  prompt: { type: String, required: true },
  tone: String,
  output: String, // For text
  imageUrls: [String], // For images
  createdAt: { type: Date, default: Date.now }
});

aiCreationSchema.pre('save', function() {
  if (!this.title && this.prompt) {
    this.title = this.prompt.substring(0, 30).trim() + (this.prompt.length > 30 ? '...' : '');
  }
});

module.exports = mongoose.model('AiCreation', aiCreationSchema);
