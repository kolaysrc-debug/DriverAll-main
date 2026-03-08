// PATH: DriverAll-main/drivercv-backend/routes/profileRoles.js
// ----------------------------------------------------------
// GMN Entegrasyonlu Profil Roller API
// - CRUD operasyonları
// - Yetki yönetimi
// - GMN kriterleri
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/auth");

// Mock veri - gerçek uygulamada MongoDB'den gelecek
let mockRoles = [
  {
    _id: "1",
    name: "Sürücü",
    description: "Profesyonel sürücü rolü",
    isActive: true,
    permissions: {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canManageUsers: false,
    },
    gmnCriteria: {
      experienceMin: 2,
      experienceMax: 30,
      requiredSkills: ["Ehliyet", "SRC Belgesi", "Psikoteknik Değerlendirme"],
      locationRestrictions: ["İstanbul", "Ankara", "İzmir"]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "2",
    name: "İşveren",
    description: "İletişim ve taşıma hizmeti veren işveren",
    isActive: true,
    permissions: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canManageUsers: false,
    },
    gmnCriteria: {
      experienceMin: 1,
      experienceMax: 50,
      requiredSkills: ["Vergi Levhası", "Yetki Belgesi"],
      locationRestrictions: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "3",
    name: "Reklamcı",
    description: "Reklam ve tanıtım hizmeti veren kullanıcı",
    isActive: true,
    permissions: {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canManageUsers: false,
    },
    gmnCriteria: {
      experienceMin: 0,
      experienceMax: 20,
      requiredSkills: ["Reklam Yönetimi"],
      locationRestrictions: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// ----------------------------------------------------------
// GET /api/admin/profile-roles
// ----------------------------------------------------------
router.get("/", requireAuth, async (req, res) => {
  try {
    // Sadece admin kullanıcılar erişebilir
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Yetkisiz erişim" });
    }

    return res.json({
      success: true,
      roles: mockRoles,
    });
  } catch (err) {
    console.error("Profile roles getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Roller yüklenemedi",
      error: err?.message || String(err),
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/profile-roles
// ----------------------------------------------------------
router.post("/", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Yetkisiz erişim" });
    }

    const { name, description, isActive, permissions, gmnCriteria } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rol adı zorunludur",
      });
    }

    const newRole = {
      _id: Date.now().toString(),
      name: name.trim(),
      description: description?.trim() || "",
      isActive: isActive !== false,
      permissions: permissions || {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canManageUsers: false,
      },
      gmnCriteria: gmnCriteria || {
        experienceMin: 0,
        experienceMax: 50,
        requiredSkills: [],
        locationRestrictions: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockRoles.push(newRole);

    return res.status(201).json({
      success: true,
      message: "Rol başarıyla oluşturuldu",
      role: newRole,
    });
  } catch (err) {
    console.error("Rol oluşturma hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Rol oluşturulamadı",
      error: err?.message || String(err),
    });
  }
});

// ----------------------------------------------------------
// PUT /api/admin/profile-roles/:id
// ----------------------------------------------------------
router.put("/:id", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Yetkisiz erişim" });
    }

    const { id } = req.params;
    const { name, description, isActive, permissions, gmnCriteria } = req.body;

    const roleIndex = mockRoles.findIndex(r => r._id === id);
    if (roleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Rol bulunamadı",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rol adı zorunludur",
      });
    }

    const updatedRole = {
      ...mockRoles[roleIndex],
      name: name.trim(),
      description: description?.trim() || "",
      isActive: isActive !== false,
      permissions: permissions || mockRoles[roleIndex].permissions,
      gmnCriteria: gmnCriteria || mockRoles[roleIndex].gmnCriteria,
      updatedAt: new Date().toISOString(),
    };

    mockRoles[roleIndex] = updatedRole;

    return res.json({
      success: true,
      message: "Rol başarıyla güncellendi",
      role: updatedRole,
    });
  } catch (err) {
    console.error("Rol güncelleme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Rol güncellenemedi",
      error: err?.message || String(err),
    });
  }
});

// ----------------------------------------------------------
// DELETE /api/admin/profile-roles/:id
// ----------------------------------------------------------
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Yetkisiz erişim" });
    }

    const { id } = req.params;
    const roleIndex = mockRoles.findIndex(r => r._id === id);

    if (roleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Rol bulunamadı",
      });
    }

    const deletedRole = mockRoles[roleIndex];
    mockRoles.splice(roleIndex, 1);

    return res.json({
      success: true,
      message: "Rol başarıyla silindi",
      role: deletedRole,
    });
  } catch (err) {
    console.error("Rol silme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Rol silinemedi",
      error: err?.message || String(err),
    });
  }
});

module.exports = router;
