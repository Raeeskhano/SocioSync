const mongoose = require('mongoose');
const Analytics = require('../models/Analytics');
const User = require('../models/User');
const Post = require('../models/Post');

const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Aggregate stats for current 7 days
    const currentStats = await Analytics.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$likes' },
          totalViews: { $sum: '$impressions' },
          totalEngaged: { $sum: '$engagedUsers' },
          totalReach: { $sum: '$reach' }
        }
      }
    ]);

    // Aggregate stats for previous 7 days
    const previousStats = await Analytics.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } } },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$likes' },
          totalViews: { $sum: '$impressions' },
          totalEngaged: { $sum: '$engagedUsers' },
          totalReach: { $sum: '$reach' }
        }
      }
    ]);

    // Weekly posts count
    const weeklyPosts = await Post.countDocuments({
      userId,
      publishedAt: { $gte: sevenDaysAgo },
      status: 'published'
    });

    const curr = currentStats[0] || { totalLikes: 0, totalViews: 0, totalEngaged: 0, totalReach: 0 };
    const prev = previousStats[0] || { totalLikes: 0, totalViews: 0, totalEngaged: 0, totalReach: 0 };

    const calcGrowth = (c, p) => (p === 0 ? (c > 0 ? 100 : 0) : ((c - p) / p) * 100);

    // Greeting logic
    const hour = now.getHours();
    let greeting = 'Morning';
    if (hour >= 12 && hour < 17) greeting = 'Afternoon';
    else if (hour >= 17) greeting = 'Evening';

    res.status(200).json({
      success: true,
      data: {
        greeting: `${greeting}, ${req.user.firstName || 'there'}.`,
        totalLikes: curr.totalLikes,
        totalViews: curr.totalViews,
        engagementRate: curr.totalReach > 0 ? (curr.totalEngaged / curr.totalReach) * 100 : 0,
        weeklyPostsAvg: weeklyPosts,
        likesGrowthPct: calcGrowth(curr.totalLikes, prev.totalLikes),
        viewsGrowthPct: calcGrowth(curr.totalViews, prev.totalViews),
        engGrowthPct: calcGrowth(
          curr.totalReach > 0 ? curr.totalEngaged / curr.totalReach : 0,
          prev.totalReach > 0 ? prev.totalEngaged / prev.totalReach : 0
        ),
        weeklyGrowthPct: calcGrowth(curr.totalReach, prev.totalReach)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getGrowthChart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const growthData = await Analytics.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          follows: { $sum: '$follows' },
          shares: { $sum: '$shares' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          follows: 1,
          shares: 1
        }
      }
    ]);

    res.status(200).json({ success: true, data: growthData });
  } catch (error) {
    next(error);
  }
};

const getChannels = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('linkedAccounts');
    const channels = user.linkedAccounts.map((acc) => ({
      platform: acc.platform,
      accountName: acc.accountName,
      status: acc.status,
      lastSyncedAt: acc.lastSyncedAt
    }));

    res.status(200).json({ success: true, data: channels });
  } catch (error) {
    next(error);
  }
};

const getUsage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('storageUsedMB storageLimitMB plan');
    const usagePercent = (user.storageUsedMB / user.storageLimitMB) * 100;

    res.status(200).json({
      success: true,
      data: {
        usedStorageMB: user.storageUsedMB,
        totalStorageMB: user.storageLimitMB,
        usagePercent,
        plan: user.plan
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getGrowthChart,
  getChannels,
  getUsage
};
