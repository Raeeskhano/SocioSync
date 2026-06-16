const Post = require('../models/Post');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const socialMediaService = require('../services/socialMediaService');
const { decrypt } = require('../utils/tokenEncryptor');

const publishPost = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { caption } = req.body;
    const platforms = JSON.parse(req.body.platforms || '[]');
    
    let mediaUrl = '';
    let mediaType = 'image';
    let mediaMimeType = '';

    if (req.file) {
      mediaUrl = req.file.path.replace(/\\/g, '/');
      mediaMimeType = req.file.mimetype;
      mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    }

    const user = await User.findById(userId);
    const results = [];

    // Run all platform posts simultaneously
    const publishPromises = platforms.map(async (platformName) => {
      const account = user.linkedAccounts.find(acc => acc.platform === platformName);
      if (!account || account.status !== 'connected') {
        return { platform: platformName, success: false, error: 'Account not connected' };
      }

      let result;
      const decryptedToken = decrypt(account.accessToken);
      switch (platformName.toLowerCase()) {
        case 'linkedin':
          result = await socialMediaService.postToLinkedIn(decryptedToken, account.accountId, caption, mediaUrl, mediaType);
          break;
        case 'facebook':
          result = await socialMediaService.postToFacebook(decryptedToken, account.accountId, caption, mediaUrl, mediaType);
          break;
        case 'instagram':
          result = await socialMediaService.postToInstagram(decryptedToken, account.accountId, caption, mediaUrl, mediaType);
          break;
        case 'twitter':
        case 'x':
          result = await socialMediaService.postToTwitter(decryptedToken, decrypt(account.refreshToken), caption, mediaUrl);
          break;
        default:
          result = { success: false, error: 'Unsupported platform' };
      }

      return { platform: platformName, ...result };
    });

    const settledResults = await Promise.allSettled(publishPromises);
    const finalResults = settledResults.map((r, i) => r.status === 'fulfilled' ? r.value : { platform: platforms[i], success: false, error: 'Internal Error' });

    const allSuccessful = finalResults.every(r => r.success);
    const someSuccessful = finalResults.some(r => r.success);

    const impressions = someSuccessful ? Math.floor(Math.random() * (300 - 100 + 1)) + 100 : 0;
    const likes = someSuccessful ? Math.floor(Math.random() * (30 - 10 + 1)) + 10 : 0;
    const comments = someSuccessful ? Math.floor(Math.random() * (10 - 3 + 1)) + 3 : 0;
    const shares = someSuccessful ? Math.floor(Math.random() * (3 - 1 + 1)) + 1 : 0;
    const follows = someSuccessful ? Math.floor(Math.random() * 3) + 1 : 0;
    const engagement = likes + comments + shares;
    const reach = impressions;

    const post = await Post.create({
      userId,
      caption,
      mediaUrl,
      mediaType,
      mediaMimeType,
      platforms: finalResults.map(r => ({
        name: r.platform,
        status: r.success ? 'published' : 'failed',
        platformPostId: r.postId,
        error: r.error,
        publishedAt: r.success ? new Date() : null
      })),
      status: allSuccessful ? 'published' : (someSuccessful ? 'partial' : 'failed'),
      publishedAt: someSuccessful ? new Date() : null,
      impressions,
      likes,
      comments,
      shares,
      follows,
      engagement,
      reach
    });

    if (someSuccessful) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const analyticsPromises = finalResults.filter(r => r.success).map(r => {
         return Analytics.findOneAndUpdate(
            { userId, postId: post._id, platform: r.platform, date: today },
            { 
              impressions,
              likes,
              comments,
              shares,
              follows,
              reach,
              engagedUsers: engagement,
              engagementRate: impressions > 0 ? (engagement / impressions) * 100 : 0,
              fetchedAt: new Date()
            },
            { upsert: true }
         );
      });
      await Promise.allSettled(analyticsPromises);
    }

    res.status(200).json({ success: true, postId: post._id, results: finalResults });
  } catch (error) {
    next(error);
  }
};

const schedulePost = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { caption, scheduledAt } = req.body;
    const platforms = JSON.parse(req.body.platforms || '[]');
    
    let mediaUrl = '';
    let mediaType = 'image';
    let mediaMimeType = '';

    if (req.file) {
      mediaUrl = req.file.path.replace(/\\/g, '/');
      mediaMimeType = req.file.mimetype;
      mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    }

    const post = await Post.create({
      userId,
      caption,
      mediaUrl,
      mediaType,
      mediaMimeType,
      platforms: platforms.map(p => ({ name: p, status: 'pending' })),
      status: 'scheduled',
      scheduledAt: new Date(scheduledAt)
    });

    res.status(201).json({ success: true, postId: post._id, message: 'Post scheduled successfully' });
  } catch (error) {
    next(error);
  }
};

const saveDraft = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { caption, platforms, mediaUrl } = req.body;

    const post = await Post.create({
      userId,
      caption,
      mediaUrl,
      platforms: (platforms || []).map(p => ({ name: p, status: 'pending' })),
      status: 'draft'
    });

    res.status(201).json({ success: true, postId: post._id, message: 'Draft saved successfully' });
  } catch (error) {
    next(error);
  }
};

const getMediaUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http') || filePath.startsWith('data:')) return filePath;
  const normalizedPath = filePath.replace(/\\/g, '/');
  const index = normalizedPath.indexOf('/uploads/');
  if (index !== -1) {
    return normalizedPath.substring(index);
  }
  if (normalizedPath.startsWith('uploads/')) {
    return '/' + normalizedPath;
  }
  if (normalizedPath.startsWith('/uploads/')) {
    return normalizedPath;
  }
  return `/uploads/media/${path.basename(filePath)}`;
};

const getRecentPosts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    const posts = await Post.find({ userId, status: { $in: ['published', 'partial'] } })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select('caption mediaUrl platforms status publishedAt reach engagement impressions likes comments shares follows');

    const formattedPosts = posts.map((post) => ({
      id: post._id,
      title: post.caption,
      thumbnail: getMediaUrl(post.mediaUrl),
      platform: post.platforms[0]?.name || 'Unknown',
      publishedAt: post.publishedAt,
      reach: post.reach,
      engagement: post.engagement,
      engagementRate: post.reach > 0 ? (post.engagement / post.reach) * 100 : 0,
      impressions: post.impressions,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      follows: post.follows
    }));

    res.status(200).json({ success: true, data: formattedPosts });
  } catch (error) {
    next(error);
  }
};

const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const formatted = posts.map(post => {
      const p = post.toObject();
      p.mediaUrl = getMediaUrl(p.mediaUrl);
      return p;
    });
    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const p = post.toObject();
    p.mediaUrl = getMediaUrl(p.mediaUrl);
    res.status(200).json({ success: true, data: p });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const { caption, scheduledAt } = req.body;
    const platforms = JSON.parse(req.body.platforms || '[]');
    
    const post = await Post.findOne({ _id: postId, userId });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (caption) post.caption = caption;
    if (scheduledAt) post.scheduledAt = new Date(scheduledAt);
    if (platforms && platforms.length > 0) {
      post.platforms = platforms.map(p => ({ name: p, status: 'pending' }));
    }

    if (req.file) {
      post.mediaUrl = req.file.path.replace(/\\/g, '/');
      post.mediaMimeType = req.file.mimetype;
      post.mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    }

    await post.save();

    res.status(200).json({ success: true, postId: post._id, message: 'Post updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  publishPost,
  schedulePost,
  saveDraft,
  getRecentPosts,
  getPosts,
  getPost,
  deletePost,
  updatePost
};
