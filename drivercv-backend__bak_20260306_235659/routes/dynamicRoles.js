// PATH: DriverAll-main/drivercv-backend/routes/dynamicRoles.js
// ----------------------------------------------------------
// Dinamik Rol Yönetim API
// - Hiyerarşik rol sistemi
// - CRUD operasyonları
// - Kriter ve yetki yönetimi
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();
const Role = require("../models/Role");
const requireAuth = require("../middleware/auth");

// Middleware: Admin kontrolü
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Yetkisiz erişim" });
  }
  next();
};

// ----------------------------------------------------------
// GET /api/admin/dynamic-roles - Tüm roller (düz liste)
// ----------------------------------------------------------
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    let filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    
    // Tüm rolleri düz liste olarak getir (hiyerarşi olmadan)
    const roles = await Role.find(filter)
      .populate('parentRoleData')
      .sort({ sortOrder: 1, level: 1, name: 1 });
    
    return res.json({
      success: true,
      roles,
      count: roles.length
    });
  } catch (err) {
    console.error("Roller getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Roller yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/dynamic-roles/root - Ana roller
// ----------------------------------------------------------
router.get("/root", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { category } = req.query;
    
    let filter = {};
    if (category) filter.category = category;
    
    const rootRoles = await Role.getRootRoles()
      .populate('childRoles')
      .sort({ sortOrder: 1, name: 1 });
    
    return res.json({
      success: true,
      roles: rootRoles,
      count: rootRoles.length
    });
  } catch (err) {
    console.error("Ana roller getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Ana roller yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/dynamic-roles/:id/children - Alt roller
// ----------------------------------------------------------
router.get("/:id/children", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const childRoles = await Role.getChildRoles(id)
      .populate('childRoles')
      .sort({ sortOrder: 1, name: 1 });
    
    return res.json({
      success: true,
      roles: childRoles,
      count: childRoles.length
    });
  } catch (err) {
    console.error("Alt roller getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alt roller yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/dynamic-roles/:id - Rol detayı
// ----------------------------------------------------------
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findById(id)
      .populate('parentRoleData')
      .populate('childRoles');
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Rol bulunamadı"
      });
    }
    
    return res.json({
      success: true,
      role
    });
  } catch (err) {
    console.error("Rol detayı getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Rol detayı yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/dynamic-roles - Yeni rol oluştur
// ----------------------------------------------------------
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      displayName,
      description,
      parentRole,
      category,
      criteria,
      locationRestrictions,
      permissions,
      profileFields,
      icon,
      color,
      sortOrder
    } = req.body;
    
    // Validasyon
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rol adı zorunludur"
      });
    }
    
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rol görünen adı zorunludur"
      });
    }
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Rol kategorisi zorunludur"
      });
    }
    
    // Parent rol kontrolü
    if (parentRole) {
      const parent = await Role.findById(parentRole);
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: "Ana rol bulunamadı"
        });
      }
    }
    
    // İsim benzersizliği kontrolü
    const existingRole = await Role.findOne({ name: name.trim() });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Bu rol adı zaten kullanımda"
      });
    }
    
    const newRole = new Role({
      name: name.trim(),
      displayName: displayName.trim(),
      description: description?.trim() || "",
      parentRole: parentRole || null,
      category,
      criteria: criteria || [],
      locationRestrictions: locationRestrictions || {
        type: "none",
        allowedCountries: [],
        allowedStates: [],
        allowedDistricts: [],
        customAreas: []
      },
      permissions: permissions || [],
      profileFields: profileFields || [],
      icon: icon || "",
      color: color || "#6366f1",
      sortOrder: sortOrder || 0,
      createdBy: req.user._id
    });
    
    await newRole.save();
    
    // Populate ile geri döndür
    await newRole.populate('parentRoleData');
    
    return res.status(201).json({
      success: true,
      message: "Rol başarıyla oluşturuldu",
      role: newRole
    });
  } catch (err) {
    console.error("Rol oluşturma hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Rol oluşturulamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// PUT /api/admin/dynamic-roles/:id - Rol güncelle
// ----------------------------------------------------------
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      displayName,
      description,
      category,
      criteria,
      locationRestrictions,
      permissions,
      profileFields,
      icon,
      color,
      sortOrder,
      isActive
    } = req.body;
    
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Rol bulunamadı"
      });
    }
    
    // Sistem rolü kontrolü
    if (role.isSystem) {
      const attemptedRestrictedUpdate =
        category !== undefined ||
        criteria !== undefined ||
        locationRestrictions !== undefined ||
        permissions !== undefined ||
        profileFields !== undefined ||
        isActive !== undefined;

      if (attemptedRestrictedUpdate) {
        return res.status(400).json({
          success: false,
          message:
            "Sistem rollerinde sadece görünen ad, açıklama, ikon, renk ve sıralama güncellenebilir"
        });
      }

      if (displayName !== undefined) role.displayName = displayName.trim();
      if (description !== undefined) role.description = description?.trim() || "";
      if (icon !== undefined) role.icon = icon;
      if (color !== undefined) role.color = color;
      if (sortOrder !== undefined) role.sortOrder = sortOrder;

      role.updatedBy = req.user._id;
      await role.save();

      await role.populate('parentRoleData');

      return res.json({
        success: true,
        message: "Rol başarıyla güncellendi",
        role
      });
    }
    
    // Güncelleme
    if (displayName !== undefined) role.displayName = displayName.trim();
    if (description !== undefined) role.description = description?.trim() || "";
    if (category !== undefined) role.category = category;
    if (criteria !== undefined) role.criteria = criteria;
    if (locationRestrictions !== undefined) role.locationRestrictions = locationRestrictions;
    if (permissions !== undefined) role.permissions = permissions;
    if (profileFields !== undefined) role.profileFields = profileFields;
    if (icon !== undefined) role.icon = icon;
    if (color !== undefined) role.color = color;
    if (sortOrder !== undefined) role.sortOrder = sortOrder;
    if (isActive !== undefined) role.isActive = isActive;
    
    role.updatedBy = req.user._id;
    await role.save();
    
    await role.populate('parentRoleData');
    
    return res.json({
      success: true,
      message: "Rol başarıyla güncellendi",
      role
    });
  } catch (err) {
    console.error("Rol güncelleme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Rol güncellenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// DELETE /api/admin/dynamic-roles/:id - Rol sil
// ----------------------------------------------------------
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Rol bulunamadı"
      });
    }
    
    // Sistem rolü kontrolü
    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: "Sistem rolleri silinemez"
      });
    }
    
    // Alt rol kontrolü
    const childRoles = await Role.getChildRoles(id);
    if (childRoles.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Bu role bağlı alt roller var. Önce alt rolleri silin veya başka bir role taşıyın."
      });
    }
    
    await Role.findByIdAndDelete(id);
    
    return res.json({
      success: true,
      message: "Rol başarıyla silindi",
      role
    });
  } catch (err) {
    console.error("Rol silme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Rol silinemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/dynamic-roles/:id/clone - Rol kopyala
// ----------------------------------------------------------
router.post("/:id/clone", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, displayName } = req.body;
    
    const originalRole = await Role.findById(id);
    if (!originalRole) {
      return res.status(404).json({
        success: false,
        message: "Rol bulunamadı"
      });
    }
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Yeni rol adı zorunludur"
      });
    }
    
    // İsim benzersizliği kontrolü
    const existingRole = await Role.findOne({ name: name.trim() });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Bu rol adı zaten kullanımda"
      });
    }
    
    const clonedRole = new Role({
      name: name.trim(),
      displayName: displayName?.trim() || name.trim(),
      description: `${originalRole.description} (Kopya)`,
      parentRole: originalRole.parentRole,
      category: originalRole.category,
      criteria: [...originalRole.criteria],
      locationRestrictions: { ...originalRole.locationRestrictions },
      permissions: [...originalRole.permissions],
      profileFields: [...originalRole.profileFields],
      icon: originalRole.icon,
      color: originalRole.color,
      sortOrder: originalRole.sortOrder,
      createdBy: req.user._id
    });
    
    await clonedRole.save();
    await clonedRole.populate('parentRoleData');
    
    return res.status(201).json({
      success: true,
      message: "Rol başarıyla kopyalandı",
      role: clonedRole
    });
  } catch (err) {
    console.error("Rol kopyalama hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Rol kopyalanamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/dynamic-roles/categories - Kategoriler
// ----------------------------------------------------------
router.get("/categories/list", requireAuth, requireAdmin, async (req, res) => {
  try {
    const categories = await Role.distinct('category');
    
    return res.json({
      success: true,
      categories: categories.sort(),
      count: categories.length
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

module.exports = router;
