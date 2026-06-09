const express = require("express");
const router = express.Router();
const passport = require("passport");
const { check } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  connectPlatformCallback,
  disconnectPlatform,
} = require("../controllers/authController");

router.post(
  "/register",
  [
    check("firstName", "First name is required")
      .not()
      .isEmpty()
      .trim()
      .isLength({ max: 50 }),
    check("lastName", "Last name is required")
      .not()
      .isEmpty()
      .trim()
      .isLength({ max: 50 }),
    check("email", "Please include a valid email").isEmail().normalizeEmail(),
    check(
      "password",
      "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 number, and 1 special character",
    )
      .isLength({ min: 8 })
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  ],
  registerUser,
);
const rateLimit = require("express-rate-limit");

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per `window` (here, per 15 minutes)
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router.post(
  "/login",
  loginRateLimiter,
  [
    check("email", "Please include a valid email").isEmail().normalizeEmail(),
    check("password", "Password is required").not().isEmpty(),
  ],
  loginUser,
);
router.get("/me", protect, getMe);
router.post("/logout", protect, logoutUser);

router.get(
  "/connect/facebook",
  protect,
  passport.authenticate("facebook", {
    scope: [
      "email",
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_manage_insights",
      "instagram_content_publish",
      "instagram_manage_comments",
      "business_management",
    ],
  }),
);
router.get(
  "/connect/facebook/callback",
  (req, res, next) => {
    passport.authenticate("facebook", (err, user, info) => {
      if (err) {
        return res.redirect(`${process.env.CLIENT_URL}/integrations?error=${encodeURIComponent(err.message)}`);
      }
      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/integrations?error=Failed+to+connect+Facebook`);
      }
      res.redirect(`${process.env.CLIENT_URL}/integrations?connected=facebook`);
    })(req, res, next);
  }
);

router.get(
  "/connect/linkedin",
  protect,
  passport.authenticate("linkedin", {
    scope: ["openid", "profile", "email", "w_member_social"],
  }),
);
router.get(
  "/connect/linkedin/callback",
  passport.authenticate("linkedin", { failureRedirect: "/login" }),
  connectPlatformCallback,
);

router.get("/connect/twitter", protect, passport.authenticate("twitter"));
router.get(
  "/connect/twitter/callback",
  passport.authenticate("twitter", { failureRedirect: "/login" }),
  connectPlatformCallback,
);

router.delete("/connect/:platform", protect, disconnectPlatform);

module.exports = router;
