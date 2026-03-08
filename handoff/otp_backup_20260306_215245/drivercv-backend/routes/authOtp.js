// PATH: DriverAll-main/drivercv-backend/routes/authOtp.js

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const User = require("../models/User");
const OtpVerification = require("../models/OtpVerification");

const { normalizeCountry, normalizePhoneE164 } = require("../services/otp/phone");
const otpEngine = require("../services/otp/engine");

const JWT_SECRET = process.env.JWT_SECRET || "dev-driverall-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

function signToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

function safeStr(v) {
  return String(v ?? "").trim();
}

const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
});

async function getLatestVerification(phoneE164) {
  return OtpVerification.findOne({ phoneE164 })
    .sort({ createdAt: -1 })
    .lean();
}

router.post("/request", requestLimiter, async (req, res) => {
  try {
    const body = req.body || {};

    const country = normalizeCountry(body.country || body.countryCode || "TR", "TR");
    const phoneE164 = normalizePhoneE164(body.phone || body.phoneE164 || "", country);

    if (!phoneE164) {
      return res.status(400).json({ success: false, message: "Geçersiz telefon numarası." });
    }

    const cfg = await otpEngine.getConfigForCountry(country);

    // resend cooldown
    const last = await getLatestVerification(phoneE164);
    if (last?.createdAt && cfg?.resendCooldownSeconds) {
      const cooldownMs = Number(cfg.resendCooldownSeconds) * 1000;
      if (Date.now() - new Date(last.createdAt).getTime() < cooldownMs) {
        return res.status(429).json({
          success: false,
          message: `Çok sık deneme. Lütfen ${cfg.resendCooldownSeconds} saniye bekleyin.`,
        });
      }
    }

    // daily limit
    if (cfg?.maxRequestsPerPhonePerDay) {
      const since = new Date();
      since.setHours(0, 0, 0, 0);

      const count = await OtpVerification.countDocuments({
        phoneE164,
        createdAt: { $gte: since },
      });

      if (count >= Number(cfg.maxRequestsPerPhonePerDay)) {
        return res.status(429).json({
          success: false,
          message: "Günlük doğrulama limiti aşıldı.",
        });
      }
    }

    const sent = await otpEngine.sendOtp({ country, phoneE164 });

    const ttlSeconds = Number(sent?.config?.ttlSeconds || 300);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await OtpVerification.create({
      phoneE164,
      country,
      channel: sent.channel,
      providerKey: sent.providerKey,
      providerRequestId: safeStr(sent.providerRequestId),
      status: "sent",
      expiresAt,
      ip: safeStr(req.ip),
      userAgent: safeStr(req.headers["user-agent"]),
    });

    return res.json({
      success: true,
      phoneE164,
      country,
      channel: sent.channel,
      ttlSeconds,
    });
  } catch (err) {
    console.error("POST /api/auth/otp/request error:", err);
    return res.status(500).json({
      success: false,
      message: "OTP gönderilemedi.",
      error: err?.message || String(err),
      details: err?.details,
    });
  }
});

router.post("/verify", verifyLimiter, async (req, res) => {
  try {
    const body = req.body || {};

    const country = normalizeCountry(body.country || body.countryCode || "TR", "TR");
    const phoneE164 = normalizePhoneE164(body.phone || body.phoneE164 || "", country);
    const code = safeStr(body.code);

    if (!phoneE164) {
      return res.status(400).json({ success: false, message: "Geçersiz telefon numarası." });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: "Kod 6 haneli olmalıdır." });
    }

    const last = await getLatestVerification(phoneE164);
    if (!last) {
      return res.status(400).json({ success: false, message: "Önce doğrulama kodu isteyin." });
    }

    if (last.expiresAt && new Date(last.expiresAt).getTime() < Date.now()) {
      await OtpVerification.updateOne({ _id: last._id }, { $set: { status: "expired" } });
      return res.status(400).json({ success: false, message: "Kodun süresi doldu." });
    }

    // provider verify
    const check = await otpEngine.checkOtp({ country, phoneE164, code });

    const approved = String(check.status || "").toLowerCase() === "approved";
    await OtpVerification.updateOne(
      { _id: last._id },
      {
        $set: {
          status: approved ? "verified" : "failed",
          verifiedAt: approved ? new Date() : null,
          lastError: approved ? "" : `status:${check.status}`,
        },
        $inc: { attempts: 1 },
      }
    );

    if (!approved) {
      return res.status(400).json({ success: false, message: "Kod hatalı." });
    }

    // Find or create user by phone
    let user = await User.findOne({ phone: phoneE164 });

    if (!user) {
      const placeholderEmail = `p_${phoneE164.replace(/[^0-9+]/g, "").replace("+", "")}_${Date.now()}@phone.local`;
      const generatedPassword = `da_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      const passwordHash = await hashPassword(generatedPassword);

      user = new User({
        name: "User",
        email: placeholderEmail.toLowerCase(),
        phone: phoneE164,
        passwordHash,
        role: "driver",
        isActive: true,
        isApproved: true,
      });

      await user.save();
    }

    const token = signToken(user);

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      isApproved: user.isApproved,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error("POST /api/auth/otp/verify error:", err);
    return res.status(500).json({
      success: false,
      message: "OTP doğrulama başarısız.",
      error: err?.message || String(err),
      details: err?.details,
    });
  }
});

module.exports = router;
