// PATH: DriverAll-main/drivercv-backend/routes/adminAdPackages.js
// ----------------------------------------------------------
// Admin Ad Packages API (tolerant + proper validation)
// - GET    /api/admin/ad-packages
// - POST   /api/admin/ad-packages
// - PUT    /api/admin/ad-packages/:id
// - DELETE /api/admin/ad-packages/:id
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const AdPackage = require("../models/AdPackage");
const { requireAuth, requireRoles } = require("../middleware/auth");

// -----------------------------
// helpers
// -----------------------------
function normStr(v, def = "") {
  const s = String(v ?? def).trim();
  return s;
}

function normCountry(v, def = "ALL") {
  return normStr(v, def).toUpperCase();
}

function normNum(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function normalizePlacements(input) {
  if (!Array.isArray(input)) return [];

  return input
    .map((p) => {
      // tolerans: key/placementKey/placement alanlarından birini kabul et
      const key = normStr(p?.key || p?.placementKey || p?.placement || "");
      if (!key) return null;

      return {
        key,
        label: normStr(p?.label || p?.name || ""),
        maxDays: normNum(p?.maxDays ?? p?.days ?? p?.durationDays, 3),
        notes: normStr(p?.notes || ""),
      };
    })
    .filter(Boolean);
}

function isMongooseValidationError(err) {
  return (
    err &&
    (err.name === "ValidationError" ||
      /validation failed/i.test(err.message || ""))
  );
}

// -----------------------------
// LIST
// -----------------------------
router.get("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const country = normCountry(req.query.country || "");
    const q = normStr(req.query.q || "");

    const query = {};
    if (country) query.country = country;
    if (q) query.name = { $regex: q, $options: "i" };

    const packages = await AdPackage.find(query).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, packages });
  } catch (err) {
    console.error("ad packages list failed:", err);
    return res.status(500).json({
      success: false,
      message: "ad packages list failed",
      error: err?.message || String(err),
    });
  }
});

// -----------------------------
// CREATE
// -----------------------------
router.post("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const body = req.body || {};

    // tolerans: name/label/title kabul et
    const name = normStr(body.name || body.label || body.title || "");
    if (!name) {
      return res.status(400).json({ success: false, message: "name required" });
    }

    const placements = normalizePlacements(body.placements);

    // placements zorunlu olsun istiyorsan aç:
    // if (!placements.length) {
    //   return res.status(400).json({ success: false, message: "placements required" });
    // }

    const doc = await AdPackage.create({
      name,
      country: normCountry(body.country || "ALL"),
      geoLevel: normStr(body.geoLevel || "country"),
      placements,
      price: normNum(body.price, 0),
      currency: normStr(body.currency || "TRY").toUpperCase(),
      maxAds: normNum(body.maxAds, 1),
      active: body.active !== false,
      rules: body.rules && typeof body.rules === "object" ? body.rules : {},
    });

    return res.json({ success: true, package: doc });
  } catch (err) {
    console.error("ad package create failed:", err);

    // validation error ise 400 dön (500 değil)
    if (isMongooseValidationError(err)) {
      return res.status(400).json({
        success: false,
        message: "ad package validation failed",
        error: err?.message || String(err),
      });
    }

    return res.status(500).json({
      success: false,
      message: "ad package create failed",
      error: err?.message || String(err),
    });
  }
});

// -----------------------------
// UPDATE
// -----------------------------
router.put("/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};

    const doc = await AdPackage.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "not found" });

    if (body.name != null || body.label != null || body.title != null) {
      const nm = normStr(body.name || body.label || body.title || "");
      if (!nm) return res.status(400).json({ success: false, message: "name required" });
      doc.name = nm;
    }

    if (body.country != null) doc.country = normCountry(body.country, doc.country);
    if (body.geoLevel != null) doc.geoLevel = normStr(body.geoLevel, doc.geoLevel);

    if (body.placements != null) doc.placements = normalizePlacements(body.placements);

    if (body.price != null) doc.price = normNum(body.price, doc.price);
    if (body.currency != null) doc.currency = normStr(body.currency, doc.currency).toUpperCase();
    if (body.maxAds != null) doc.maxAds = normNum(body.maxAds, doc.maxAds);

    if (body.active != null) doc.active = Boolean(body.active);

    if (body.rules != null) {
      doc.rules = body.rules && typeof body.rules === "object" ? body.rules : {};
    }

    await doc.save();
    return res.json({ success: true, package: doc });
  } catch (err) {
    console.error("ad package update failed:", err);

    if (isMongooseValidationError(err)) {
      return res.status(400).json({
        success: false,
        message: "ad package validation failed",
        error: err?.message || String(err),
      });
    }

    return res.status(500).json({
      success: false,
      message: "ad package update failed",
      error: err?.message || String(err),
    });
  }
});

// -----------------------------
// DELETE
// -----------------------------
router.delete("/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    await AdPackage.deleteOne({ _id: id });
    return res.json({ success: true });
  } catch (err) {
    console.error("ad package delete failed:", err);
    return res.status(500).json({
      success: false,
      message: "ad package delete failed",
      error: err?.message || String(err),
    });
  }
});

module.exports = router;
