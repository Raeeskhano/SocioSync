const cronService = require('../services/cronService');

const runPublishScheduledPosts = async (req, res, next) => {
  try {
    const result = await cronService.publishScheduledPosts();
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const runFetchAnalytics = async (req, res, next) => {
  try {
    const result = await cronService.fetchAnalytics();
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const runCheckTokenHealth = async (req, res, next) => {
  try {
    const result = await cronService.checkTokenHealth();
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  runPublishScheduledPosts,
  runFetchAnalytics,
  runCheckTokenHealth
};
