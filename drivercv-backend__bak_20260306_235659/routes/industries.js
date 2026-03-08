// PATH: DriverAll-main/drivercv-backend/routes/industries.js
// ----------------------------------------------------------
// Sektör Yönetim API
// - CRUD operasyonları
// - Sektöre özel alanlar
// - Şube yapısı yönetimi
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();
const Industry = require("../models/Industry");
const requireAuth = require("../middleware/auth");

// Middleware: Admin kontrolü
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Yetkisiz erişim" });
  }
  next();
};

// ----------------------------------------------------------
// GET /api/admin/industries - Tüm sektörler
// ----------------------------------------------------------
router.get("/", requireAuth, async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    let filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    
    const industries = await Industry.find(filter)
      .sort({ category: 1, name: 1 });
    
    return res.json({
      success: true,
      industries,
      count: industries.length
    });
  } catch (err) {
    console.error("Sektörler getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Sektörler yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/industries/active - Aktif sektörler
// ----------------------------------------------------------
router.get("/active", requireAuth, async (req, res) => {
  try {
    const industries = await Industry.getActiveIndustries();
    
    return res.json({
      success: true,
      industries,
      count: industries.length
    });
  } catch (err) {
    console.error("Aktif sektörler getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Sektörler yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/industries/:id - Sektör detayı
// ----------------------------------------------------------
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const industry = await Industry.findById(id);
    if (!industry) {
      return res.status(404).json({
        success: false,
        message: "Sektör bulunamadı"
      });
    }
    
    return res.json({
      success: true,
      industry
    });
  } catch (err) {
    console.error("Sektör detayı getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Sektör detayı yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/industries - Yeni sektör oluştur
// ----------------------------------------------------------
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      displayName,
      description,
      code,
      category,
      icon,
      color,
      customFields,
      branchStructure,
      requirements,
      services,
      isActive
    } = req.body;
    
    // Validasyon
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Sektör adı zorunludur"
      });
    }
    
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Sektör görünen adı zorunludur"
      });
    }
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Kategori zorunludur"
      });
    }
    
    // İsim benzersizliği kontrolü
    const existingIndustry = await Industry.findOne({ 
      $or: [
        { name: name.trim() },
        { code: code?.trim() }
      ]
    });
    
    if (existingIndustry) {
      return res.status(400).json({
        success: false,
        message: "Bu sektör adı veya kodu zaten kullanımda"
      });
    }
    
    const newIndustry = new Industry({
      name: name.trim(),
      displayName: displayName.trim(),
      description: description?.trim() || "",
      code: code?.trim() || name.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''),
      category,
      icon: icon || "",
      color: color || "#6366f1",
      customFields: customFields || [],
      branchStructure: branchStructure || {
        allowsMultipleBranches: true,
        requiresMainBranch: true,
        branchTypes: []
      },
      requirements: requirements || {
        licenses: [],
        certifications: [],
        permits: []
      },
      services: services || [],
      isActive: isActive !== false,
      metadata: {
        createdBy: req.user._id
      }
    });
    
    await newIndustry.save();
    
    return res.status(201).json({
      success: true,
      message: "Sektör başarıyla oluşturuldu",
      industry: newIndustry
    });
  } catch (err) {
    console.error("Sektör oluşturma hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Sektör oluşturulamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// PUT /api/admin/industries/:id - Sektör güncelle
// ----------------------------------------------------------
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      displayName,
      description,
      icon,
      color,
      customFields,
      branchStructure,
      requirements,
      services,
      isActive
    } = req.body;
    
    const industry = await Industry.findById(id);
    if (!industry) {
      return res.status(404).json({
        success: false,
        message: "Sektör bulunamadı"
      });
    }
    
    // Sistem sektörü kontrolü
    if (industry.isSystem) {
      return res.status(400).json({
        success: false,
        message: "Sistem sektörleri güncellenemez"
      });
    }
    
    // Güncelleme
    if (displayName !== undefined) industry.displayName = displayName.trim();
    if (description !== undefined) industry.description = description?.trim() || "";
    if (icon !== undefined) industry.icon = icon;
    if (color !== undefined) industry.color = color;
    if (customFields !== undefined) industry.customFields = customFields;
    if (branchStructure !== undefined) industry.branchStructure = branchStructure;
    if (requirements !== undefined) industry.requirements = requirements;
    if (services !== undefined) industry.services = services;
    if (isActive !== undefined) industry.isActive = isActive;
    
    industry.metadata.updatedBy = req.user._id;
    await industry.save();
    
    return res.json({
      success: true,
      message: "Sektör başarıyla güncellendi",
      industry
    });
  } catch (err) {
    console.error("Sektör güncelleme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Sektör güncellenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// DELETE /api/admin/industries/:id - Sektör sil
// ----------------------------------------------------------
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const industry = await Industry.findById(id);
    if (!industry) {
      return res.status(404).json({
        success: false,
        message: "Sektör bulunamadı"
      });
    }
    
    // Sistem sektörü kontrolü
    if (industry.isSystem) {
      return res.status(400).json({
        success: false,
        message: "Sistem sektörleri silinemez"
      });
    }
    
    // İlişkili şirket kontrolü
    if (industry.stats.companyCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Bu sektörü kullanan şirketler var. Önce şirketleri silin veya başka sektöre taşıyın."
      });
    }
    
    await Industry.findByIdAndDelete(id);
    
    return res.json({
      success: true,
      message: "Sektör başarıyla silindi",
      industry
    });
  } catch (err) {
    console.error("Sektör silme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Sektör silinemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/industries/:id/stats - İstatistikleri güncelle
// ----------------------------------------------------------
router.post("/:id/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const industry = await Industry.findById(id);
    if (!industry) {
      return res.status(404).json({
        success: false,
        message: "Sektör bulunamadı"
      });
    }
    
    await industry.updateStats();
    
    return res.json({
      success: true,
      message: "İstatistikler güncellendi",
      stats: industry.stats
    });
  } catch (err) {
    console.error("İstatistik güncelleme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "İstatistikler güncellenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/industries/categories - Kategoriler
// ----------------------------------------------------------
router.get("/categories/list", requireAuth, requireAdmin, async (req, res) => {
  try {
    const categories = await Industry.distinct('category', { isActive: true });
    
    const categoryLabels = {
      transport: "Taşımacılık",
      manufacturing: "İmalat",
      storage: "Depolama",
      education: "Eğitim",
      service: "Hizmet",
      technology: "Teknoloji",
      other: "Diğer"
    };
    
    const result = categories.map(cat => ({
      value: cat,
      label: categoryLabels[cat] || cat
    }));
    
    return res.json({
      success: true,
      categories: result,
      count: result.length
    });
  } catch (err) {
    console.error("Kategoriler getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Kategoriler yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/industries/search/:query - Sektör ara
// ----------------------------------------------------------
router.get("/search/:query", requireAuth, async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        industries: [],
        count: 0
      });
    }
    
    const industries = await Industry.searchIndustries(query);
    
    return res.json({
      success: true,
      industries,
      count: industries.length
    });
  } catch (err) {
    console.error("Sektör arama hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Sektör arama yapılamadı",
      error: err?.message || String(err)
    });
  }
});

module.exports = router;
