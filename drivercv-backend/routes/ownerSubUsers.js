const express = require("express");
const router = express.Router();

const SubUser = require("../models/SubUser");
const Branch = require("../models/Branch");
const Role = require("../models/Role");
const bcrypt = require("bcryptjs");

const requireAuth = require("../middleware/auth");

const mongoose = require("mongoose");

// Role'u ObjectId veya string name ile bul
async function resolveRole(roleValue) {
  if (!roleValue) return null;
  // Geçerli ObjectId mi?
  if (mongoose.Types.ObjectId.isValid(roleValue) && String(new mongoose.Types.ObjectId(roleValue)) === String(roleValue)) {
    return Role.findById(roleValue);
  }
  // String name ile ara, bulamazsa displayName ile dene
  const byName = await Role.findOne({ name: roleValue });
  if (byName) return byName;
  return Role.findOne({ displayName: roleValue });
}

function requireNotDriver(req, res, next) {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ success: false, message: "Giriş gerekli" });
  if (role === "driver" || role === "candidate") {
    return res.status(403).json({ success: false, message: "Bu işlem aday kullanıcılar için kapalı" });
  }
  return next();
}

// ----------------------------------------------------------
// GET /api/owner/subusers - Owner'ın kendi alt kullanıcıları
// ----------------------------------------------------------
router.get("/", requireAuth, requireNotDriver, async (req, res) => {
  try {
    const subusers = await SubUser.find({ parentUser: req.user._id })
      .populate("parentUser")
      .populate("role")
      .populate("assignedBranches.branch")
      .sort({ createdAt: -1 });

    return res.json({ success: true, subusers });
  } catch (err) {
    console.error("Owner subusers list error:", err);
    return res.status(500).json({ success: false, message: "Alt kullanıcılar yüklenemedi" });
  }
});

// ----------------------------------------------------------
// POST /api/owner/subusers - Owner alt kullanıcı oluştur
// - parentUser body'den alınmaz, req.user._id set edilir
// - admin onayı yok, owner oluşturduysa otomatik aktif/onaylı
// ----------------------------------------------------------
router.post("/", requireAuth, requireNotDriver, async (req, res) => {
  try {
    const {
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
      contact,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "İsim zorunludur" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "E-posta zorunludur" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Şifre en az 6 karakter olmalıdır" });
    }

    if (!role) {
      return res.status(400).json({ success: false, message: "Rol zorunludur" });
    }

    const existingSubUser = await SubUser.findOne({ email: email.trim().toLowerCase() });
    if (existingSubUser) {
      return res.status(400).json({ success: false, message: "Bu e-posta adresi zaten kullanımda" });
    }

    const roleData = await resolveRole(role);
    if (!roleData) {
      return res.status(400).json({ success: false, message: "Geçersiz rol" });
    }

    if (assignedBranches && assignedBranches.length > 0) {
      const branchIds = assignedBranches.map((ab) => ab.branch);
      const branches = await Branch.find({ _id: { $in: branchIds } });
      if (branches.length !== branchIds.length) {
        return res.status(400).json({ success: false, message: "Bazı şubeler bulunamadı" });
      }
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const now = new Date();

    const newSubUser = new SubUser({
      parentUser: req.user._id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      passwordHash,
      role: roleData._id,
      assignedBranches: assignedBranches || [],
      assignedUnits: assignedUnits || [],
      permissions: permissions || [],
      locationRestrictions: locationRestrictions || { type: "none" },
      approvalSettings: {
        requireOwnerApproval: false,
        requireActionApproval: approvalSettings?.requireActionApproval === true,
      },
      status: {
        isActive: true,
        isApproved: true,
        approvalDate: now,
        approvedBy: req.user._id,
        passwordResetRequired: true,
      },
      profile: profile || {},
      contact: contact || {},
      metadata: {
        createdBy: req.user._id,
        source: "owner",
      },
    });

    await newSubUser.save();

    newSubUser.addActivityLog("created", "Alt kullanıcı owner tarafından oluşturuldu", {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    await newSubUser.save();

    await newSubUser.populate([
      { path: "parentUser" },
      { path: "role" },
      { path: "assignedBranches.branch" },
    ]);

    return res.status(201).json({ success: true, message: "Alt kullanıcı oluşturuldu", subuser: newSubUser });
  } catch (err) {
    console.error("Owner subuser create error:", err);
    return res.status(500).json({ success: false, message: "Alt kullanıcı oluşturulamadı" });
  }
});

// ----------------------------------------------------------
// PUT /api/owner/subusers/:id - Owner alt kullanıcı güncelle
// ----------------------------------------------------------
router.put("/:id", requireAuth, requireNotDriver, async (req, res) => {
  try {
    const subuser = await SubUser.findById(req.params.id);
    if (!subuser) {
      return res.status(404).json({ success: false, message: "Alt kullanıcı bulunamadı" });
    }

    // Sahiplik kontrolü
    if (String(subuser.parentUser) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Bu alt kullanıcıyı düzenleme yetkiniz yok" });
    }

    const {
      name, email, phone, password, role,
      assignedBranches, assignedUnits, permissions,
      locationRestrictions, approvalSettings, profile, contact,
    } = req.body;

    if (name != null) subuser.name = name.trim();
    if (phone != null) subuser.phone = phone.trim();

    // E-posta değişikliğinde benzersizlik kontrolü
    if (email != null && email.trim().toLowerCase() !== subuser.email) {
      const dup = await SubUser.findOne({ email: email.trim().toLowerCase(), _id: { $ne: subuser._id } });
      if (dup) return res.status(400).json({ success: false, message: "Bu e-posta adresi zaten kullanımda" });
      subuser.email = email.trim().toLowerCase();
    }

    // Şifre değişikliği
    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(12);
      subuser.passwordHash = await bcrypt.hash(password, salt);
      subuser.status.passwordResetRequired = false;
    }

    // Rol değişikliği
    if (role) {
      const roleData = await resolveRole(role);
      if (!roleData) return res.status(400).json({ success: false, message: "Geçersiz rol" });
      subuser.role = roleData._id;
    }

    // Şube ataması
    if (assignedBranches != null) {
      if (assignedBranches.length > 0) {
        const branchIds = assignedBranches.map((ab) => ab.branch);
        const branches = await Branch.find({ _id: { $in: branchIds } });
        if (branches.length !== branchIds.length) {
          return res.status(400).json({ success: false, message: "Bazı şubeler bulunamadı" });
        }
      }
      subuser.assignedBranches = assignedBranches;
    }

    if (assignedUnits != null) subuser.assignedUnits = assignedUnits;
    if (permissions != null) subuser.permissions = permissions;
    if (locationRestrictions != null) subuser.locationRestrictions = locationRestrictions;
    if (approvalSettings != null) {
      subuser.approvalSettings = {
        ...subuser.approvalSettings,
        ...approvalSettings,
      };
    }
    if (profile != null) subuser.profile = { ...subuser.profile, ...profile };
    if (contact != null) subuser.contact = { ...subuser.contact, ...contact };

    subuser.metadata.updatedBy = req.user._id;

    subuser.addActivityLog("updated", "Alt kullanıcı owner tarafından güncellendi", {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    await subuser.save();

    await subuser.populate([
      { path: "parentUser" },
      { path: "role" },
      { path: "assignedBranches.branch" },
    ]);

    return res.json({ success: true, message: "Alt kullanıcı güncellendi", subuser });
  } catch (err) {
    console.error("Owner subuser update error:", err);
    return res.status(500).json({ success: false, message: "Alt kullanıcı güncellenemedi" });
  }
});

// ----------------------------------------------------------
// DELETE /api/owner/subusers/:id - Owner alt kullanıcı sil
// ----------------------------------------------------------
router.delete("/:id", requireAuth, requireNotDriver, async (req, res) => {
  try {
    const subuser = await SubUser.findById(req.params.id);
    if (!subuser) {
      return res.status(404).json({ success: false, message: "Alt kullanıcı bulunamadı" });
    }

    // Sahiplik kontrolü
    if (String(subuser.parentUser) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Bu alt kullanıcıyı silme yetkiniz yok" });
    }

    await SubUser.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: "Alt kullanıcı silindi" });
  } catch (err) {
    console.error("Owner subuser delete error:", err);
    return res.status(500).json({ success: false, message: "Alt kullanıcı silinemedi" });
  }
});

// ----------------------------------------------------------
// PUT /api/owner/subusers/:id/toggle-active - Aktif/pasif
// ----------------------------------------------------------
router.put("/:id/toggle-active", requireAuth, requireNotDriver, async (req, res) => {
  try {
    const subuser = await SubUser.findById(req.params.id);
    if (!subuser) {
      return res.status(404).json({ success: false, message: "Alt kullanıcı bulunamadı" });
    }

    if (String(subuser.parentUser) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Yetkiniz yok" });
    }

    subuser.status.isActive = !subuser.status.isActive;
    subuser.addActivityLog(
      subuser.status.isActive ? "activated" : "deactivated",
      `Alt kullanıcı ${subuser.status.isActive ? "aktif" : "pasif"} edildi`,
      { ipAddress: req.ip }
    );

    await subuser.save();

    return res.json({
      success: true,
      message: `Alt kullanıcı ${subuser.status.isActive ? "aktif" : "pasif"} edildi`,
      subuser,
    });
  } catch (err) {
    console.error("Owner subuser toggle error:", err);
    return res.status(500).json({ success: false, message: "Durum değiştirilemedi" });
  }
});

module.exports = router;
