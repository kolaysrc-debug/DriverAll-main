// PATH: drivercv-backend/routes/adminServiceCategories.js
// ----------------------------------------------------------
// Admin Service Categories CRUD
// Base: /api/admin/service-categories
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const ServiceCategory = require("../models/ServiceCategory");
const { requireAuth, requireRoles } = require("../middleware/auth");

// LIST
router.get("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const q = {};
    if (req.query.active === "1") q.active = true;
    if (req.query.active === "0") q.active = false;
    const items = await ServiceCategory.find(q).sort({ sortOrder: 1, label: 1 }).lean();
    res.json({ success: true, categories: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE
router.post("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const b = req.body || {};
    const key = String(b.key || "").trim().toLowerCase().replace(/\s+/g, "_");
    if (!key) return res.status(400).json({ success: false, message: "key required" });
    if (!b.label) return res.status(400).json({ success: false, message: "label required" });

    const doc = await ServiceCategory.create({
      key,
      label: String(b.label).trim(),
      description: String(b.description || "").trim(),
      icon: String(b.icon || "").trim(),
      relatedCriteriaKeys: Array.isArray(b.relatedCriteriaKeys) ? b.relatedCriteriaKeys : [],
      relatedGroupKeys: Array.isArray(b.relatedGroupKeys) ? b.relatedGroupKeys : [],
      sortOrder: Number(b.sortOrder) || 0,
      active: b.active !== false,
      country: String(b.country || "ALL").trim().toUpperCase(),
    });
    res.status(201).json({ success: true, category: doc });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: "Bu key zaten mevcut." });
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE
router.put("/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const doc = await ServiceCategory.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Bulunamadı" });

    const b = req.body || {};
    const allowed = ["label", "description", "icon", "relatedCriteriaKeys", "relatedGroupKeys", "sortOrder", "active", "country"];
    for (const k of allowed) {
      if (b[k] !== undefined) doc[k] = b[k];
    }
    if (b.key) doc.key = String(b.key).trim().toLowerCase().replace(/\s+/g, "_");
    await doc.save();
    res.json({ success: true, category: doc });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: "Bu key zaten mevcut." });
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE
router.delete("/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const doc = await ServiceCategory.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Bulunamadı" });
    res.json({ success: true, message: "Silindi" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
