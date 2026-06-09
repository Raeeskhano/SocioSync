require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Analytics = require('../models/Analytics');

const cleanupDb = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const analyticsCountBefore = await Analytics.countDocuments();
    console.log(`Analytics records in database before cleanup: ${analyticsCountBefore}`);

    if (analyticsCountBefore > 0) {
      console.log('Deleting all records in Analytics collection...');
      const result = await Analytics.deleteMany({});
      console.log(`Successfully deleted ${result.deletedCount} analytics records!`);
    } else {
      console.log('No analytics records found to clean up.');
    }

    const analyticsCountAfter = await Analytics.countDocuments();
    console.log(`Analytics records in database after cleanup: ${analyticsCountAfter}`);

    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (error) {
    console.error('Error running cleanup script:', error);
  }
};

cleanupDb();
