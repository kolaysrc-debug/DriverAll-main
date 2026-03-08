// PATH: DriverAll-main/drivercv-backend/routes/approvals.js
// ----------------------------------------------------------
// Onay Sistemi API
// - Admin onay akışları
// - Bekleyen talepler
// - Aktivasyon/Pasivasyon
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();
const SubUser = require("../models/SubUser");
const Branch = require("../models/Branch");
const DynamicProfile = require("../models/DynamicProfile");
const requireAuth = require("../middleware/auth");

// Middleware: Admin kontrolü
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Yetkisiz erişim" });
  }
  next();
};

// ----------------------------------------------------------
// GET /api/admin/approvals - Bekleyen onaylar
// ----------------------------------------------------------
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    
    let results = {
      subusers: [],
      branches: [],
      profiles: []
    };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Alt kullanıcı onayları
    if (!type || type === "subusers") {
      let subUserFilter = {};
      if (status === "pending") {
        subUserFilter = { "status.isApproved": false };
      } else if (status === "approved") {
        subUserFilter = { "status.isApproved": true };
      }
      
      const subusers = await SubUser.find(subUserFilter)
        .populate('parentUser')
        .populate('role')
        .populate('assignedBranches.branch')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      results.subusers = subusers;
    }
    
    // Şube onayları
    if (!type || type === "branches") {
      let branchFilter = {};
      if (status === "pending") {
        branchFilter = { "status.isApproved": false };
      } else if (status === "approved") {
        branchFilter = { "status.isApproved": true };
      }
      
      const branches = await Branch.find(branchFilter)
        .populate('parentUser')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      results.branches = branches;
    }
    
    // Profil onayları (işletme profilleri)
    if (!type || type === "profiles") {
      let profileFilter = {};
      if (status === "pending") {
        profileFilter = { "status.isVerified": false };
      } else if (status === "approved") {
        profileFilter = { "status.isVerified": true };
      }
      
      const profiles = await DynamicProfile.find(profileFilter)
        .populate('role')
        .populate('userData')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      results.profiles = profiles;
    }
    
    return res.json({
      success: true,
      results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error("Onaylar getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Onaylar yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/approvals/subusers - Alt kullanıcı onayları
// ----------------------------------------------------------
router.get("/subusers", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (status === "pending") {
      filter = { "status.isApproved": false };
    } else if (status === "approved") {
      filter = { "status.isApproved": true };
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
    console.error("Alt kullanıcı onayları getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Onaylar yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/approvals/branches - Şube onayları
// ----------------------------------------------------------
router.get("/branches", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (status === "pending") {
      filter = { "status.isApproved": false };
    } else if (status === "approved") {
      filter = { "status.isApproved": true };
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
    console.error("Şube onayları getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Onaylar yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/approvals/subuser/:id/approve - Alt kullanıcı onayla
// ----------------------------------------------------------
router.post("/subuser/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const subuser = await SubUser.findById(id);
    if (!subuser) {
      return res.status(404).json({
        success: false,
        message: "Alt kullanıcı bulunamadı"
      });
    }
    
    if (subuser.status.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Alt kullanıcı zaten onaylanmış"
      });
    }
    
    await subuser.approve(req.user._id, notes || "");
    await subuser.save();
    
    // Aktivasyon log'u ekle
    subuser.addActivityLog("approved_by_admin", `Admin tarafından onaylandı. Not: ${notes || ""}`, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    await subuser.save();
    
    return res.json({
      success: true,
      message: "Alt kullanıcı başarıyla onaylandı",
      subuser
    });
  } catch (err) {
    console.error("Alt kullanıcı onaylama hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Onaylama yapılamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/approvals/subuser/:id/reject - Alt kullanıcı reddet
// ----------------------------------------------------------
router.post("/subuser/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reddetme sebebi zorunludur"
      });
    }
    
    const subuser = await SubUser.findById(id);
    if (!subuser) {
      return res.status(404).json({
        success: false,
        message: "Alt kullanıcı bulunamadı"
      });
    }
    
    if (subuser.status.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Onaylanmış kullanıcı reddedilemez"
      });
    }
    
    await subuser.reject(req.user._id, reason.trim());
    await subuser.save();
    
    return res.json({
      success: true,
      message: "Alt kullanıcı reddedildi",
      subuser
    });
  } catch (err) {
    console.error("Alt kullanıcı reddetme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Reddetme yapılamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/approvals/branch/:id/approve - Şube onayla
// ----------------------------------------------------------
router.post("/branch/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Şube bulunamadı"
      });
    }
    
    if (branch.status.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Şube zaten onaylanmış"
      });
    }
    
    await branch.approve(req.user._id, notes || "");
    await branch.save();
    
    return res.json({
      success: true,
      message: "Şube başarıyla onaylandı",
      branch
    });
  } catch (err) {
    console.error("Şube onaylama hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Onaylama yapılamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/approvals/branch/:id/reject - Şube reddet
// ----------------------------------------------------------
router.post("/branch/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reddetme sebebi zorunludur"
      });
    }
    
    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Şube bulunamadı"
      });
    }
    
    if (branch.status.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Onaylanmış şube reddedilemez"
      });
    }
    
    await branch.reject(req.user._id, reason.trim());
    await branch.save();
    
    return res.json({
      success: true,
      message: "Şube reddedildi",
      branch
    });
  } catch (err) {
    console.error("Şube reddetme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Reddetme yapılamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/approvals/subuser/:id/activate - Alt kullanıcı aktifleştir
// ----------------------------------------------------------
router.post("/subuser/:id/activate", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
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
        message: "Onaylanmamış kullanıcı aktifleştirilemez"
      });
    }
    
    if (subuser.status.isActive) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcı zaten aktif"
      });
    }
    
    await subuser.activate(req.user._id);
    await subuser.save();
    
    return res.json({
      success: true,
      message: "Alt kullanıcı aktifleştirildi",
      subuser
    });
  } catch (err) {
    console.error("Alt kullanıcı aktifleştirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Aktifleştirme yapılamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/approvals/subuser/:id/deactivate - Alt kullanıcı pasifleştir
// ----------------------------------------------------------
router.post("/subuser/:id/deactivate", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Pasifleştirme sebebi zorunludur"
      });
    }
    
    const subuser = await SubUser.findById(id);
    if (!subuser) {
      return res.status(404).json({
        success: false,
        message: "Alt kullanıcı bulunamadı"
      });
    }
    
    if (!subuser.status.isActive) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcı zaten pasif"
      });
    }
    
    await subuser.deactivate(req.user._id, reason.trim());
    await subuser.save();
    
    return res.json({
      success: true,
      message: "Alt kullanıcı pasifleştirildi",
      subuser
    });
  } catch (err) {
    console.error("Alt kullanıcı pasifleştirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Pasifleştirme yapılamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/approvals/branch/:id/activate - Şube aktifleştir
// ----------------------------------------------------------
router.post("/branch/:id/activate", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Şube bulunamadı"
      });
    }
    
    if (!branch.status.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Onaylanmamış şube aktifleştirilemez"
      });
    }
    
    if (branch.status.isActive) {
      return res.status(400).json({
        success: false,
        message: "Şube zaten aktif"
      });
    }
    
    await branch.activate(req.user._id);
    await branch.save();
    
    return res.json({
      success: true,
      message: "Şube aktifleştirildi",
      branch
    });
  } catch (err) {
    console.error("Şube aktifleştirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Aktifleştirme yapılamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/approvals/branch/:id/deactivate - Şube pasifleştir
// ----------------------------------------------------------
router.post("/branch/:id/deactivate", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Pasifleştirme sebebi zorunludur"
      });
    }
    
    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Şube bulunamadı"
      });
    }
    
    if (!branch.status.isActive) {
      return res.status(400).json({
        success: false,
        message: "Şube zaten pasif"
      });
    }
    
    await branch.deactivate(req.user._id, reason.trim());
    await branch.save();
    
    return res.json({
      success: true,
      message: "Şube pasifleştirildi",
      branch
    });
  } catch (err) {
    console.error("Şube pasifleştirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Pasifleştirme yapılamadı",
      error: err?.message || String(err)
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/approvals/stats - Onay istatistikleri
// ----------------------------------------------------------
router.get("/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = {
      pending: {
        subusers: await SubUser.countDocuments({ "status.isApproved": false }),
        branches: await Branch.countDocuments({ "status.isApproved": false }),
        profiles: await DynamicProfile.countDocuments({ "status.isVerified": false })
      },
      approved: {
        subusers: await SubUser.countDocuments({ "status.isApproved": true }),
        branches: await Branch.countDocuments({ "status.isApproved": true }),
        profiles: await DynamicProfile.countDocuments({ "status.isVerified": true })
      },
      active: {
        subusers: await SubUser.countDocuments({ "status.isActive": true, "status.isApproved": true }),
        branches: await Branch.countDocuments({ "status.isActive": true, "status.isApproved": true })
      }
    };
    
    return res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error("İstatistikler getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "İstatistikler yüklenemedi",
      error: err?.message || String(err)
    });
  }
});

module.exports = router;
