require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Analytics = require('../models/Analytics');
const Post = require('../models/Post');
const User = require('../models/User');

const checkDb = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();
    const analyticsCount = await Analytics.countDocuments();

    console.log(`\n--- Database Status ---`);
    console.log(`Total Users: ${userCount}`);
    console.log(`Total Posts: ${postCount}`);
    console.log(`Total Analytics Records: ${analyticsCount}`);

    console.log(`\n--- Users ---`);
    const users = await User.find({}, 'email firstName linkedAccounts');
    users.forEach(u => {
      console.log(`User: ${u.email} (${u.firstName}), Linked Accounts:`, u.linkedAccounts.map(acc => `${acc.platform}:${acc.status}`));
    });

    console.log(`\n--- Sample Posts ---`);
    const posts = await Post.find().limit(5);
    posts.forEach(p => {
      console.log(`Post ID: ${p._id}, Title: "${p.title}", Status: ${p.status}, Platforms:`, p.platforms.map(pl => `${pl.name}:${pl.status}:${pl.platformPostId}`));
    });

    console.log(`\n--- Sample Analytics ---`);
    const analytics = await Analytics.find().sort({ date: -1 }).limit(10);
    analytics.forEach(a => {
      console.log(`Date: ${a.date.toISOString().split('T')[0]}, Platform: ${a.platform}, Impressions: ${a.impressions}, Shares: ${a.shares}, Likes: ${a.likes}, Comments: ${a.comments}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected.');
  } catch (error) {
    console.error('Error running check script:', error);
  }
};

checkDb();
