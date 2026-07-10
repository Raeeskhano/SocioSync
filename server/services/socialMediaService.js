const axios = require("axios");
const fs = require("fs");
const path = require("path");

const getFullMediaUrl = (mediaUrl) => {
  if (!mediaUrl) return "";
  if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
    return mediaUrl;
  }
  
  // Clean up absolute path to extract relative uploads path
  let relativePath = mediaUrl.replace(/\\/g, '/');
  const uploadsIndex = relativePath.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    relativePath = relativePath.substring(uploadsIndex + 1); // remove leading slash
  } else if (relativePath.includes('uploads/')) {
    const idx = relativePath.indexOf('uploads/');
    relativePath = relativePath.substring(idx);
  } else {
    // Fallback to basename if uploads folder is not found
    relativePath = `uploads/media/${path.basename(relativePath)}`;
  }

  const baseUrl = process.env.BASE_URL || "https://socio-sync-pi.vercel.app";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
  return `${cleanBase}/${cleanPath}`;
};

/**
 * socialMediaService handles direct API integrations with social platforms
 */
const postToLinkedIn = async (
  token,
  personUrn,
  caption,
  mediaUrl,
  mediaType,
) => {
  try {
    let mediaAsset = null;

    // 1. If there's media, register and upload it first
    if (mediaUrl) {
      // Register upload
      const registerRes = await axios.post(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        {
          registerUploadRequest: {
            recipes:
              mediaType === "video"
                ? ["urn:li:digitalmediaRecipe:feedshare-video"]
                : ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: `urn:li:person:${personUrn}`,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const uploadUrl =
        registerRes.data.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ].uploadUrl;
      mediaAsset = registerRes.data.value.asset;

      // Upload actual file bits
      let fileBuffer;
      if (mediaUrl.startsWith("http")) {
        const response = await axios.get(mediaUrl, { responseType: "arraybuffer" });
        fileBuffer = Buffer.from(response.data);
      } else {
        const filePath = path.isAbsolute(mediaUrl)
          ? mediaUrl
          : path.join(__dirname, "..", mediaUrl);
        fileBuffer = fs.readFileSync(filePath);
      }
      await axios.put(uploadUrl, fileBuffer, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
        },
      });
    }

    // 2. Create UGC Post
    const postData = {
      author: `urn:li:person:${personUrn}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: caption },
          shareMediaCategory: mediaUrl
            ? mediaType === "video"
              ? "VIDEO"
              : "IMAGE"
            : "NONE",
          media: mediaAsset
            ? [
                {
                  status: "READY",
                  media: mediaAsset,
                  title: { text: "SocioSync Post" },
                },
              ]
            : [],
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };

    const response = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      postData,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return { success: true, postId: response.data.id };
  } catch (error) {
    console.error(
      "LinkedIn Post Error:",
      error.response?.data || error.message,
    );
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

const getFacebookPageToken = async (pageId, token) => {
  try {
    const response = await axios.get(
      "https://graph.facebook.com/v18.0/me/accounts",
      {
        params: { access_token: token },
      },
    );

    const pages = response.data?.data || [];
    const page = pages.find((p) => p.id === pageId) || pages[0];
    return page?.access_token || token;
  } catch (err) {
    return token;
  }
};

const postToFacebook = async (token, pageId, caption, mediaUrl, mediaType) => {
  try {
    token = await getFacebookPageToken(pageId, token);
    const FormData = require('form-data');

    let url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    let params = { message: caption, access_token: token };

    if (mediaUrl) {
      if (mediaType === "video") {
        url = `https://graph.facebook.com/v18.0/${pageId}/videos`;
      } else {
        url = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      }
      
      if (mediaUrl.startsWith("http")) {
        delete params.message; // Use specific caption field below
        if (mediaType === "video") {
          params.file_url = mediaUrl;
          if (caption) params.description = caption;
        } else {
          params.url = mediaUrl;
          if (caption) params.caption = caption;
        }
        const response = await axios.post(url, null, { params });
        return { success: true, postId: response.data.id || response.data.post_id };
      }

      const filePath = path.isAbsolute(mediaUrl) ? mediaUrl : path.join(__dirname, "..", mediaUrl);
      
      if (fs.existsSync(filePath)) {
        const formData = new FormData();
        if (caption) {
          formData.append(mediaType === "video" ? 'description' : 'caption', caption);
        }
        formData.append('access_token', token);
        formData.append('source', fs.createReadStream(filePath));
        
        const response = await axios.post(url, formData, {
          headers: formData.getHeaders()
        });
        return { success: true, postId: response.data.id || response.data.post_id };
      }
    }

    const response = await axios.post(url, null, { params });
    return { success: true, postId: response.data.id || response.data.post_id };
  } catch (error) {
    console.error(
      "Facebook Post Error:",
      error.response?.data || error.message,
    );
    let errorMsg = error.response?.data?.error?.message || error.message;
    if (errorMsg.includes("pages_manage_posts") || errorMsg.includes("(#200)") || errorMsg.includes("permission")) {
      errorMsg = "Facebook permission error: Please ensure you have a Facebook Page connected and have granted the app permission to post to it. Posting to personal timelines is not supported.";
    }
    return {
      success: false,
      error: errorMsg,
    };
  }
};

const postToInstagram = async (
  token,
  igUserId,
  caption,
  mediaUrl,
  mediaType,
) => {
  try {
    let finalMediaUrl = mediaUrl;
    
    if (mediaType !== "video" && typeof mediaUrl === 'string' && (mediaUrl.toLowerCase().endsWith('.png') || mediaUrl.toLowerCase().endsWith('.webp'))) {
      try {
        const sharp = require('sharp');
        
        let relativePath = mediaUrl.replace(/\\/g, '/');
        const uploadsIndex = relativePath.indexOf('/uploads/');
        if (uploadsIndex !== -1) {
          relativePath = relativePath.substring(uploadsIndex + 1);
        } else if (relativePath.includes('uploads/')) {
          const idx = relativePath.indexOf('uploads/');
          relativePath = relativePath.substring(idx);
        } else {
          relativePath = `uploads/media/${path.basename(relativePath)}`;
        }
        
        const absolutePath = path.isAbsolute(relativePath) ? relativePath : path.join(__dirname, "..", relativePath);
        
        if (fs.existsSync(absolutePath)) {
          const extIndex = relativePath.lastIndexOf('.');
          const baseRelativePath = extIndex !== -1 ? relativePath.substring(0, extIndex) : relativePath;
          const newRelativePath = `${baseRelativePath}_ig.jpg`;
          const newAbsolutePath = path.join(__dirname, "..", newRelativePath);
          
          if (!fs.existsSync(newAbsolutePath)) {
            await sharp(absolutePath)
              .flatten({ background: { r: 255, g: 255, b: 255 } })
              .jpeg({ quality: 90 })
              .toFile(newAbsolutePath);
          }
            
          finalMediaUrl = newRelativePath;
        }
      } catch (err) {
        console.error("Failed to convert image to JPEG for Instagram:", err);
      }
    }

    const fullMediaUrl = getFullMediaUrl(finalMediaUrl);

    // 1. Create Media Container
    const containerUrl = `https://graph.facebook.com/v18.0/${igUserId}/media`;
    const containerParams = {
      access_token: token,
      caption: caption,
    };

    if (mediaType === "video") {
      containerParams.video_url = fullMediaUrl;
      containerParams.media_type = "VIDEO";
    } else {
      containerParams.image_url = fullMediaUrl;
    }

    const containerRes = await axios.post(containerUrl, null, {
      params: containerParams,
    });
    const creationId = containerRes.data.id;

    // 2. Wait for container to process
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 3. Publish Media
    const publishUrl = `https://graph.facebook.com/v18.0/${igUserId}/media_publish`;
    const publishRes = await axios.post(publishUrl, null, {
      params: { access_token: token, creation_id: creationId },
    });

    return { success: true, postId: publishRes.data.id };
  } catch (error) {
    console.error(
      "Instagram Post Error:",
      error.response?.data || error.message,
    );
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
};

const postToTwitter = async (token, tokenSecret, caption, mediaUrl) => {
  try {
    const { TwitterApi } = require("twitter-api-v2");

    // Create a client with OAuth 1.0a user-context authentication
    const client = new TwitterApi({
      appKey: process.env.TWITTER_CONSUMER_KEY,
      appSecret: process.env.TWITTER_CONSUMER_SECRET,
      accessToken: token,
      accessSecret: tokenSecret,
    });

    // Use read-write client
    const rwClient = client.readWrite;

    let mediaId = null;

    // Upload media if provided
    if (mediaUrl) {
      let filePath;
      let fileBuffer;
      let mimeType;

      if (mediaUrl.startsWith("http")) {
        // Download remote file
        const response = await axios.get(mediaUrl, { responseType: "arraybuffer" });
        fileBuffer = Buffer.from(response.data);
        mimeType = response.headers["content-type"] || "image/jpeg";
      } else {
        // Local file
        filePath = path.isAbsolute(mediaUrl)
          ? mediaUrl
          : path.join(__dirname, "..", mediaUrl);
        
        if (!fs.existsSync(filePath)) {
          console.warn("Twitter media file not found:", filePath);
          // Post without media if file doesn't exist
          const tweetResponse = await rwClient.v2.tweet(caption);
          return { success: true, postId: tweetResponse.data.id };
        }

        fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mimeMap = {
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".png": "image/png",
          ".gif": "image/gif",
          ".webp": "image/webp",
          ".mp4": "video/mp4",
          ".mov": "video/quicktime",
        };
        mimeType = mimeMap[ext] || "image/jpeg";
      }

      // Upload media to Twitter
      const isVideo = mimeType.startsWith("video");
      
      if (isVideo) {
        // Use chunked upload for videos
        mediaId = await client.v1.uploadMedia(fileBuffer, {
          mimeType: mimeType,
          target: "tweet",
          chunkLength: 5 * 1024 * 1024, // 5MB chunks
        });
      } else {
        // Standard upload for images
        mediaId = await client.v1.uploadMedia(fileBuffer, {
          mimeType: mimeType,
          target: "tweet",
        });
      }
    }

    // Post the tweet
    const tweetPayload = {};
    if (caption && caption.trim() !== '') {
      tweetPayload.text = caption;
    }
    if (mediaId) {
      tweetPayload.media = { media_ids: [mediaId] };
    }
    
    if (!tweetPayload.text && !tweetPayload.media) {
      throw new Error("Tweet must contain either text or media.");
    }

    const tweetResponse = await rwClient.v2.tweet(tweetPayload);

    console.log("Twitter post published successfully:", tweetResponse.data.id);
    return { success: true, postId: tweetResponse.data.id };
  } catch (error) {
    console.error(
      "Twitter Post Error:",
      error.data || error.message,
    );
    let errorMsg = error.data?.detail || error.message;
    
    // Provide helpful error messages for common issues
    if (error.code === 401 || error.data?.status === 401) {
      errorMsg = "Twitter authentication failed. Please reconnect your Twitter/X account.";
    } else if (error.code === 403 || error.data?.status === 403) {
      errorMsg = "Twitter API access denied. Your Twitter Developer App may need Elevated or Pro access to post tweets. Check your app permissions at developer.x.com.";
    } else if (error.code === 429 || error.data?.status === 429) {
      errorMsg = "Twitter rate limit exceeded. Please wait a few minutes before posting again.";
    }
    
    return {
      success: false,
      error: errorMsg,
    };
  }
};

const refreshToken = async (platform, rToken) => {
  try {
    switch (platform.toLowerCase()) {
      case "linkedin":
        const response = await axios.post(
          "https://www.linkedin.com/oauth/v2/accessToken",
          null,
          {
            params: {
              grant_type: "refresh_token",
              refresh_token: rToken,
              client_id: process.env.LINKEDIN_CLIENT_ID,
              client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            },
          },
        );
        return {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          expiresIn: response.data.expires_in,
        };
      // Facebook/Instagram tokens are usually long-lived (60 days) and handled differently
      // Twitter OAuth 1.0a doesn't use refresh tokens
      default:
        return null;
    }
  } catch (error) {
    console.error(
      `Token refresh error for ${platform}:`,
      error.response?.data || error.message,
    );
    throw error;
  }
};

const fetchLinkedInProfile = async (token) => {
  const profileRes = await axios.get("https://api.linkedin.com/v2/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const emailRes = await axios.get(
    "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return {
    id: profileRes.data.id,
    name: `${profileRes.data.localizedFirstName} ${profileRes.data.localizedLastName}`,
    handle:
      emailRes.data.elements[0]?.["handle~"]?.emailAddress?.split("@")[0] ||
      profileRes.data.id,
    avatar: null, // Avatar requires more projection or assets API
  };
};

module.exports = {
  postToLinkedIn,
  postToFacebook,
  postToInstagram,
  postToTwitter,
  refreshToken,
  fetchLinkedInProfile,
  // ... other profile fetchers stubs
};
