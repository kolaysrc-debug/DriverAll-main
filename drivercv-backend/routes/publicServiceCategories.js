// PATH: drivercv-backend/routes/publicServiceCategories.js
// ----------------------------------------------------------
// Public Service Categories (aktif olanları listele)
// Base: /api/public/service-categories
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();
const ServiceCategory = require("../models/ServiceCategory");

router.get("/", async (req, res) => {
  try {
    const country = String(req.query.country || "").trim().toUpperCase();
    const q = { active: true };
    if (country) {
      q.$or = [{ country: "ALL" }, { country }];
    }
    const items = await ServiceCategory.find(q).sort({ sortOrder: 1, label: 1 }).lean();
    res.json({ success: true, categories: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
