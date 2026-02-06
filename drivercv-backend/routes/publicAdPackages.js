const express = require("express");
const router = express.Router();
const AdPackage = require("../models/AdPackage");

// GET /api/public/ad-packages?country=TR
router.get("/", async (req, res) => {
  try {
    const country = String(req.query.country || "ALL").toUpperCase();

    const all = await AdPackage.find({ active: { $ne: false } })
      .sort({ createdAt: -1 })
      .lean();

    const list = (all || []).filter((p) => {
      const c = String(p.country || "ALL").toUpperCase();
      if (c === "ALL") return true;
      if (!country) return true;
      return c === country;
    });

    return res.json({ success: true, list });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "public packages failed", error: err.message });
  }
});

module.exports = router;
