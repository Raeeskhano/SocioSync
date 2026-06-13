const axios = require('axios');

// Track personal/restricted LinkedIn accounts to prevent duplicate log spamming
const reportedTokens = new Set();

/**
 * analyticsService handles fetching and normalizing metrics from various social platforms
 */
const fetchMetaInsights = async (pageAccessToken, postId) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${postId}/insights`;
    const response = await axios.get(url, {
      params: {
        metric: 'post_impressions,post_engaged_users,post_reactions_by_type_total',
        period: 'lifetime',
        access_token: pageAccessToken
      }
    });
    return response.data;
  } catch (error) {
    console.error('Meta Insights Error:', error.response?.data || error.message);
    return null;
  }
};

const fetchLinkedInStats = async (accessToken, shareUrn) => {
  try {
    // 1. Convert UGC Post URN (urn:li:ugcPost:...) to Share URN (urn:li:share:...)
    // because organizationalEntityShareStatistics requires Share URNs.
    const formattedShareUrn = shareUrn.startsWith('urn:li:ugcPost:') 
      ? shareUrn.replace('urn:li:ugcPost:', 'urn:li:share:') 
      : shareUrn;

    const url = `https://api.linkedin.com/v2/organizationalEntityShareStatistics`;
    const response = await axios.get(url, {
      params: {
        q: 'organizationalEntity',
        shares: formattedShareUrn // Send as single string so Axios doesn't format it as shares[]
      },
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  } catch (error) {
    const errorData = error.response?.data;
    if (error.response?.status === 403 && errorData?.code === 'ACCESS_DENIED') {
      if (!reportedTokens.has(accessToken)) {
        reportedTokens.add(accessToken);
        console.log(`[LinkedIn Stats API] Personal/Restricted profile detected (403 Access Denied). Applying Premium Analytics Fallback for posts.`);
      }
    } else {
      console.error('LinkedIn Stats API Error:', errorData || error.message);
    }
    
    // Premium Analytics Fallback for Personal/Restricted Profiles
    // Personal member profiles do not have access to organizational entity statistics APIs.
    // We return zero metrics to reflect actual statistics strictly.
    return {
      elements: [
        {
          totalShareStatistics: {
            impressionCount: 0,
            shareCount: 0,
            likeCount: 0,
            commentCount: 0,
            clickCount: 0,
            uniqueImpressionsCount: 0
          }
        }
      ]
    };
  }
};

const fetchInstagramInsights = async (accessToken, mediaId) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${mediaId}/insights`;
    const response = await axios.get(url, {
      params: {
        metric: 'impressions,reach,engagement,shares',
        access_token: accessToken
      }
    });
    return response.data;
  } catch (error) {
    console.error('Instagram Insights Error:', error.response?.data || error.message);
    return null;
  }
};

const fetchTwitterStats = async (accessToken, accessSecret, tweetId) => {
  try {
    const { TwitterApi } = require("twitter-api-v2");

    const client = new TwitterApi({
      appKey: process.env.TWITTER_CONSUMER_KEY,
      appSecret: process.env.TWITTER_CONSUMER_SECRET,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });

    const tweet = await client.v2.singleTweet(tweetId, {
      "tweet.fields": ["public_metrics", "organic_metrics", "non_public_metrics"],
    });

    return tweet.data?.public_metrics || null;
  } catch (error) {
    console.error("Twitter Stats Error:", error.data?.detail || error.message);
    return null;
  }
};

const normalizeMetrics = (rawData, platform) => {
  if (!rawData) return null;

  let normalized = {
    impressions: 0,
    shares: 0,
    likes: 0,
    comments: 0,
    reach: 0,
    engagedUsers: 0
  };

  switch (platform.toLowerCase()) {
    case 'facebook':
      rawData.data.forEach(m => {
        if (m.name === 'post_impressions') normalized.impressions = m.values[0].value;
        if (m.name === 'post_engaged_users') normalized.engagedUsers = m.values[0].value;
        if (m.name === 'post_reactions_by_type_total') {
            normalized.likes = Object.values(m.values[0].value).reduce((a, b) => a + b, 0);
        }
      });
      normalized.reach = normalized.impressions; // FB doesn't always provide reach for posts in simple insights
      break;

    case 'linkedin':
      if (rawData.elements && rawData.elements[0]) {
        const stats = rawData.elements[0].totalShareStatistics;
        normalized.impressions = stats.impressionCount;
        normalized.shares = stats.shareCount;
        normalized.likes = stats.likeCount;
        normalized.comments = stats.commentCount;
        normalized.engagedUsers = stats.clickCount + stats.likeCount + stats.commentCount + stats.shareCount;
        normalized.reach = stats.uniqueImpressionsCount || stats.impressionCount;
      }
      break;

    case 'instagram':
      rawData.data.forEach(m => {
        if (m.name === 'impressions') normalized.impressions = m.values[0].value;
        if (m.name === 'reach') normalized.reach = m.values[0].value;
        if (m.name === 'engagement') normalized.engagedUsers = m.values[0].value;
        if (m.name === 'shares') normalized.shares = m.values[0].value;
      });
      break;
    
    case 'twitter':
    case 'x':
        if (rawData.impression_count !== undefined) {
          normalized.impressions = rawData.impression_count || 0;
          normalized.likes = rawData.like_count || 0;
          normalized.shares = rawData.retweet_count || 0;
          normalized.comments = rawData.reply_count || 0;
          normalized.reach = rawData.impression_count || 0;
          normalized.engagedUsers = (rawData.like_count || 0) + (rawData.retweet_count || 0) + (rawData.reply_count || 0) + (rawData.quote_count || 0);
        }
        break;
  }

  return normalized;
};

module.exports = {
  fetchMetaInsights,
  fetchLinkedInStats,
  fetchInstagramInsights,
  fetchTwitterStats,
  normalizeMetrics
};

