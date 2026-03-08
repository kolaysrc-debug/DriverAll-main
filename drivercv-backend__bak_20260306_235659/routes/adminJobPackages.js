// PATH: DriverAll-main/drivercv-backend/routes/adminJobPackages.js
// ----------------------------------------------------------
// Admin Job Packages API
// - GET    /api/admin/job-packages
// - POST   /api/admin/job-packages
// - PUT    /api/admin/job-packages/:id
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const JobPackage = require("../models/JobPackage");
const { requireAuth, requireRoles } = require("../middleware/auth");

function normCountry(v) {
  const s = String(v || "ALL").trim().toUpperCase();
  return s || "ALL";
}

function normGeoLevel(v) {
  const s = String(v || "country").trim();
  return s || "country";
}

function normalizePlacements(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((p) => ({
      key: String(p?.key || "").trim(),
      label: String(p?.label || p?.key || "").trim(),
      maxDays: Number(p?.maxDays || 0) || 0,
      notes: String(p?.notes || "").trim(),
    }))
    .filter((p) => p.key);
}

function normalizeStringList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => String(x || "").trim()).filter(Boolean);
}

// ----------------------------------------------------------
// LIST
// ----------------------------------------------------------
router.get("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const list = await JobPackage.find({})
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(500)
      .lean();

    return res.json({ success: true, packages: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: "list failed", error: err.message });
  }
});

// ----------------------------------------------------------
// CREATE
// ----------------------------------------------------------
router.post("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const body = req.body || {};

    const name = String(body.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "name required" });

    const doc = await JobPackage.create({
      name,
      country: normCountry(body.country),
      geoLevel: normGeoLevel(body.geoLevel),

      placements: normalizePlacements(body.placements),
      durationDays: Number(body.durationDays || 0) || 7,
      maxJobs: Number(body.maxJobs || 0) || 1,
      price: Number(body.price || 0) || 0,
      currency: String(body.currency || "EUR").trim().toUpperCase(),

      requiresAdminApproval: body.requiresAdminApproval !== false,
      restrictedBusinessTypes: normalizeStringList(body.restrictedBusinessTypes),

      active: body.active !== false,
      sortOrder: Number(body.sortOrder || 0) || 0,
      note: String(body.note || ""),
    });

    return res.json({ success: true, package: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "package create failed", error: err.message });
  }
});

// ----------------------------------------------------------
// UPDATE (partial allowed)
// ----------------------------------------------------------
router.put("/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};

    const doc = await JobPackage.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "not found" });

    if (body.name != null) {
      const name = String(body.name || "").trim();
      if (!name) return res.status(400).json({ success: false, message: "name required" });
      doc.name = name;
    }
    if (body.country != null) doc.country = normCountry(body.country);
    if (body.geoLevel != null) doc.geoLevel = normGeoLevel(body.geoLevel);

    if (body.placements != null) doc.placements = normalizePlacements(body.placements);
    if (body.durationDays != null) doc.durationDays = Number(body.durationDays || 0) || 7;
    if (body.maxJobs != null) doc.maxJobs = Number(body.maxJobs || 0) || 1;
    if (body.price != null) doc.price = Number(body.price || 0) || 0;
    if (body.currency != null) doc.currency = String(body.currency || "EUR").trim().toUpperCase();

    if (body.requiresAdminApproval != null) doc.requiresAdminApproval = Boolean(body.requiresAdminApproval);
    if (body.restrictedBusinessTypes != null) doc.restrictedBusinessTypes = normalizeStringList(body.restrictedBusinessTypes);

    if (body.active != null) doc.active = Boolean(body.active);
    if (body.sortOrder != null) doc.sortOrder = Number(body.sortOrder || 0) || 0;
    if (body.note != null) doc.note = String(body.note || "");

    await doc.save();
    return res.json({ success: true, package: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "update failed", error: err.message });
  }
});

module.exports = router;
