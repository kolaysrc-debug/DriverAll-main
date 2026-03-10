// PATH: DriverAll-main/drivercv-backend/routes/subUsers.js
// ----------------------------------------------------------
// Alt Kullanıcı Yönetim API
// - CRUD operasyonları
// - Yetki yönetimi
// - Şube atamaları
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();
const SubUser = require("../models/SubUser");
const Branch = require("../models/Branch");
const Role = require("../models/Role");
const bcrypt = require("bcryptjs");
const requireAuth = require("../middleware/auth");

// Middleware: Admin kontrolü
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Yetkisiz erişim" });
  }
  next();
};

const requireAdminOrOwner = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  if (!req.user?._id) return res.status(401).json({ message: "Yetkisiz erişim" });
  return next();
};

const assertOwnerOrAdmin = (req, res, subuser) => {
  if (req.user?.role === "admin") return true;
  return String(subuser.parentUser) === String(req.user._id);
};

// ----------------------------------------------------------
// GET /api/admin/subusers - Tüm alt kullanıcılar
// ----------------------------------------------------------
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { parentUser, role, status, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (parentUser) filter.parentUser = parentUser;
    if (role) filter.role = role;
    if (status === "active") {
      filter["status.isActive"] = true;
      filter["status.isApproved"] = true;
    } else if (status === "pending") {
      filter["status.isApproved"] = false;
    } else if (status === "inactive") {
      filter["status.isActive"] = false;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const subusers = await SubUser.find(filter)
      .populate('parentUser')
      .populate('role')
      .populate('assignedBranches.branch')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await SubUser.countDocuments(filter);
    
    return res.json({
      success: true,
      subusers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Alt kullanıcılar getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alt kullanıcılar yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/subusers/:id - Alt kullanıcı detayı
// ----------------------------------------------------------
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const subuser = await SubUser.findById(id)
      .populate('parentUser')
      .populate('role')
      .populate('assignedBranches.branch');
    
    if (!subuser) {
      return res.status(404).json({
        success: false,
        message: "Alt kullanıcı bulunamadı"
      });
    }
    
    return res.json({
      success: true,
      subuser
    });
  } catch (err) {
    console.error("Alt kullanıcı detayı getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alt kullanıcı detayı yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/subusers - Yeni alt kullanıcı oluştur
// ----------------------------------------------------------
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      parentUser,
      name,
      email,
      phone,
      password,
      role,
      assignedBranches,
      assignedUnits,
      permissions,
      locationRestrictions,
      approvalSettings,
      profile,
      contact
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
        message: "İsim zorunludur"
      });
    }
    
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "E-posta zorunludur"
      });
    }
    
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Şifre en az 6 karakter olmalıdır"
      });
    }
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Rol zorunludur"
      });
    }
    
    // E-posta benzersizliği kontrolü
    const existingSubUser = await SubUser.findOne({ email: email.trim().toLowerCase() });
    if (existingSubUser) {
      return res.status(400).json({
        success: false,
        message: "Bu e-posta adresi zaten kullanımda"
      });
    }
    
    // Rolleri kontrol et
    const roleData = await Role.findById(role);
    if (!roleData) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz rol"
      });
    }
    
    // Şubeleri kontrol et
    if (assignedBranches && assignedBranches.length > 0) {
      const branchIds = assignedBranches.map(ab => ab.branch);
      const branches = await Branch.find({ _id: { $in: branchIds } });
      
      if (branches.length !== branchIds.length) {
        return res.status(400).json({
          success: false,
          message: "Bazı şubeler bulunamadı"
        });
      }
    }
    
    // Şifre hash'leme
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const newSubUser = new SubUser({
      parentUser,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      passwordHash,
      role,
      assignedBranches: assignedBranches || [],
      assignedUnits: assignedUnits || [],
      permissions: permissions || [],
      locationRestrictions: locationRestrictions || {
        type: "none"
      },
      approvalSettings: approvalSettings || {
        requireOwnerApproval: true,
        requireActionApproval: false
      },
      profile: profile || {},
      contact: contact || {},
      metadata: {
        createdBy: req.user._id
      }
    });
    
    await newSubUser.save();
    
    // Aktivasyon log'u ekle
    newSubUser.addActivityLog("created", "Alt kullanıcı oluşturuldu", {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    await newSubUser.save();
    
    await newSubUser.populate([
      { path: 'parentUser' },
      { path: 'role' },
      { path: 'assignedBranches.branch' }
    ]);
    
    return res.status(201).json({
      success: true,
      message: "Alt kullanıcı başarıyla oluşturuldu",
      subuser: newSubUser
    });
  } catch (err) {
    console.error("Alt kullanıcı oluşturma hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alt kullanıcı oluşturulamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// PUT /api/admin/subusers/:id - Alt kullanıcı güncelle
// ----------------------------------------------------------
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      role,
      assignedBranches,
      assignedUnits,
      permissions,
      locationRestrictions,
      approvalSettings,
      profile,
      contact
    } = req.body;
    
    const subuser = await SubUser.findById(id);
    if (!subuser) {
      return res.status(404).json({
        success: false,
        message: "Alt kullanıcı bulunamadı"
      });
    }
    
    // Güncelleme
    if (name !== undefined) subuser.name = name.trim();
    if (phone !== undefined) subuser.phone = phone?.trim() || "";
    if (role !== undefined) {
      // Rolü kontrol et
      const roleData = await Role.findById(role);
      if (!roleData) {
        return res.status(400).json({
          success: false,
          message: "Geçersiz rol"
        });
      }
      subuser.role = role;
    }
    if (assignedBranches !== undefined) {
      // Şubeleri kontrol et
      if (assignedBranches.length > 0) {
        const branchIds = assignedBranches.map(ab => ab.branch);
        const branches = await Branch.find({ _id: { $in: branchIds } });
        
        if (branches.length !== branchIds.length) {
          return res.status(400).json({
            success: false,
            message: "Bazı şubeler bulunamadı"
          });
        }
      }
      subuser.assignedBranches = assignedBranches;
    }

    if (assignedUnits !== undefined) subuser.assignedUnits = assignedUnits;
    if (permissions !== undefined) subuser.permissions = permissions;
    if (locationRestrictions !== undefined) subuser.locationRestrictions = locationRestrictions;
    if (approvalSettings !== undefined) subuser.approvalSettings = approvalSettings;
    if (profile !== undefined) subuser.profile = profile;
    if (contact !== undefined) subuser.contact = contact;
    
    subuser.metadata.updatedBy = req.user._id;
    
    // Aktivasyon log'u ekle
    subuser.addActivityLog("updated", "Alt kullanıcı güncellendi", {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    await subuser.save();
    
    await subuser.populate([
      { path: 'parentUser' },
      { path: 'role' },
      { path: 'assignedBranches.branch' }
    ]);
    
    return res.json({
      success: true,
      message: "Alt kullanıcı başarıyla güncellendi",
      subuser
    });
  } catch (err) {
    console.error("Alt kullanıcı güncelleme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alt kullanıcı güncellenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/subusers/:id/owner-approve - Sahibi (parentUser) onayı
// ----------------------------------------------------------
router.post("/:id/owner-approve", requireAuth, requireAdminOrOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const subuser = await SubUser.findById(id);
    if (!subuser) {
      return res.status(404).json({ success: false, message: "Alt kullanıcı bulunamadı" });
    }

    if (!assertOwnerOrAdmin(req, res, subuser)) {
      return res.status(403).json({ success: false, message: "Yetkisiz erişim" });
    }

    if (subuser.status.isApproved) {
      return res.status(400).json({ success: false, message: "Alt kullanıcı zaten onaylanmış" });
    }

    subuser.approve(req.user._id, notes || "");
    subuser.addActivityLog(
      "approved_by_owner",
      `Sahibi tarafından onaylandı. Not: ${notes || ""}`,
      { ipAddress: req.ip, userAgent: req.get("User-Agent") }
    );
    await subuser.save();

    await subuser.populate([
      { path: "parentUser" },
      { path: "role" },
      { path: "assignedBranches.branch" }
    ]);

    return res.json({ success: true, message: "Alt kullanıcı onaylandı", subuser });
  } catch (err) {
    console.error("Alt kullanıcı owner-approve hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Onaylama yapılamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/subusers/:id/owner-reject - Sahibi (parentUser) reddi
// ----------------------------------------------------------
router.post("/:id/owner-reject", requireAuth, requireAdminOrOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ success: false, message: "Reddetme sebebi zorunludur" });
    }

    const subuser = await SubUser.findById(id);
    if (!subuser) {
      return res.status(404).json({ success: false, message: "Alt kullanıcı bulunamadı" });
    }

    if (!assertOwnerOrAdmin(req, res, subuser)) {
      return res.status(403).json({ success: false, message: "Yetkisiz erişim" });
    }

    if (subuser.status.isApproved) {
      return res.status(400).json({ success: false, message: "Onaylanmış kullanıcı reddedilemez" });
    }

    subuser.reject(req.user._id, String(reason).trim());
    subuser.addActivityLog(
      "rejected_by_owner",
      `Sahibi tarafından reddedildi. Sebep: ${String(reason).trim()}`,
      { ipAddress: req.ip, userAgent: req.get("User-Agent") }
    );
    await subuser.save();

    await subuser.populate([
      { path: "parentUser" },
      { path: "role" },
      { path: "assignedBranches.branch" }
    ]);

    return res.json({ success: true, message: "Alt kullanıcı reddedildi", subuser });
  } catch (err) {
    console.error("Alt kullanıcı owner-reject hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Reddetme yapılamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/subusers/:id/toggle-active - Aktif/Pasif yap
// ----------------------------------------------------------
router.post("/:id/toggle-active", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const subuser = await SubUser.findById(id);
    if (!subuser) {
      return res.status(404).json({
        success: false,
        message: "Alt kullanıcı bulunamadı"
      });
    }

    if (!subuser.status.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Onaylanmamış kullanıcı aktif/pasif yapılamaz"
      });
    }

    if (subuser.status.isActive) {
      subuser.deactivate(req.user._id, reason || "");
    } else {
      subuser.activate(req.user._id);
    }

    subuser.metadata.updatedBy = req.user._id;
    await subuser.save();

    await subuser.populate([
      { path: "parentUser" },
      { path: "role" },
      { path: "assignedBranches.branch" }
    ]);

    return res.json({
      success: true,
      message: subuser.status.isActive ? "Alt kullanıcı aktif edildi" : "Alt kullanıcı pasif yapıldı",
      subuser
    });
  } catch (err) {
    console.error("Alt kullanıcı aktif/pasif hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Aktif/pasif işlemi yapılamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// DELETE /api/admin/subusers/:id - Alt kullanıcı sil
// ----------------------------------------------------------
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const subuser = await SubUser.findById(id);
    if (!subuser) {
      return res.status(404).json({
        success: false,
        message: "Alt kullanıcı bulunamadı"
      });
    }
    
    await SubUser.findByIdAndDelete(id);
    
    return res.json({
      success: true,
      message: "Alt kullanıcı başarıyla silindi",
      subuser
    });
  } catch (err) {
    console.error("Alt kullanıcı silme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alt kullanıcı silinemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/subusers/:id/reset-password - Şifre sıfırla
// ----------------------------------------------------------
router.post("/:id/reset-password", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Yeni şifre en az 6 karakter olmalıdır"
      });
    }
    
    const subuser = await SubUser.findById(id);
    if (!subuser) {
      return res.status(404).json({
        success: false,
        message: "Alt kullanıcı bulunamadı"
      });
    }
    
    // Şifre hash'leme
    const salt = await bcrypt.genSalt(12);
    subuser.passwordHash = await bcrypt.hash(newPassword, salt);
    subuser.status.passwordResetRequired = true;
    
    // Aktivasyon log'u ekle
    subuser.addActivityLog("password_reset", "Şifre admin tarafından sıfırlandı", {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    await subuser.save();
    
    return res.json({
      success: true,
      message: "Şifre başarıyla sıfırlandı"
    });
  } catch (err) {
    console.error("Şifre sıfırlama hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Şifre sıfırlanamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/subusers/parent/:parentId - Ana kullanıcıya göre alt kullanıcılar
// ----------------------------------------------------------
router.get("/parent/:parentId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { parentId } = req.params;
    
    const subusers = await SubUser.findByParentUser(parentId);
    
    return res.json({
      success: true,
      subusers,
      count: subusers.length
    });
  } catch (err) {
    console.error("Ana kullanıcıya göre alt kullanıcılar getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alt kullanıcılar yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/subusers/branch/:branchId - Şubeye göre alt kullanıcılar
// ----------------------------------------------------------
router.get("/branch/:branchId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const subusers = await SubUser.findByBranch(branchId);
    
    return res.json({
      success: true,
      subusers,
      count: subusers.length
    });
  } catch (err) {
    console.error("Şubeye göre alt kullanıcılar getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Alt kullanıcılar yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

module.exports = router;
