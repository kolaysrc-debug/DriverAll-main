const express = require("express");
const router = express.Router();

const OtpConfig = require("../models/OtpConfig");
const { requireAuth, requireRoles } = require("../middleware/auth");

function safeStr(v) {
  return String(v ?? "").trim();
}

function normalizeCountry(v) {
  return safeStr(v).toUpperCase() || "TR";
}

function normalizeProviderRefs(input) {
  const arr = Array.isArray(input) ? input : [];
  return arr
    .map((x) => ({
      providerKey: safeStr(x?.providerKey),
      credentialRef: safeStr(x?.credentialRef),
      isActive: x?.isActive !== false,
    }))
    .filter((x) => !!x.providerKey);
}

router.get("/", requireAuth, requireRoles("admin"), async (req, res) => {
  const country = normalizeCountry(req.query.country || "TR");
  const cfg = await OtpConfig.findOne({ country }).lean();
  return res.json({ success: true, config: cfg });
});

router.put("/", requireAuth, requireRoles("admin"), async (req, res) => {
  const body = req.body || {};
  const country = normalizeCountry(body.country || "TR");

  const patch = {
    country,
    isActive: body.isActive !== false,

    channelPriority: Array.isArray(body.channelPriority)
      ? body.channelPriority.map((x) => safeStr(x).toLowerCase()).filter(Boolean)
      : ["whatsapp", "sms"],

    providers: {
      whatsapp: normalizeProviderRefs(body?.providers?.whatsapp),
      sms: normalizeProviderRefs(body?.providers?.sms),
    },

    brandName: safeStr(body.brandName || "DriverAll"),
    locale: safeStr(body.locale || "tr"),

    otpLength: Number(body.otpLength || 6),
    ttlSeconds: Number(body.ttlSeconds || 300),

    resendCooldownSeconds: Number(body.resendCooldownSeconds || 60),
    maxRequestsPerPhonePerDay: Number(body.maxRequestsPerPhonePerDay || 10),

    updatedBy: req.user?._id,
  };

  const cfg = await OtpConfig.findOneAndUpdate({ country }, patch, {
    new: true,
    upsert: true,
  }).lean();

  return res.json({ success: true, config: cfg });
});

module.exports = router;
