// PATH: DriverAll-main/drivercv-backend/routes/jobsFilters.js
// ----------------------------------------------------------
// Public filters schema for jobs
// GET /api/jobs/filters?country=TR
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

let FieldGroup;
try {
  FieldGroup = require("../models/FieldGroup");
} catch (e) {
  FieldGroup = null;
}

router.get("/filters", async (req, res) => {
  try {
    if (!FieldGroup) {
      return res.status(500).json({
        success: false,
        message: "FieldGroup model bulunamadı: ../models/FieldGroup",
      });
    }

    const country = String(req.query.country || "TR").toUpperCase();

    // En güvenli: önce hepsini çek, sonra JS ile filtrele (şema farklılıklarından etkilenmez)
    const all = await FieldGroup.find({}).lean();

    const groups = (all || [])
      .filter((g) => g && g.active !== false)
      .filter((g) => {
        if (!g.country) return true; // country alanı yoksa hepsini göster
        return g.country === "ALL" || String(g.country).toUpperCase() === country;
      })
      .map((g) => ({
        _id: g._id,
        groupKey: g.groupKey,
        groupLabel: g.groupLabel,
        country: g.country || "ALL",
        active: g.active !== false,
        nodes: Array.isArray(g.nodes)
          ? g.nodes
              .filter((n) => n && n.active !== false)
              .sort((a, b) => (Number(a.sortOrder || 0) - Number(b.sortOrder || 0)))
              .map((n) => ({
                key: n.key,
                label: n.label,
                parentKey: n.parentKey || null,
                level: Number(n.level || 0),
                sortOrder: Number(n.sortOrder || 0),
                coverage: Array.isArray(n.coverage) ? n.coverage : [],
                requiredWith: Array.isArray(n.requiredWith) ? n.requiredWith : [],
                equivalentKeys: Array.isArray(n.equivalentKeys) ? n.equivalentKeys : [],
              }))
          : [],
      }));

    return res.json({ success: true, groups });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "filters failed",
      error: err.message,
    });
  }
});

module.exports = router;
