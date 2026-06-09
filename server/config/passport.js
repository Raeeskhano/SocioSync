const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const TwitterStrategy = require("passport-twitter").Strategy;
const User = require("../models/User");
const SecurityLog = require("../models/SecurityLog");
const { encrypt } = require("../utils/tokenEncryptor");
const axios = require("axios");

const logSecurityEvent = async (userId, event, platform, req) => {
  try {
    await SecurityLog.create({
      userId,
      event,
      platform,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error("Failed to log security event:", err);
  }
};

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// LinkedIn Strategy (Using standard OAuth2 for better control over OIDC)
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  passport.use(
    "linkedin",
    new OAuth2Strategy(
      {
        authorizationURL: "https://www.linkedin.com/oauth/v2/authorization",
        tokenURL: "https://www.linkedin.com/oauth/v2/accessToken",
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: process.env.LINKEDIN_CALLBACK_URL,
        scope: ["openid", "profile", "email", "w_member_social"],
        state: true,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, params, profile, done) => {
        try {
          const userId =
            req.user?.id || req.session?.userId || req.session?.passport?.user;
          if (!userId) return done(new Error("User not authenticated"));

          const user = await User.findById(userId);

          // Manually fetch profile for OIDC
          const profileResponse = await axios.get(
            "https://api.linkedin.com/v2/userinfo",
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          );
          const profileData = profileResponse.data;

          const linkedAccount = {
            platform: "linkedin",
            accessToken: encrypt(accessToken),
            refreshToken: encrypt(refreshToken || ""),
            tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Default 60 days
            accountId: profileData.sub,
            accountName: profileData.name || "LinkedIn User",
            accountHandle: profileData.email || profileData.sub,
            avatarUrl: profileData.picture || null,
            followerCount: 0,
            status: "connected",
            connectedAt: new Date(),
            lastSyncedAt: new Date(),
          };

          const accountIndex = user.linkedAccounts.findIndex(
            (acc) => acc.platform === "linkedin",
          );
          if (accountIndex > -1) {
            user.linkedAccounts[accountIndex] = linkedAccount;
          } else {
            user.linkedAccounts.push(linkedAccount);
          }

          await user.save();
          await logSecurityEvent(user._id, "connected", "linkedin", req);
          return done(null, user, { platform: "linkedin" });
        } catch (err) {
          console.error(
            "LinkedIn Profile Fetch Error:",
            err.response?.data || err.message,
          );
          return done(err);
        }
      },
    ),
  );
} else {
  console.warn(
    "[Passport] LinkedIn Strategy not initialized: Missing Client ID/Secret",
  );
}

// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ["id", "displayName", "photos", "email"],
        graphApiVersion: "v18.0",
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const userId =
            req.user?.id || req.session?.userId || req.session?.passport?.user;
          if (!userId) return done(new Error("User not authenticated"));

          const user = await User.findById(userId);

          let accountId = profile.id;
          let accountName = profile.displayName;
          let accountHandle =
            profile.emails?.[0]?.value?.split("@")[0] || profile.id;
          let tokenToStore = accessToken;

          try {
            const pagesResponse = await axios.get(
              "https://graph.facebook.com/v18.0/me/accounts",
              {
                params: { access_token: accessToken },
              },
            );

            const pages = pagesResponse.data?.data || [];
            if (pages.length > 0) {
              const page = pages[0];
              accountId = page.id || accountId;
              tokenToStore = page.access_token || tokenToStore;
              accountName = page.name || accountName;
              accountHandle = page.name
                ? page.name.replace(/\s+/g, "").toLowerCase()
                : accountHandle;

              // Check for connected Instagram Business account
              try {
                const igResponse = await axios.get(
                  `https://graph.facebook.com/v18.0/${page.id}`,
                  {
                    params: {
                      fields: "instagram_business_account{id,username,name,profile_picture_url}",
                      access_token: page.access_token,
                    },
                  }
                );
                
                if (igResponse.data?.instagram_business_account) {
                  const ig = igResponse.data.instagram_business_account;
                  const igAccount = {
                    platform: "instagram",
                    accessToken: encrypt(page.access_token),
                    refreshToken: encrypt(accessToken || ""),
                    accountId: ig.id,
                    accountName: ig.name || ig.username,
                    accountHandle: ig.username,
                    avatarUrl: ig.profile_picture_url || null,
                    status: "connected",
                    connectedAt: new Date(),
                    lastSyncedAt: new Date(),
                  };
                  
                  const igIndex = user.linkedAccounts.findIndex(
                    (acc) => acc.platform === "instagram"
                  );
                  if (igIndex > -1) {
                    user.linkedAccounts[igIndex] = igAccount;
                  } else {
                    user.linkedAccounts.push(igAccount);
                  }
                  await logSecurityEvent(user._id, "connected", "instagram", req);
                }
              } catch (igError) {
                console.warn("Failed to fetch Instagram account connected to page:", igError.message);
              }
            } else {
              throw new Error("No Facebook Pages found. You must have a Facebook Page to connect, as posting to personal timelines is not supported by Facebook.");
            }
          } catch (pageError) {
            console.warn(
              "Facebook page fetch failed:",
              pageError.response?.data || pageError.message,
            );
            return done(new Error(pageError.response?.data?.error?.message || pageError.message));
          }

          const linkedAccount = {
            platform: "facebook",
            accessToken: encrypt(tokenToStore),
            refreshToken: encrypt(accessToken || ""),
            accountId,
            accountName,
            accountHandle,
            avatarUrl: profile.photos?.[0]?.value || null,
            status: "connected",
            connectedAt: new Date(),
            lastSyncedAt: new Date(),
          };

          const accountIndex = user.linkedAccounts.findIndex(
            (acc) => acc.platform === "facebook",
          );
          if (accountIndex > -1) {
            user.linkedAccounts[accountIndex] = linkedAccount;
          } else {
            user.linkedAccounts.push(linkedAccount);
          }

          await user.save();
          await logSecurityEvent(user._id, "connected", "facebook", req);
          return done(null, user, { platform: "facebook" });
        } catch (err) {
          return done(err);
        }
      },
    ),
  );
} else {
  console.warn(
    "[Passport] Facebook Strategy not initialized: Missing App ID/Secret",
  );
}

// Twitter Strategy
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: process.env.TWITTER_CALLBACK_URL,
        passReqToCallback: true,
      },
      async (req, token, tokenSecret, profile, done) => {
        try {
          const userId =
            req.user?.id || req.session?.userId || req.session?.passport?.user;
          if (!userId) return done(new Error("User not authenticated"));

          const user = await User.findById(userId);

          const linkedAccount = {
            platform: "twitter",
            accessToken: encrypt(token),
            refreshToken: encrypt(tokenSecret || ""),
            accountId: profile.id,
            accountName: profile.displayName,
            accountHandle: profile.username,
            avatarUrl: profile.photos?.[0]?.value || null,
            followerCount: profile._json.followers_count || 0,
            status: "connected",
            connectedAt: new Date(),
            lastSyncedAt: new Date(),
          };

          const accountIndex = user.linkedAccounts.findIndex(
            (acc) => acc.platform === "twitter",
          );
          if (accountIndex > -1) {
            user.linkedAccounts[accountIndex] = linkedAccount;
          } else {
            user.linkedAccounts.push(linkedAccount);
          }

          await user.save();
          await logSecurityEvent(user._id, "connected", "twitter", req);
          return done(null, user, { platform: "twitter" });
        } catch (err) {
          return done(err);
        }
      },
    ),
  );
} else {
  console.warn(
    "[Passport] Twitter Strategy not initialized: Missing Consumer Key/Secret",
  );
}

module.exports = passport;
