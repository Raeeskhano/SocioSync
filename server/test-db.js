require('dotenv').config();
const mongoose = require('mongoose');
const AiCreation = require('./models/AiCreation');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    const doc = await AiCreation.create({
      userId: new mongoose.Types.ObjectId(),
      type: 'text',
      prompt: 'test prompt',
      tone: 'humanized',
      output: 'test output'
    });
    console.log("Saved document:", doc);
    await AiCreation.deleteOne({ _id: doc._id });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
