// PATH: DriverAll-main/drivercv-backend/routes/publicRoles.js
// ----------------------------------------------------------
// Public Roles Config
// - Candidate alt rollerini (subRoles) public olarak verir
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const Role = require("../models/Role");

// ----------------------------------------------------------
// GET /api/public/roles/candidate-subroles
// ----------------------------------------------------------
router.get("/candidate-subroles", async (req, res) => {
  try {
    const roles = await Role.find({
      category: "candidate",
      level: { $gt: 0 },
      isActive: true,
    })
      .sort({ sortOrder: 1, level: 1, name: 1 })
      .lean();

    const items = (roles || []).map((r) => ({
      key: String(r.name || "").trim(),
      label: String(r.displayName || r.name || "").trim(),
      description: String(r.description || "").trim(),
      level: typeof r.level === "number" ? r.level : 1,
      parentRole: r.parentRole ? String(r.parentRole) : null,
    }));

    return res.json({
      success: true,
      subRoles: items,
      count: items.length,
    });
  } catch (err) {
    console.error("GET /api/public/roles/candidate-subroles error:", err);
    return res.status(500).json({
      success: false,
      message: "Candidate sub-roles yüklenemedi",
      error: err?.message || String(err),
    });
  }
});

module.exports = router;
