const express = require("express");
const router = express.Router();
const AdPackage = require("../models/AdPackage");

// GET /api/public/ad-packages?country=TR
router.get("/", async (req, res) => {
  try {
    const country = String(req.query.country || "ALL").toUpperCase();

    const defaultPlacements = [
      { key: "HOME_TOP", label: "Ana Sayfa Üst", maxDays: 3 },
      { key: "HOME_RIGHT", label: "Ana Sayfa Sağ", maxDays: 3 },
      { key: "DASHBOARD_RIGHT", label: "Panel Sağ", maxDays: 3 },
    ];

    const all = await AdPackage.find({ active: { $ne: false } })
      .sort({ createdAt: -1 })
      .lean();

    const list = (all || [])
      .map((p) => {
        const next = { ...(p || {}) };

        if (next.active === undefined && next.isActive !== undefined) {
          next.active = next.isActive !== false;
        }

        if (!Array.isArray(next.placements) || next.placements.length === 0) {
          next.placements = defaultPlacements;
        }

        if (!next.geoLevel) next.geoLevel = "country";
        if (!next.country) next.country = "ALL";

        return next;
      })
      .filter((p) => {
        const c = String(p.country || "ALL").toUpperCase();
        if (c === "ALL") return true;
        if (!country) return true;
        return c === country;
      })
      .filter((p) => p.active !== false);

    return res.json({ success: true, list });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "public packages failed", error: err.message });
  }
});

module.exports = router;
