// PATH: DriverAll-main/drivercv-backend/routes/dynamicFields.js
// ----------------------------------------------------------
// Dinamik Profil Alanları API
// - CRUD operasyonları
// - Role göre görünürlük
// - Validasyon yönetimi
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();
const DynamicField = require("../models/DynamicField");
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
// POST /api/admin/dynamic-fields/:id/publish - Alanı yayınla
// ----------------------------------------------------------
router.post("/:id/publish", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const field = await DynamicField.findById(id);
    if (!field) {
      return res.status(404).json({ success: false, message: "Alan bulunamadı" });
    }
    if (field.isSystem) {
      return res.status(400).json({ success: false, message: "Sistem alanları yayınlanamaz" });
    }

    field.status = "published";
    field.publishedAt = new Date();
    field.publishedBy = req.user._id;
    field.metadata.updatedBy = req.user._id;
    await field.save();
    await field.populate("roleVisibility.role");

    return res.json({ success: true, message: "Alan yayınlandı", field });
  } catch (err) {
    console.error("Alan publish hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alan yayınlanamadı",
      error: err?.message || String(err),
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/dynamic-fields - Tüm alanlar
// ----------------------------------------------------------
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { category, section, isActive, status } = req.query;
    
    let filter = {};
    if (category) filter.category = category;
    if (section) filter.section = section;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (status && status !== "all") {
      filter.status = String(status);
    } else if (!status) {
      filter.status = "published";
    }
    
    const fields = await DynamicField.find(filter)
      .populate('roleVisibility.role')
      .sort({ category: 1, section: 1, order: 1 });
    
    return res.json({
      success: true,
      fields,
      count: fields.length
    });
  } catch (err) {
    console.error("Alanlar getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alanlar yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/dynamic-fields/role/:roleId - Role göre alanlar
// ----------------------------------------------------------
router.get("/role/:roleId", requireAuth, async (req, res) => {
  try {
    const { roleId } = req.params;
    
    // Kullanıcının rolünü kontrol et
    if (req.user?.role !== "admin" && req.userId !== roleId) {
      return res.status(403).json({ message: "Yetkisiz erişim" });
    }
    
    const fields = await DynamicField.findByRole(roleId);
    
    return res.json({
      success: true,
      fields,
      count: fields.length
    });
  } catch (err) {
    console.error("Role göre alanlar getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alanlar yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/dynamic-fields/required/:roleId - Zorunlu alanlar
// ----------------------------------------------------------
router.get("/required/:roleId", requireAuth, async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const fields = await DynamicField.getRequiredFields(roleId);
    
    return res.json({
      success: true,
      fields,
      count: fields.length
    });
  } catch (err) {
    console.error("Zorunlu alanlar getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alanlar yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/dynamic-fields - Yeni alan oluştur
// ----------------------------------------------------------
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      key,
      label,
      description,
      type,
      category,
      section,
      roleVisibility,
      globalValidation,
      appearance,
      dependencies,
      defaultValue,
      isActive
    } = req.body;
    
    // Validasyon
    if (!key || !key.trim()) {
      return res.status(400).json({
        success: false,
        message: "Alan anahtarı zorunludur"
      });
    }
    
    if (!label || !label.trim()) {
      return res.status(400).json({
        success: false,
        message: "Alan etiketi zorunludur"
      });
    }
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Alan tipi zorunludur"
      });
    }
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Kategori zorunludur"
      });
    }
    
    if (!section) {
      return res.status(400).json({
        success: false,
        message: "Bölüm zorunludur"
      });
    }
    
    // Role visibility kontrolü
    if (!roleVisibility || !Array.isArray(roleVisibility) || roleVisibility.length === 0) {
      return res.status(400).json({
        success: false,
        message: "En az bir rol görünürlüğü belirtilmelidir"
      });
    }
    
    // Rolleri kontrol et
    const roleIds = roleVisibility.map(rv => rv.role);
    const roles = await Role.find({ _id: { $in: roleIds } });
    
    if (roles.length !== roleIds.length) {
      return res.status(400).json({
        success: false,
        message: "Bazı roller bulunamadı"
      });
    }
    
    // İsim benzersizliği kontrolü
    const existingField = await DynamicField.findOne({ key: key.trim() });
    if (existingField) {
      return res.status(400).json({
        success: false,
        message: "Bu alan anahtarı zaten kullanımda"
      });
    }
    
    const newField = new DynamicField({
      key: key.trim(),
      label: label.trim(),
      description: description?.trim() || "",
      type,
      category,
      section,
      roleVisibility: roleVisibility.map(rv => ({
        role: rv.role,
        isVisible: rv.isVisible !== false,
        isRequired: rv.isRequired || false,
        isEditable: rv.isEditable !== false,
        validation: rv.validation || {}
      })),
      globalValidation: globalValidation || {},
      appearance: appearance || {},
      dependencies: dependencies || [],
      defaultValue,
      isActive: isActive !== false,
      status: "draft",
      version: 1,
      metadata: {
        createdBy: req.user._id
      }
    });
    
    await newField.save();
    await newField.populate('roleVisibility.role');
    
    return res.status(201).json({
      success: true,
      message: "Alan başarıyla oluşturuldu",
      field: newField
    });
  } catch (err) {
    console.error("Alan oluşturma hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alan oluşturulamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// PUT /api/admin/dynamic-fields/:id - Alan güncelle
// ----------------------------------------------------------
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      label,
      description,
      roleVisibility,
      globalValidation,
      appearance,
      dependencies,
      defaultValue,
      isActive
    } = req.body;
    
    const field = await DynamicField.findById(id);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: "Alan bulunamadı"
      });
    }
    
    // Sistem alanı kontrolü
    if (field.isSystem) {
      return res.status(400).json({
        success: false,
        message: "Sistem alanları güncellenemez"
      });
    }
    
    // Güncelleme
    if (label !== undefined) field.label = label.trim();
    if (description !== undefined) field.description = description?.trim() || "";
    if (roleVisibility !== undefined) {
      // Rolleri kontrol et
      const roleIds = roleVisibility.map(rv => rv.role);
      const roles = await Role.find({ _id: { $in: roleIds } });
      
      if (roles.length !== roleIds.length) {
        return res.status(400).json({
          success: false,
          message: "Bazı roller bulunamadı"
        });
      }
      
      field.roleVisibility = roleVisibility.map(rv => ({
        role: rv.role,
        isVisible: rv.isVisible !== false,
        isRequired: rv.isRequired || false,
        isEditable: rv.isEditable !== false,
        validation: rv.validation || {}
      }));
    }
    if (globalValidation !== undefined) field.globalValidation = globalValidation;
    if (appearance !== undefined) field.appearance = appearance;
    if (dependencies !== undefined) field.dependencies = dependencies;
    if (defaultValue !== undefined) field.defaultValue = defaultValue;
    if (isActive !== undefined) field.isActive = isActive;

    // Draft'a çek ve versiyonu artır
    field.status = "draft";
    field.version = Number(field.version || 1) + 1;
    
    field.metadata.updatedBy = req.user._id;
    await field.save();
    
    await field.populate('roleVisibility.role');
    
    return res.json({
      success: true,
      message: "Alan başarıyla güncellendi",
      field
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
// DELETE /api/admin/dynamic-fields/:id - Alan sil
// ----------------------------------------------------------
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const field = await DynamicField.findById(id);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: "Alan bulunamadı"
      });
    }
    
    // Sistem alanı kontrolü
    if (field.isSystem) {
      return res.status(400).json({
        success: false,
        message: "Sistem alanları silinemez"
      });
    }
    
    await DynamicField.findByIdAndDelete(id);
    
    return res.json({
      success: true,
      message: "Alan başarıyla silindi",
      field
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
// POST /api/admin/dynamic-fields/:id/validate - Alan validasyonu
// ----------------------------------------------------------
router.post("/:id/validate", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { value, roleId } = req.body;
    
    const field = await DynamicField.findById(id);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: "Alan bulunamadı"
      });
    }
    
    // Rol kontrolü
    if (req.user?.role !== "admin" && req.userId !== roleId) {
      return res.status(403).json({ message: "Yetkisiz erişim" });
    }
    
    const validation = field.validateValue(value, roleId);
    
    return res.json({
      success: true,
      validation
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
// GET /api/admin/dynamic-fields/categories - Kategoriler
// ----------------------------------------------------------
router.get("/categories/list", requireAuth, requireAdmin, async (req, res) => {
  try {
    const categories = await DynamicField.distinct('category');
    
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

// ----------------------------------------------------------
// GET /api/admin/dynamic-fields/sections/:category - Bölümler
// ----------------------------------------------------------
router.get("/sections/:category", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { category } = req.params;
    
    const sections = await DynamicField.distinct('section', { category });
    
    return res.json({
      success: true,
      sections: sections.sort(),
      count: sections.length
    });
  } catch (err) {
    console.error("Bölümler getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Bölümler yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

module.exports = router;
