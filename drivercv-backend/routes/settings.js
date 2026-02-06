// PATH: DriverAll-main/drivercv-backend/routes/settings.js
// ----------------------------------------------------------
// Public settings (frontend buradan okur) + admin update
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();
const AppSetting = require("../models/AppSetting");
const { requireAuth, requireRoles } = require("../middleware/auth");

// Public: ülkeye göre ayarları ver
router.get("/", async (req, res) => {
  const country = String(req.query.country || "TR").toUpperCase();
  const s = await AppSetting.findOne({ country }).lean();
  res.json({
    success: true,
    settings: s || {
      country,
      jobTitleMaxChars: 80,
      jobDescriptionMaxChars: 1000,
      adTextMaxChars: 120,
    },
  });
});

// Admin: update/insert
router.put("/", requireAuth, requireRoles("admin"), async (req, res) => {
  const body = req.body || {};
  const country = String(body.country || "TR").toUpperCase();

  const patch = {
    country,
    jobTitleMaxChars: Number(body.jobTitleMaxChars || 80),
    jobDescriptionMaxChars: Number(body.jobDescriptionMaxChars || 1000),
    adTextMaxChars: Number(body.adTextMaxChars || 120),
    updatedBy: req.user?._id,
  };

  const s = await AppSetting.findOneAndUpdate({ country }, patch, {
    new: true,
    upsert: true,
  }).lean();

  res.json({ success: true, settings: s });
});

module.exports = router;
