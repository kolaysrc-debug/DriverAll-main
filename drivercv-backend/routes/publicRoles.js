// PATH: DriverAll-main/drivercv-backend/routes/publicRoles.js
// ----------------------------------------------------------
// Public Roles Config
// - Candidate alt rollerini (subRoles) public olarak verir
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const Role = require("../models/Role");

// Fallback — DB'de Role koleksiyonu boşsa veya henüz seed edilmemişse kullanılır
const FALLBACK_CANDIDATE_SUB_ROLES = [
  { key: "driver",   label: "Sürücü",                description: "Ağır vasıta veya binek araç sürücüsü", level: 1, parentRole: null },
  { key: "operator", label: "İş Makinesi Operatörü", description: "Forklift, Ekskavatör vb. operatörü",   level: 1, parentRole: null },
  { key: "courier",  label: "Kurye",                 description: "Motorlu veya arabalı kurye",            level: 1, parentRole: null },
  { key: "valet",    label: "Vale",                   description: "Otopark ve vale hizmetleri",            level: 1, parentRole: null },
];

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

    let items = (roles || []).map((r) => ({
      key: String(r.name || "").trim(),
      label: String(r.displayName || r.name || "").trim(),
      description: String(r.description || "").trim(),
      level: typeof r.level === "number" ? r.level : 1,
      parentRole: r.parentRole ? String(r.parentRole) : null,
    }));

    // DB boşsa fallback kullan
    if (items.length === 0) {
      items = FALLBACK_CANDIDATE_SUB_ROLES;
    }

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

// ----------------------------------------------------------
// GET /api/public/roles/subroles?category=employer|candidate|...
// Genel alt rol endpoint'i — tüm kategoriler için çalışır
// ----------------------------------------------------------
router.get("/subroles", async (req, res) => {
  try {
    const category = String(req.query.category || "").trim().toLowerCase();
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "category query parametresi zorunludur (candidate, employer, advertiser, service_provider, admin)",
      });
    }

    const validCategories = ["candidate", "employer", "advertiser", "service_provider", "admin"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Geçersiz kategori: ${category}. Geçerli: ${validCategories.join(", ")}`,
      });
    }

    const roles = await Role.find({
      category,
      level: { $gt: 0 },
      isActive: true,
    })
      .sort({ sortOrder: 1, level: 1, name: 1 })
      .lean();

    let items = (roles || []).map((r) => ({
      key: String(r.name || "").trim(),
      label: String(r.displayName || r.name || "").trim(),
      description: String(r.description || "").trim(),
      level: typeof r.level === "number" ? r.level : 1,
      parentRole: r.parentRole ? String(r.parentRole) : null,
    }));

    // candidate kategorisi için DB boşsa fallback
    if (items.length === 0 && category === "candidate") {
      items = FALLBACK_CANDIDATE_SUB_ROLES;
    }

    return res.json({
      success: true,
      category,
      subRoles: items,
      count: items.length,
    });
  } catch (err) {
    console.error("GET /api/public/roles/subroles error:", err);
    return res.status(500).json({
      success: false,
      message: "Sub-roles yüklenemedi",
      error: err?.message || String(err),
    });
  }
});

module.exports = router;
