// PATH: DriverAll-main/drivercv-backend/routes/subAuth.js
// ----------------------------------------------------------
// SubUser Auth API
// Base: /api/subauth
// - POST /api/subauth/login
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const SubUser = require("../models/SubUser");

const JWT_SECRET = process.env.JWT_SECRET || "dev-driverall-secret";
const JWT_EXPIRES_IN = "7d";

function signSubUserToken(subUser) {
  return jwt.sign(
    {
      kind: "subuser",
      subUserId: String(subUser._id),
      parentUserId: String(subUser.parentUser),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "E-posta ve şifre zorunludur." });
    }

    const subUser = await SubUser.findOne({ email: String(email).toLowerCase().trim() });
    if (!subUser) {
      return res.status(400).json({ message: "E-posta veya şifre hatalı." });
    }

    const ok = await bcrypt.compare(String(password), String(subUser.passwordHash || ""));
    if (!ok) {
      return res.status(400).json({ message: "E-posta veya şifre hatalı." });
    }

    if (subUser.status?.isApproved === false) {
      return res.status(403).json({ message: "Alt kullanıcı onay bekliyor." });
    }
    if (subUser.status?.isActive === false) {
      return res.status(403).json({ message: "Alt kullanıcı pasif." });
    }

    const token = signSubUserToken(subUser);

    const safe = {
      _id: subUser._id,
      parentUser: subUser.parentUser,
      name: subUser.name,
      email: subUser.email,
      role: subUser.role,
      assignedBranches: subUser.assignedBranches || [],
      assignedUnits: subUser.assignedUnits || [],
      approvalSettings: subUser.approvalSettings || { requireOwnerApproval: true, requireActionApproval: false },
      status: subUser.status,
    };

    return res.json({ token, subUser: safe });
  } catch (err) {
    console.error("POST /api/subauth/login error:", err);
    return res.status(500).json({ message: "Sunucu hatası (subuser login).", error: err?.message || String(err) });
  }
});

module.exports = router;
