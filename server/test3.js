require('dotenv').config();
const mongoose = require('mongoose');
const AiCreation = require('./models/AiCreation');

async function testFetch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");
    
    // We don't have the user ID, so let's just fetch all of them to test mapping
    const creations = await AiCreation.find().sort({ createdAt: -1 }).limit(6);
    console.log(`Found ${creations.length} creations.`);
    
    const formattedCreations = creations.map(c => ({
      id: c._id,
      type: c.type,
      title: c.title,
      thumbnailUrl: c.type === 'image' && c.imageUrls ? c.imageUrls[0] : null,
      prompt: c.prompt,
      tone: c.tone,
      output: c.output,
      imageUrls: c.imageUrls,
      createdAt: c.createdAt
    }));
    
    console.log("Success mapped:", formattedCreations.length);
  } catch (err) {
    console.error("Failed!", err);
  } finally {
    await mongoose.disconnect();
  }
}
testFetch();
