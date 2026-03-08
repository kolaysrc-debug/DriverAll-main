// PATH: DriverAll-main/drivercv-backend/routes/branches.js
// ----------------------------------------------------------
// Şube Yönetim API
// - CRUD operasyonları
// - Lokasyon yönetimi
// - İletişim bilgileri
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();
const Branch = require("../models/Branch");
const requireAuth = require("../middleware/auth");

// Middleware: Admin kontrolü
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Yetkisiz erişim" });
  }
  next();
};

// ----------------------------------------------------------
// GET /api/admin/branches - Tüm şubeler
// ----------------------------------------------------------
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { parentUser, stateCode, status, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (parentUser) filter.parentUser = parentUser;
    if (stateCode) filter["location.stateCode"] = stateCode;
    if (status === "active") {
      filter["status.isActive"] = true;
      filter["status.isApproved"] = true;
    } else if (status === "pending") {
      filter["status.isApproved"] = false;
    } else if (status === "inactive") {
      filter["status.isActive"] = false;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const branches = await Branch.find(filter)
      .populate('parentUser')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Branch.countDocuments(filter);
    
    return res.json({
      success: true,
      branches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Şubeler getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Şubeler yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/branches/:id - Şube detayı
// ----------------------------------------------------------
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const branch = await Branch.findById(id)
      .populate('parentUser')
      .populate('subUsers');
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Şube bulunamadı"
      });
    }
    
    return res.json({
      success: true,
      branch
    });
  } catch (err) {
    console.error("Şube detayı getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Şube detayı yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/branches - Yeni şube oluştur
// ----------------------------------------------------------
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      parentUser,
      name,
      displayName,
      description,
      location,
      contact,
      manager,
      workingHours,
      services,
      metadata
    } = req.body;
    
    // Validasyon
    if (!parentUser) {
      return res.status(400).json({
        success: false,
        message: "Ana kullanıcı zorunludur"
      });
    }
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Şube adı zorunludur"
      });
    }
    
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Görünen ad zorunludur"
      });
    }
    
    if (!location) {
      return res.status(400).json({
        success: false,
        message: "Lokasyon bilgileri zorunludur"
      });
    }
    
    if (!location.stateCode || !location.stateName) {
      return res.status(400).json({
        success: false,
        message: "İl bilgileri zorunludur"
      });
    }
    
    if (!location.districtCode || !location.districtName) {
      return res.status(400).json({
        success: false,
        message: "İlçe bilgileri zorunludur"
      });
    }
    
    if (!contact || !contact.phone) {
      return res.status(400).json({
        success: false,
        message: "İletişim telefonu zorunludur"
      });
    }
    
    // İsim benzersizliği kontrolü (aynı kullanıcı için)
    const existingBranch = await Branch.findOne({ 
      parentUser,
      name: name.trim()
    });
    
    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: "Bu kullanıcıda aynı isimde şube zaten var"
      });
    }
    
    const newBranch = new Branch({
      parentUser,
      name: name.trim(),
      displayName: displayName.trim(),
      description: description?.trim() || "",
      location,
      contact,
      manager: manager || {},
      workingHours: workingHours || {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "09:00", close: "18:00", closed: true },
        sunday: { open: "09:00", close: "18:00", closed: true }
      },
      services: services || [],
      metadata: {
        ...metadata,
        createdBy: req.user._id
      }
    });
    
    await newBranch.save();
    
    return res.status(201).json({
      success: true,
      message: "Şube başarıyla oluşturuldu",
      branch: newBranch
    });
  } catch (err) {
    console.error("Şube oluşturma hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Şube oluşturulamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// PUT /api/admin/branches/:id - Şube güncelle
// ----------------------------------------------------------
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      displayName,
      description,
      location,
      contact,
      manager,
      workingHours,
      services,
      metadata
    } = req.body;
    
    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Şube bulunamadı"
      });
    }
    
    // Güncelleme
    if (name !== undefined) branch.name = name.trim();
    if (displayName !== undefined) branch.displayName = displayName.trim();
    if (description !== undefined) branch.description = description?.trim() || "";
    if (location !== undefined) branch.location = location;
    if (contact !== undefined) branch.contact = contact;
    if (manager !== undefined) branch.manager = manager;
    if (workingHours !== undefined) branch.workingHours = workingHours;
    if (services !== undefined) branch.services = services;
    if (metadata !== undefined) branch.metadata = { ...branch.metadata, ...metadata };
    
    branch.metadata.updatedBy = req.user._id;
    
    await branch.save();
    
    return res.json({
      success: true,
      message: "Şube başarıyla güncellendi",
      branch
    });
  } catch (err) {
    console.error("Şube güncelleme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Şube güncellenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// DELETE /api/admin/branches/:id - Şube sil
// ----------------------------------------------------------
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Şube bulunamadı"
      });
    }
    
    // Ana şube kontrolü
    if (branch.status.isMainBranch) {
      return res.status(400).json({
        success: false,
        message: "Ana şube silinemez. Önce başka bir şubeyi ana şube yapın."
      });
    }
    
    // İlişkili alt kullanıcı kontrolü
    if (branch.stats.subUserCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Bu şubeye atanmış kullanıcılar var. Önce kullanıcıları başka şubeye taşıyın."
      });
    }
    
    await Branch.findByIdAndDelete(id);
    
    return res.json({
      success: true,
      message: "Şube başarıyla silindi",
      branch
    });
  } catch (err) {
    console.error("Şube silme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Şube silinemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/branches/:id/set-main - Ana şube yap
// ----------------------------------------------------------
router.post("/:id/set-main", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Şube bulunamadı"
      });
    }
    
    await branch.setAsMainBranch();
    
    return res.json({
      success: true,
      message: "Şube ana şube olarak ayarlandı",
      branch
    });
  } catch (err) {
    console.error("Ana şube ayarlama hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Ana şube ayarlanamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/branches/:id/update-stats - İstatistikleri güncelle
// ----------------------------------------------------------
router.post("/:id/update-stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Şube bulunamadı"
      });
    }
    
    await branch.updateStats();
    
    return res.json({
      success: true,
      message: "İstatistikler güncellendi",
      stats: branch.stats
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
// GET /api/admin/branches/location/:stateCode - Lokasyona göre şubeler
// ----------------------------------------------------------
router.get("/location/:stateCode", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { stateCode } = req.params;
    const { districtCode } = req.query;
    
    const branches = await Branch.findByLocation(stateCode, districtCode);
    
    return res.json({
      success: true,
      branches,
      count: branches.length
    });
  } catch (err) {
    console.error("Lokasyona göre şubeler getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Şubeler yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/branches/parent/:parentId - Ana kullanıcıya göre şubeler
// ----------------------------------------------------------
router.get("/parent/:parentId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { parentId } = req.params;
    
    const branches = await Branch.findByParentUser(parentId);
    
    return res.json({
      success: true,
      branches,
      count: branches.length
    });
  } catch (err) {
    console.error("Ana kullanıcıya göre şubeler getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Şubeler yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/branches/pending - Bekleyen onaylar
// ----------------------------------------------------------
router.get("/pending/list", requireAuth, requireAdmin, async (req, res) => {
  try {
    const branches = await Branch.findPendingApproval();
    
    return res.json({
      success: true,
      branches,
      count: branches.length
    });
  } catch (err) {
    console.error("Bekleyen şube onayları getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Bekleyen onaylar yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/branches/active - Aktif şubeler
// ----------------------------------------------------------
router.get("/active/list", requireAuth, requireAdmin, async (req, res) => {
  try {
    const branches = await Branch.findActiveBranches();
    
    return res.json({
      success: true,
      branches,
      count: branches.length
    });
  } catch (err) {
    console.error("Aktif şubeler getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Aktif şubeler yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

module.exports = router;
