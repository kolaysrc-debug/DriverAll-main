const express = require("express");
const router = express.Router();

const { requireAuth, requireRoles } = require("../middleware/auth");
const otpCreds = require("../services/otp/credentials");

function safeStr(v) {
  return String(v ?? "").trim();
}

router.get("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const providerKey = safeStr(req.query.providerKey || "twilioVerify");
    const list = await otpCreds.listCredentials(providerKey);
    return res.json({ success: true, providerKey, credentials: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: "OTP credentials okunamadı.", error: err?.message || String(err) });
  }
});

router.put("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const body = req.body || {};

    const providerKey = safeStr(body.providerKey || "twilioVerify");
    const ref = safeStr(body.ref || "default");

    const hasAccountSidField = Object.prototype.hasOwnProperty.call(body, "accountSid");
    const accountSid = hasAccountSidField ? safeStr(body.accountSid) : undefined;

    const hasVerifyServiceSidField = Object.prototype.hasOwnProperty.call(body, "verifyServiceSid");
    const verifyServiceSid = hasVerifyServiceSidField ? safeStr(body.verifyServiceSid) : undefined;

    const hasAuthTokenField = Object.prototype.hasOwnProperty.call(body, "authToken");
    const authToken = hasAuthTokenField ? safeStr(body.authToken) : undefined;

    const isActive = body.isActive !== false;

    const saved = await otpCreds.upsertCredential({
      providerKey,
      ref,
      accountSid,
      authToken,
      verifyServiceSid,
      isActive,
      updatedBy: req.user?._id,
    });

    return res.json({ success: true, credential: saved });
  } catch (err) {
    const code = err?.code || "";
    const status = code === "OTP_MASTER_KEY_MISSING" ? 500 : 500;
    return res.status(status).json({
      success: false,
      message: "OTP credentials kaydedilemedi.",
      error: err?.message || String(err),
      code,
    });
  }
});

module.exports = router;
