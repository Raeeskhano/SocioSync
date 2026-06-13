const Post = require('../models/Post');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const socialMediaService = require('./socialMediaService');
const analyticsService = require('./analyticsService');
const { decrypt, encrypt } = require('../utils/tokenEncryptor');

/**
 * cronService handles automated tasks like publishing scheduled posts
 * Refactored for Serverless (Vercel) execution.
 */

const publishScheduledPosts = async () => {
  try {
    const now = new Date();
    
    // Find posts scheduled for now or earlier that haven't been published
    const scheduledPosts = await Post.find({
      status: 'scheduled',
      scheduledAt: { $lte: now }
    });

    if (scheduledPosts.length === 0) return { message: 'No posts to publish' };

    console.log(`[Cron] Found ${scheduledPosts.length} posts to publish.`);

    for (const post of scheduledPosts) {
      const user = await User.findById(post.userId);
      if (!user) {
        post.status = 'failed';
        await post.save();
        continue;
      }

      const publishPromises = post.platforms.map(async (p) => {
        if (p.status !== 'pending') return { platform: p.name, success: p.status === 'published' };

        const account = user.linkedAccounts.find(acc => acc.platform === p.name);
        if (!account || account.status !== 'connected') {
          return { platform: p.name, success: false, error: 'Account not connected' };
        }

        let result;
        const decryptedToken = decrypt(account.accessToken);
        switch (p.name.toLowerCase()) {
          case 'linkedin':
            result = await socialMediaService.postToLinkedIn(decryptedToken, account.accountId, post.caption, post.mediaUrl, post.mediaType);
            break;
          case 'facebook':
            result = await socialMediaService.postToFacebook(decryptedToken, account.accountId, post.caption, post.mediaUrl, post.mediaType);
            break;
          case 'instagram':
            result = await socialMediaService.postToInstagram(decryptedToken, account.accountId, post.caption, post.mediaUrl, post.mediaType);
            break;
          case 'twitter':
          case 'x':
            result = await socialMediaService.postToTwitter(decryptedToken, decrypt(account.refreshToken), post.caption, post.mediaUrl);
            break;
          default:
            result = { success: false, error: 'Unsupported platform' };
        }

        return { platform: p.name, ...result };
      });

      const settledResults = await Promise.allSettled(publishPromises);
      const finalResults = settledResults.map((r, i) => r.status === 'fulfilled' ? r.value : { platform: post.platforms[i].name, success: false, error: 'Internal Error' });

      // Update post document
      post.platforms = post.platforms.map(p => {
        const res = finalResults.find(r => r.platform === p.name);
        if (res) {
          p.status = res.success ? 'published' : 'failed';
          p.platformPostId = res.postId;
          p.error = res.error;
          if (res.success) p.publishedAt = new Date();
        }
        return p;
      });

      const allSuccessful = post.platforms.every(p => p.status === 'published');
      const someSuccessful = post.platforms.some(p => p.status === 'published');

      post.status = allSuccessful ? 'published' : (someSuccessful ? 'partial' : 'failed');
      post.publishedAt = someSuccessful ? new Date() : null;
      
      await post.save();
      console.log(`[Cron] Post ${post._id} status updated to ${post.status}.`);
    }

    return { message: `Processed ${scheduledPosts.length} scheduled posts` };
  } catch (error) {
    console.error('[Cron Error]:', error.message);
    throw error;
  }
};

const fetchAnalytics = async () => {
  try {
    console.log('[Cron] Fetching latest analytics for active posts...');
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Find all published posts within the last 90 days
    const activePosts = await Post.find({
      status: { $in: ['published', 'partial'] },
      publishedAt: { $gte: ninetyDaysAgo }
    });

    for (const post of activePosts) {
      const user = await User.findById(post.userId);
      if (!user) continue;

      for (const p of post.platforms) {
        if (p.status !== 'published' || !p.platformPostId) continue;

        const account = user.linkedAccounts.find(acc => acc.platform === p.name);
        if (!account || account.status !== 'connected') continue;

        let rawData;
        const decryptedToken = decrypt(account.accessToken);
        switch (p.name.toLowerCase()) {
          case 'facebook':
            rawData = await analyticsService.fetchMetaInsights(decryptedToken, p.platformPostId);
            break;
          case 'linkedin':
            rawData = await analyticsService.fetchLinkedInStats(decryptedToken, p.platformPostId);
            break;
          case 'instagram':
            rawData = await analyticsService.fetchInstagramInsights(decryptedToken, p.platformPostId);
            break;
          case 'twitter':
          case 'x':
            const decryptedSecret = decrypt(account.refreshToken);
            rawData = await analyticsService.fetchTwitterStats(decryptedToken, decryptedSecret, p.platformPostId);
            break;
          default:
            rawData = null;
        }

        const metrics = analyticsService.normalizeMetrics(rawData, p.name);
        if (metrics) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          await Analytics.findOneAndUpdate(
            { userId: post.userId, postId: post._id, platform: p.name, date: today },
            { 
              ...metrics, 
              engagementRate: metrics.impressions > 0 ? (metrics.engagedUsers / metrics.impressions) * 100 : 0,
              fetchedAt: new Date() 
            },
            { upsert: true, returnDocument: 'after' }
          );
        }
      }
    }
    console.log('[Cron] Analytics update completed.');
    return { message: 'Analytics updated successfully' };
  } catch (error) {
    console.error('[Cron Analytics Error]:', error.message);
    throw error;
  }
};

const checkTokenHealth = async () => {
  try {
    console.log('[Cron] Checking token health...');
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);

    const users = await User.find({
      'linkedAccounts.tokenExpiresAt': { $lte: tomorrow },
      'linkedAccounts.status': 'connected'
    });

    for (const user of users) {
      for (const account of user.linkedAccounts) {
        if (account.status === 'connected' && account.tokenExpiresAt <= tomorrow) {
          try {
            const rToken = decrypt(account.refreshToken);
            if (!rToken) continue;

            const refreshed = await socialMediaService.refreshToken(account.platform, rToken);
            if (refreshed) {
              account.accessToken = encrypt(refreshed.accessToken);
              if (refreshed.refreshToken) account.refreshToken = encrypt(refreshed.refreshToken);
              account.tokenExpiresAt = new Date(Date.now() + (refreshed.expiresIn * 1000));
              account.status = 'connected';
              account.errorMessage = null;
              console.log(`[Cron] Refreshed token for ${user.email} on ${account.platform}`);
            }
          } catch (err) {
            account.status = 'error';
            account.errorMessage = 'Token refresh failed. Please reconnect.';
            console.error(`[Cron] Refresh failed for ${user.email} on ${account.platform}:`, err.message);
          }
        }
      }
      await user.save();
    }
    return { message: 'Token health check completed' };
  } catch (error) {
    console.error('[Cron Token Health Error]:', error.message);
    throw error;
  }
};

module.exports = { publishScheduledPosts, fetchAnalytics, checkTokenHealth };
