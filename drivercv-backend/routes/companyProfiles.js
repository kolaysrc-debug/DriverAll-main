// PATH: DriverAll-main/drivercv-backend/routes/companyProfiles.js

const express = require("express");
const router = express.Router();

const CompanyProfile = require("../models/CompanyProfile");
const { requireAuth, requireRoles } = require("../middleware/auth");

// Advertiser: GET /api/company-profile/me
router.get("/me", requireAuth, requireRoles("advertiser"), async (req, res) => {
  try {
    const doc = await CompanyProfile.findOne({ ownerUserId: req.user._id }).lean();
    return res.json({ success: true, company: doc || null });
  } catch (err) {
    return res.status(500).json({ success: false, message: "read failed", error: err.message });
  }
});

// Advertiser: PUT /api/company-profile/me
router.put("/me", requireAuth, requireRoles("advertiser"), async (req, res) => {
  try {
    const b = req.body || {};

    const update = {
      legalName: String(b.legalName || ""),
      taxNo: String(b.taxNo || ""),
      taxOffice: String(b.taxOffice || ""),
      addressText: String(b.addressText || ""),
      country: String(b.country || "TR").toUpperCase(),
      provinceCode: String(b.provinceCode || ""),
      districtCodes: Array.isArray(b.districtCodes)
        ? b.districtCodes.map((x) => String(x).trim()).filter(Boolean)
        : [],
      businessType: String(b.businessType || "OTHER"),
      active: b.active !== false,
      // advertiser düzenleyince tekrar pending (admin yeniden doğrulasın)
      verifiedStatus: "pending",
      verifiedBy: null,
      verifiedAt: null,
      adminNote: "",
    };

    // minimum kontrol
    if (!update.legalName) return res.status(400).json({ success: false, message: "legalName required" });
    if (!update.country) return res.status(400).json({ success: false, message: "country required" });

    const doc = await CompanyProfile.findOneAndUpdate(
      { ownerUserId: req.user._id },
      { $set: update },
      { new: true, upsert: true }
    );

    return res.json({ success: true, company: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "save failed", error: err.message });
  }
});

// Admin: list pending
router.get("/admin/list", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const status = String(req.query.status || "pending").trim();
    const q = {};
    if (status) q.verifiedStatus = status;

    const list = await CompanyProfile.find(q).sort({ createdAt: -1 }).limit(300).lean();
    return res.json({ success: true, list });
  } catch (err) {
    return res.status(500).json({ success: false, message: "admin list failed", error: err.message });
  }
});

// Admin: verify
router.post("/admin/:id/verify", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await CompanyProfile.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "not found" });

    doc.verifiedStatus = "verified";
    doc.verifiedBy = req.user._id;
    doc.verifiedAt = new Date();
    doc.adminNote = String(req.body?.adminNote || "");
    await doc.save();

    return res.json({ success: true, company: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "verify failed", error: err.message });
  }
});

// Admin: reject
router.post("/admin/:id/reject", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await CompanyProfile.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "not found" });

    doc.verifiedStatus = "rejected";
    doc.verifiedBy = req.user._id;
    doc.verifiedAt = new Date();
    doc.adminNote = String(req.body?.adminNote || "");
    await doc.save();

    return res.json({ success: true, company: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "reject failed", error: err.message });
  }
});

module.exports = router;
