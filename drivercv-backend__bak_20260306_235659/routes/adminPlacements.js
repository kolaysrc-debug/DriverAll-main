// PATH: DriverAll-main/drivercv-backend/routes/adminPlacements.js

const express = require("express");
const router = express.Router();

const AdPlacement = require("../models/AdPlacement");
const { requireAuth, requireRoles } = require("../middleware/auth");

router.get("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const list = await AdPlacement.find({}).sort({ sortOrder: 1, key: 1 }).lean();
    return res.json({ success: true, list });
  } catch (err) {
    return res.status(500).json({ success: false, message: "list failed", error: err.message });
  }
});

router.post("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const b = req.body || {};
    const key = String(b.key || "").trim().toUpperCase();
    if (!key) return res.status(400).json({ success: false, message: "key required" });

    const doc = await AdPlacement.findOneAndUpdate(
      { key },
      {
        $set: {
          label: String(b.label || ""),
          pageKey: String(b.pageKey || ""),
          fixedEnabled: b.fixedEnabled !== false,
          fixedUnitsTotal: Number(b.fixedUnitsTotal || 8),
          fixedAllowMerge: b.fixedAllowMerge !== false,
          fixedMaxMergeUnits: Number(b.fixedMaxMergeUnits || 4),

          carouselEnabled: b.carouselEnabled !== false,
          carouselAllowMerge: b.carouselAllowMerge !== false,
          carouselMaxMergeUnits: Number(b.carouselMaxMergeUnits || 2),
          carouselSpeedMs: Number(b.carouselSpeedMs || 4500),
          carouselMaxItems: Number(b.carouselMaxItems || 10),

          active: b.active !== false,
          sortOrder: Number(b.sortOrder || 0),
          note: String(b.note || ""),
        },
      },
      { new: true, upsert: true }
    );

    return res.json({ success: true, placement: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "save failed", error: err.message });
  }
});

module.exports = router;
