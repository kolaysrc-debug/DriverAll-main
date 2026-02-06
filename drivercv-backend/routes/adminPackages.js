// PATH: DriverAll-main/drivercv-backend/routes/adminPackages.js
// ----------------------------------------------------------
// Admin Packages CRUD
// Base: /api/admin/packages
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const Package = require("../models/Package");
const { requireAuth, requireRoles } = require("../middleware/auth");

function normUpper(v, fallback = "ALL") {
  const s = String(v || "").trim();
  return (s || fallback).toUpperCase();
}

function normCode(v) {
  return String(v || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

// LIST
router.get("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const active = req.query.active;
    const type = String(req.query.type || "").toUpperCase();
    const country = String(req.query.country || "").toUpperCase();

    const q = { deletedAt: null };
    if (active === "1") q.active = true;
    if (active === "0") q.active = false;
    if (type) q.type = type;
    if (country) q.country = country;

    const items = await Package.find(q).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, packages: items });
  } catch (err) {
    res.status(500).json({ success: false, message: "list packages failed", error: err.message });
  }
});

// CREATE
router.post("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const b = req.body || {};

    const type = normUpper(b.type, "JOB");
    const name = String(b.name || "").trim();
    const code = normCode(b.code);

    if (!name) return res.status(400).json({ success: false, message: "name required" });
    if (!code) return res.status(400).json({ success: false, message: "code required" });

    const doc = await Package.create({
      type,
      name,
      code,
      description: String(b.description || ""),
      country: normUpper(b.country, "ALL"),
      currency: String(b.currency || "TRY").toUpperCase(),
      price: Number(b.price || 0),

      credits: {
        jobCount: Number(b?.credits?.jobCount || 0),
        adCount: Number(b?.credits?.adCount || 0),
      },

      rules: {
        allowedPlacements: Array.isArray(b?.rules?.allowedPlacements) ? b.rules.allowedPlacements : [],
        maxDurationDaysByPlacement: b?.rules?.maxDurationDaysByPlacement || {},
        requiresApproval: b?.rules?.requiresApproval !== false,
      },

      active: b.active !== false,
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null,
    });

    res.json({ success: true, package: doc });
  } catch (err) {
    const dup = String(err?.message || "").includes("duplicate key");
    res
      .status(dup ? 409 : 500)
      .json({ success: false, message: dup ? "code must be unique" : "create package failed", error: err.message });
  }
});

// UPDATE
router.put("/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body || {};

    const p = await Package.findById(id);
    if (!p || p.deletedAt) return res.status(404).json({ success: false, message: "not found" });

    if (b.type != null) p.type = normUpper(b.type, p.type);
    if (b.name != null) p.name = String(b.name || "").trim();
    if (b.code != null) p.code = normCode(b.code || p.code);
    if (b.description != null) p.description = String(b.description || "");
    if (b.country != null) p.country = normUpper(b.country, p.country);
    if (b.currency != null) p.currency = String(b.currency || "TRY").toUpperCase();
    if (b.price != null) p.price = Number(b.price || 0);

    if (b.credits) {
      p.credits.jobCount = Number(b?.credits?.jobCount ?? p.credits.jobCount);
      p.credits.adCount = Number(b?.credits?.adCount ?? p.credits.adCount);
    }

    if (b.rules) {
      if (Array.isArray(b?.rules?.allowedPlacements)) p.rules.allowedPlacements = b.rules.allowedPlacements;
      if (b?.rules?.maxDurationDaysByPlacement != null) p.rules.maxDurationDaysByPlacement = b.rules.maxDurationDaysByPlacement;
      if (b?.rules?.requiresApproval != null) p.rules.requiresApproval = b.rules.requiresApproval !== false;
    }

    if (b.active != null) p.active = Boolean(b.active);

    p.updatedBy = req.user?._id || null;
    await p.save();

    res.json({ success: true, package: p.toObject() });
  } catch (err) {
    const dup = String(err?.message || "").includes("duplicate key");
    res
      .status(dup ? 409 : 500)
      .json({ success: false, message: dup ? "code must be unique" : "update package failed", error: err.message });
  }
});

// SOFT DELETE (pasife al + deletedAt)
router.delete("/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const p = await Package.findById(id);
    if (!p || p.deletedAt) return res.status(404).json({ success: false, message: "not found" });

    p.active = false;
    p.deletedAt = new Date();
    p.updatedBy = req.user?._id || null;
    await p.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "delete package failed", error: err.message });
  }
});

module.exports = router;
