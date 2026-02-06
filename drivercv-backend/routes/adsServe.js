// PATH: DriverAll-main/drivercv-backend/routes/adsServe.js
// ----------------------------------------------------------
// Public serve endpoint: running ads by placement + country
// GET /api/ads/serve?placement=HOME_TOP&country=TR
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();
const AdCampaign = require("../models/AdCampaign");

router.get("/serve", async (req, res) => {
  try {
    const placement = String(req.query.placement || "").trim();
    const country = String(req.query.country || "ALL").toUpperCase();

    if (!placement) return res.status(400).json({ success: false, message: "placement required" });

    const now = new Date();

    const list = await AdCampaign.find({
      status: "running",
      placements: placement,
      startAt: { $lte: now },
      endAt: { $gte: now },
      countryTargets: { $in: [country, "ALL"] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.json({ success: true, ads: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: "serve failed", error: err.message });
  }
});

module.exports = router;
