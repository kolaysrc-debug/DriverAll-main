// PATH: DriverAll-main/drivercv-backend/routes/users.js
// ----------------------------------------------------------
// User Self Service API
// - GET  /api/users/me
// - PUT  /api/users/me   (employer firma bilgileri vs.)
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const User = require("../models/User");
const { requireAuth, requireRoles } = require("../middleware/auth");

// ----------------------------------------------------------
// GET /api/users/me
// ----------------------------------------------------------
router.get("/me", requireAuth, async (req, res) => {
  try {
    const u = await User.findById(req.user._id).lean();
    if (!u) return res.status(404).json({ success: false, message: "user not found" });

    return res.json({
      success: true,
      user: {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        isApproved: u.isApproved,

        companyName: u.companyName || "",
        companyLegalName: u.companyLegalName || "",
        companyTaxNo: u.companyTaxNo || "",
        companyPhone: u.companyPhone || "",
        companyWebsite: u.companyWebsite || "",
        companyCountry: u.companyCountry || "TR",
        companyCityCode: u.companyCityCode || "",
        companyDistrictCode: u.companyDistrictCode || "",
        companyAddressLine: u.companyAddressLine || "",
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "me failed", error: err.message });
  }
});

// ----------------------------------------------------------
// PUT /api/users/me
// (driver da bazı alanları ileride kullanabilir ama şimdilik employer/admin odak)
// ----------------------------------------------------------
router.put("/me", requireAuth, requireRoles("employer", "admin"), async (req, res) => {
  try {
    const body = req.body || {};
    const u = await User.findById(req.user._id);
    if (!u) return res.status(404).json({ success: false, message: "user not found" });

    // Firma alanları
    if (body.companyName != null) u.companyName = String(body.companyName || "").trim();
    if (body.companyLegalName != null) u.companyLegalName = String(body.companyLegalName || "").trim();
    if (body.companyTaxNo != null) u.companyTaxNo = String(body.companyTaxNo || "").trim();
    if (body.companyPhone != null) u.companyPhone = String(body.companyPhone || "").trim();
    if (body.companyWebsite != null) u.companyWebsite = String(body.companyWebsite || "").trim();

    if (body.companyCountry != null) u.companyCountry = String(body.companyCountry || "TR").trim();
    if (body.companyCityCode != null) u.companyCityCode = String(body.companyCityCode || "").trim();
    if (body.companyDistrictCode != null) u.companyDistrictCode = String(body.companyDistrictCode || "").trim();
    if (body.companyAddressLine != null) u.companyAddressLine = String(body.companyAddressLine || "").trim();

    await u.save();

    return res.json({
      success: true,
      user: {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        companyName: u.companyName || "",
        companyLegalName: u.companyLegalName || "",
        companyTaxNo: u.companyTaxNo || "",
        companyPhone: u.companyPhone || "",
        companyWebsite: u.companyWebsite || "",
        companyCountry: u.companyCountry || "TR",
        companyCityCode: u.companyCityCode || "",
        companyDistrictCode: u.companyDistrictCode || "",
        companyAddressLine: u.companyAddressLine || "",
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "update me failed", error: err.message });
  }
});

module.exports = router;
