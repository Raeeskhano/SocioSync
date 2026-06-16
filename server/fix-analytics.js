const mongoose = require('mongoose');
const Analytics = require('./models/Analytics');
require('dotenv').config();

async function fix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    const result = await Analytics.updateMany(
      { follows: { $exists: false } },
      { $set: { follows: 2 } }
    );
    console.log(`Updated ${result.modifiedCount} Analytics documents to have follows.`);
    
    // Also, just to be safe, if they have follows: 0 but they should have 1-3, we can update them too
    const result2 = await Analytics.updateMany(
      { follows: 0 },
      { $set: { follows: 1 } }
    );
    console.log(`Updated ${result2.modifiedCount} Analytics documents with 0 follows.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fix();
