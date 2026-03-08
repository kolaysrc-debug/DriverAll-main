// OAuth authentication routes: Google, Apple, Microsoft, Yandex
const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// JWT token oluştur
function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ============================================
// GOOGLE OAuth
// ============================================
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed` }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      // Frontend'e token ile redirect
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&provider=google`);
    } catch (err) {
      console.error("Google callback error:", err);
      res.redirect(`${FRONTEND_URL}/login?error=token_generation_failed`);
    }
  }
);

// ============================================
// APPLE OAuth
// ============================================
router.get(
  "/apple",
  passport.authenticate("apple", {
    scope: ["name", "email"],
    session: false,
  })
);

router.post(
  "/apple/callback",
  passport.authenticate("apple", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=apple_auth_failed` }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&provider=apple`);
    } catch (err) {
      console.error("Apple callback error:", err);
      res.redirect(`${FRONTEND_URL}/login?error=token_generation_failed`);
    }
  }
);

// ============================================
// MICROSOFT OAuth
// ============================================
router.get(
  "/microsoft",
  passport.authenticate("microsoft", {
    scope: ["user.read"],
    session: false,
  })
);

router.get(
  "/microsoft/callback",
  passport.authenticate("microsoft", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=microsoft_auth_failed` }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&provider=microsoft`);
    } catch (err) {
      console.error("Microsoft callback error:", err);
      res.redirect(`${FRONTEND_URL}/login?error=token_generation_failed`);
    }
  }
);

// ============================================
// YANDEX OAuth
// ============================================
router.get(
  "/yandex",
  passport.authenticate("yandex", {
    session: false,
  })
);

router.get(
  "/yandex/callback",
  passport.authenticate("yandex", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=yandex_auth_failed` }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&provider=yandex`);
    } catch (err) {
      console.error("Yandex callback error:", err);
      res.redirect(`${FRONTEND_URL}/login?error=token_generation_failed`);
    }
  }
);

module.exports = router;
