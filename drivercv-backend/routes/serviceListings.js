// PATH: drivercv-backend/routes/serviceListings.js
// ----------------------------------------------------------
// Hizmet Veren (Service Provider) — Hizmet İlanı API
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();
const ServiceListing = require("../models/ServiceListing");
const { requireAuth } = require("../middleware/auth");

// ===== Yardımcı =====
function ensureServiceProvider(req, res, next) {
  const role = req.user?.role || req.user?.dynamicRoleName || "";
  if (role === "service_provider" || role === "admin") return next();
  return res.status(403).json({ success: false, message: "Bu alan yalnızca hizmet verenler içindir." });
}

// ===== GET /api/service-listings/mine — Kendi hizmetlerim =====
router.get("/mine", requireAuth, ensureServiceProvider, async (req, res) => {
  try {
    const list = await ServiceListing.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===== GET /api/service-listings/:id — Tek hizmet detay =====
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const doc = await ServiceListing.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, message: "Hizmet bulunamadı." });
    res.json({ success: true, item: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===== POST /api/service-listings — Yeni hizmet oluştur =====
router.post("/", requireAuth, ensureServiceProvider, async (req, res) => {
  try {
    const body = req.body || {};
    const doc = new ServiceListing({
      userId: req.user._id,
      title: body.title || "",
      description: body.description || "",
      category: body.category || "diger",
      relatedCriteriaKeys: body.relatedCriteriaKeys || [],
      deliveryMethods: body.deliveryMethods || [],
      price: body.price || {},
      duration: body.duration || {},
      location: body.location || {},
      contact: body.contact || {},
      status: body.status || "draft",
      tags: body.tags || [],
      maxCapacity: body.maxCapacity || null,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
    });
    await doc.save();
    res.status(201).json({ success: true, item: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===== PUT /api/service-listings/:id — Hizmet güncelle =====
router.put("/:id", requireAuth, ensureServiceProvider, async (req, res) => {
  try {
    const doc = await ServiceListing.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: "Hizmet bulunamadı veya yetkiniz yok." });

    const body = req.body || {};
    const allowed = [
      "title", "description", "category", "relatedCriteriaKeys",
      "deliveryMethods", "price", "duration", "location", "contact",
      "status", "tags", "maxCapacity", "startDate", "endDate",
    ];
    for (const k of allowed) {
      if (body[k] !== undefined) doc[k] = body[k];
    }
    await doc.save();
    res.json({ success: true, item: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===== DELETE /api/service-listings/:id — Hizmet sil =====
router.delete("/:id", requireAuth, ensureServiceProvider, async (req, res) => {
  try {
    const doc = await ServiceListing.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: "Hizmet bulunamadı veya yetkiniz yok." });
    res.json({ success: true, message: "Hizmet silindi." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===== GET /api/service-listings/public/search — Herkese açık arama (adaylar için) =====
router.get("/public/search", async (req, res) => {
  try {
    const { category, stateCode, q } = req.query;
    const filter = { status: "active" };
    if (category) filter.category = category;
    if (stateCode) filter["location.stateCode"] = stateCode;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ];
    }
    const list = await ServiceListing.find(filter)
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
