// PATH: DriverAll-main/drivercv-backend/routes/adminApprovals.js
// ----------------------------------------------------------
// Admin Approvals API
// - Reklam veren (advertiser) hesaplarını onaylama / reddetme
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const User = require("../models/User");

// auth modülü proje içinde farklı şekillerde export edilmiş olabilir.
// Bu yüzden hem function hem de {requireAuth,...} varyantını destekliyoruz.
const authModule = require("../middleware/auth");
const requireAuth =
  (authModule && (authModule.requireAuth || authModule.auth)) || authModule;

// ----------------------------------------------------------
// Yardımcılar
// ----------------------------------------------------------
async function attachUser(req, res, next) {
  try {
    // Bazı projelerde middleware req.user set eder; varsa direkt kullan.
    if (req.user && req.user.role) return next();

    const userId = req.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Yetkisiz." });
    }

    const me = await User.findById(userId).lean();
    if (!me) {
      return res.status(401).json({ success: false, message: "Yetkisiz." });
    }

    req.user = me;
    return next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Kullanıcı doğrulanamadı.",
      error: err?.message || String(err),
    });
  }
}

function requireAdmin(req, res, next) {
  const role = String(req.user?.role || "").toLowerCase();
  if (role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden (admin)." });
  }
  return next();
}

// ----------------------------------------------------------
// GET /api/admin/approvals/advertisers?status=pending|approved|rejected
// ----------------------------------------------------------
router.get("/advertisers", requireAuth, attachUser, requireAdmin, async (req, res) => {
  const status = String(req.query.status || "pending").toLowerCase();

  const base = { role: "advertiser" };

  // Not: userSchema alanları projende mevcut (isApproved/isActive) varsayımıyla ilerliyoruz.
  // Zaten “admin onayı bekliyor” mesajı aldığın için backend tarafında bu alanlar bulunuyor olmalı.
  let query = { ...base };

  if (status === "approved") {
    query.isApproved = true;
  } else if (status === "rejected") {
    // reddetme için iki pratik yaklaşım: isActive=false veya rejectionAt var
    query.$or = [{ isActive: false }, { rejectedAt: { $exists: true } }];
  } else {
    // pending
    query.$or = [{ isApproved: { $ne: true } }, { isApproved: { $exists: false } }];
    query.isActive = { $ne: false };
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return res.json({ success: true, users });
});

// ----------------------------------------------------------
// PATCH /api/admin/approvals/advertisers/:id/approve
// body: { note?: string }
// ----------------------------------------------------------
router.patch(
  "/advertisers/:id/approve",
  requireAuth,
  attachUser,
  requireAdmin,
  async (req, res) => {
    const id = req.params.id;

    const u = await User.findById(id);
    if (!u) return res.status(404).json({ success: false, message: "User not found." });
    if (String(u.role).toLowerCase() !== "advertiser") {
      return res.status(400).json({ success: false, message: "Bu kullanıcı advertiser değil." });
    }

    u.isApproved = true;
    u.isActive = true;

    // Audit alanları (schema’da varsa tutulur)
    u.approvedAt = new Date();
    u.approvedBy = req.user?._id || req.userId || null;

    const note = String(req.body?.note || "").trim();
    if (note) u.approvalNote = note;

    await u.save();

    return res.json({ success: true, user: u });
  }
);

// ----------------------------------------------------------
// PATCH /api/admin/approvals/advertisers/:id/reject
// body: { reason?: string }
// ----------------------------------------------------------
router.patch(
  "/advertisers/:id/reject",
  requireAuth,
  attachUser,
  requireAdmin,
  async (req, res) => {
    const id = req.params.id;

    const u = await User.findById(id);
    if (!u) return res.status(404).json({ success: false, message: "User not found." });
    if (String(u.role).toLowerCase() !== "advertiser") {
      return res.status(400).json({ success: false, message: "Bu kullanıcı advertiser değil." });
    }

    // reddedince pasif yapalım (login engeli için en net yöntem)
    u.isApproved = false;
    u.isActive = false;

    u.rejectedAt = new Date();
    u.rejectedBy = req.user?._id || req.userId || null;

    const reason = String(req.body?.reason || "").trim();
    if (reason) u.rejectionReason = reason;

    await u.save();

    return res.json({ success: true, user: u });
  }
);

module.exports = router;
