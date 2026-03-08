// PATH: DriverAll-main/drivercv-backend/routes/adminBusinessPolicies.js

const express = require("express");
const router = express.Router();

const BusinessPolicy = require("../models/BusinessPolicy");
const { requireAuth, requireRoles } = require("../middleware/auth");

// list
router.get("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const country = String(req.query.country || "TR").toUpperCase();
    const list = await BusinessPolicy.find({ country }).sort({ sortOrder: 1, businessType: 1 }).lean();
    return res.json({ success: true, list });
  } catch (err) {
    return res.status(500).json({ success: false, message: "list failed", error: err.message });
  }
});

// upsert
router.post("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const body = req.body || {};
    const country = String(body.country || "TR").toUpperCase();
    const businessType = String(body.businessType || "").trim();

    if (!businessType) return res.status(400).json({ success: false, message: "businessType required" });

    const doc = await BusinessPolicy.findOneAndUpdate(
      { country, businessType },
      {
        $set: {
          restricted: !!body.restricted,
          requiredGeoLevel: String(body.requiredGeoLevel || "district"),
          allowGeoGroups: body.allowGeoGroups !== false,
          note: String(body.note || ""),
          active: body.active !== false,
          sortOrder: Number(body.sortOrder || 0),
        },
      },
      { new: true, upsert: true }
    );

    return res.json({ success: true, policy: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "save failed", error: err.message });
  }
});

module.exports = router;
