// PATH: DriverAll-main/drivercv-backend/routes/publicJobPackages.js
// ----------------------------------------------------------
// Public Job Packages API
// - GET /api/public/job-packages?country=TR
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const JobPackage = require("../models/JobPackage");

router.get("/", async (req, res) => {
  try {
    const country = String(req.query.country || "ALL").trim().toUpperCase();

    const all = await JobPackage.find({ active: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(500)
      .lean();

    const list = (all || [])
      .filter((p) => {
        const c = String(p.country || "ALL").toUpperCase();
        return c === "ALL" || c === country;
      });

    return res.json({ success: true, list });
  } catch (err) {
    return res.status(500).json({ success: false, message: "public list failed", error: err.message });
  }
});

module.exports = router;
