// PATH: DriverAll-main/drivercv-backend/routes/dynamicProfiles.js
// ----------------------------------------------------------
// Dinamik Profil Yönetim API
// - Role-based profil alanları
// - Dinamik kriterler
// - Lokasyon bazlı veriler
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();
const DynamicProfile = require("../models/DynamicProfile");
const Role = require("../models/Role");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");

// Middleware: Admin kontrolü
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Yetkisiz erişim" });
  }
  next();
};

// ----------------------------------------------------------
// GET /api/profile/dynamic - Mevcut kullanıcı profili
// ----------------------------------------------------------
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    
    let profile = await DynamicProfile.findOne({ user: userId })
      .populate('role')
      .populate('userData');
    
    // Profil yoksa oluştur
    if (!profile) {
      const user = await User.findById(userId);
      const defaultRole = await Role.findOne({ name: user.role });
      
      if (!defaultRole) {
        return res.status(400).json({
          success: false,
          message: "Kullanıcı rolü bulunamadı"
        });
      }
      
      profile = new DynamicProfile({
        user: userId,
        role: defaultRole._id,
        basicInfo: {
          fullName: user.name || "",
          email: user.email || ""
        }
      });
      
      await profile.save();
      await profile.populate('role');
    }
    
    return res.json({
      success: true,
      profile
    });
  } catch (err) {
    console.error("Profil getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Profil yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// PUT /api/profile/dynamic - Profil güncelle
// ----------------------------------------------------------
router.put("/", requireAuth, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const {
      basicInfo,
      location,
      dynamicFields,
      criteriaValues,
      businessInfo,
      branches,
      permissions,
      settings
    } = req.body;
    
    let profile = await DynamicProfile.findOne({ user: userId })
      .populate('role');
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profil bulunamadı"
      });
    }
    
    // Güncelleme
    if (basicInfo) {
      Object.assign(profile.basicInfo, basicInfo);
    }
    
    if (location) {
      Object.assign(profile.location, location);
    }
    
    if (dynamicFields && Array.isArray(dynamicFields)) {
      dynamicFields.forEach(field => {
        profile.setFieldValue(field.key, field.value, field.type);
      });
    }
    
    if (criteriaValues) {
      Object.assign(profile.criteriaValues, criteriaValues);
    }
    
    if (businessInfo) {
      Object.assign(profile.businessInfo, businessInfo);
    }
    
    if (branches && Array.isArray(branches)) {
      profile.branches = branches;
    }
    
    if (permissions && Array.isArray(permissions)) {
      profile.permissions = permissions;
    }
    
    if (settings) {
      Object.assign(profile.settings, settings);
    }
    
    // Validasyon
    await profile.validateAllFields(profile.roleData);
    
    profile.metadata.lastUpdatedBy = userId;
    await profile.save();
    
    return res.json({
      success: true,
      message: "Profil başarıyla güncellendi",
      profile
    });
  } catch (err) {
    console.error("Profil güncelleme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Profil güncellenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/profile/dynamic/fields - Alan ekle
// ----------------------------------------------------------
router.post("/fields", requireAuth, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { key, value, type } = req.body;
    
    if (!key || !type) {
      return res.status(400).json({
        success: false,
        message: "Alan anahtarı ve tipi zorunludur"
      });
    }
    
    const profile = await DynamicProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profil bulunamadı"
      });
    }
    
    profile.setFieldValue(key, value, type);
    await profile.save();
    
    return res.json({
      success: true,
      message: "Alan başarıyla eklendi",
      field: profile.dynamicFields.find(f => f.key === key)
    });
  } catch (err) {
    console.error("Alan ekleme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alan eklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// PUT /api/profile/dynamic/fields/:key - Alan güncelle
// ----------------------------------------------------------
router.put("/fields/:key", requireAuth, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { key } = req.params;
    const { value, type } = req.body;
    
    const profile = await DynamicProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profil bulunamadı"
      });
    }
    
    profile.setFieldValue(key, value, type);
    await profile.save();
    
    return res.json({
      success: true,
      message: "Alan başarıyla güncellendi",
      field: profile.dynamicFields.find(f => f.key === key)
    });
  } catch (err) {
    console.error("Alan güncelleme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alan güncellenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// DELETE /api/profile/dynamic/fields/:key - Alan sil
// ----------------------------------------------------------
router.delete("/fields/:key", requireAuth, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { key } = req.params;
    
    const profile = await DynamicProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profil bulunamadı"
      });
    }
    
    profile.dynamicFields = profile.dynamicFields.filter(f => f.key !== key);
    await profile.save();
    
    return res.json({
      success: true,
      message: "Alan başarıyla silindi"
    });
  } catch (err) {
    console.error("Alan silme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alan silinemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/profile/dynamic/validate - Profil validasyonu
// ----------------------------------------------------------
router.post("/validate", requireAuth, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    
    const profile = await DynamicProfile.findOne({ user: userId })
      .populate('role');
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profil bulunamadı"
      });
    }
    
    const isValid = profile.validateAllFields(profile.roleData);
    
    return res.json({
      success: true,
      isValid,
      completionPercentage: profile.completionPercentage,
      completedFields: profile.stats.completedFields,
      totalFields: profile.stats.totalFields,
      validationErrors: profile.status.validationErrors
    });
  } catch (err) {
    console.error("Validasyon hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Validasyon yapılamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/dynamic-profiles - Tüm profiller (Admin)
// ----------------------------------------------------------
router.get("/admin/list", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { role, category, isComplete, isVerified, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    
    if (role) {
      const roleDoc = await Role.findOne({ name: role });
      if (roleDoc) filter.role = roleDoc._id;
    }
    
    if (category) {
      const roles = await Role.find({ category });
      filter.role = { $in: roles.map(r => r._id) };
    }
    
    if (isComplete !== undefined) {
      filter["status.isProfileComplete"] = isComplete === "true";
    }
    
    if (isVerified !== undefined) {
      filter["status.isVerified"] = isVerified === "true";
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const rawProfiles = await DynamicProfile.find(filter)
      .populate('role')
      .populate('user', 'name email role')
      .sort({ "stats.lastProfileUpdate": -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // role veya user silinmişse (null) filtrele — DB tutarsızlığı koruması
    const profiles = rawProfiles.filter(p => p.role && p.user);

    const total = await DynamicProfile.countDocuments(filter);
    
    return res.json({
      success: true,
      profiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Profiller getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Profiller yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/dynamic-profiles/:id - Profil detayı (Admin)
// ----------------------------------------------------------
router.get("/admin/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const profile = await DynamicProfile.findById(id)
      .populate('role')
      .populate('userData')
      .populate('metadata.lastUpdatedBy');
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profil bulunamadı"
      });
    }
    
    return res.json({
      success: true,
      profile
    });
  } catch (err) {
    console.error("Profil detayı getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Profil detayı yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/profile/dynamic/by-role/:roleId - Role göre profiller
// ----------------------------------------------------------
router.get("/by-role/:roleId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { roleId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const profiles = await DynamicProfile.find({ role: roleId })
      .populate('role')
      .populate('userData')
      .sort({ "stats.lastProfileUpdate": -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await DynamicProfile.countDocuments({ role: roleId });
    
    return res.json({
      success: true,
      profiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Role göre profiller getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Profiller yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/profile/dynamic/location/:stateCode/:districtCode - Lokasyon göre profiller
// ----------------------------------------------------------
router.get("/location/:stateCode/:districtCode?", requireAuth, async (req, res) => {
  try {
    const { stateCode, districtCode } = req.params;
    const { role, page = 1, limit = 20 } = req.query;
    
    let filter = {
      "location.stateCode": stateCode
    };
    
    if (districtCode) {
      filter["location.districtCode"] = districtCode;
    }
    
    if (role) {
      const roleDoc = await Role.findOne({ name: role });
      if (roleDoc) filter.role = roleDoc._id;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const profiles = await DynamicProfile.find(filter)
      .populate('role')
      .populate('userData')
      .sort({ "stats.lastProfileUpdate": -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await DynamicProfile.countDocuments(filter);
    
    return res.json({
      success: true,
      profiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Lokasyon göre profiller getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Profiller yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

module.exports = router;
