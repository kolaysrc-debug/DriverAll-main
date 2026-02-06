// PATH: DriverAll-main/drivercv-backend/routes/adminGeoGroups.js

const express = require("express");
const router = express.Router();

const GeoGroup = require("../models/GeoGroup");
const { requireAuth, requireRoles } = require("../middleware/auth");

router.get("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const country = String(req.query.country || "TR").toUpperCase();
    const list = await GeoGroup.find({ country }).sort({ sortOrder: 1, groupKey: 1 }).lean();
    return res.json({ success: true, list });
  } catch (err) {
    return res.status(500).json({ success: false, message: "list failed", error: err.message });
  }
});

router.post("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const body = req.body || {};
    const country = String(body.country || "TR").toUpperCase();
    const groupKey = String(body.groupKey || "").trim().toUpperCase();
    if (!groupKey) return res.status(400).json({ success: false, message: "groupKey required" });

    const members = Array.isArray(body.members)
      ? body.members.map((x) => String(x).trim()).filter(Boolean)
      : [];

    const doc = await GeoGroup.findOneAndUpdate(
      { country, groupKey },
      {
        $set: {
          label: String(body.label || ""),
          members,
          active: body.active !== false,
          sortOrder: Number(body.sortOrder || 0),
          note: String(body.note || ""),
        },
      },
      { new: true, upsert: true }
    );

    return res.json({ success: true, geoGroup: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "save failed", error: err.message });
  }
});

module.exports = router;
