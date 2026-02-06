// PATH: DriverAll-main/drivercv-backend/routes/auth.js
// ----------------------------------------------------------
// Auth API
// POST /api/auth/register
// POST /api/auth/login
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev-driverall-secret";
const JWT_EXPIRES_IN = "7d";

// ----------------------------------------------------------
// Yardımcı: role normalize (frontend "company" gönderirse employer kabul et)
// ----------------------------------------------------------
function normalizeRole(input) {
  const r = String(input || "").trim().toLowerCase();
  if (!r) return "driver";
  if (r === "company") return "employer";
  return r;
}

// ----------------------------------------------------------
// Yardımcı: JWT üret
// ----------------------------------------------------------
function signToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ----------------------------------------------------------
// Yardımcı: hash
// ----------------------------------------------------------
async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

// ----------------------------------------------------------
// Kayıt (register)
// POST /api/auth/register
// body: { name, email, password, role? }
// ----------------------------------------------------------
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "İsim, e-posta ve şifre zorunludur.",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        message: "Bu e-posta ile zaten bir hesap var.",
      });
    }

    // Role seti (şimdilik 4 rol)
    let finalRole = normalizeRole(role);
    const allowed = new Set(["admin", "driver", "employer", "advertiser"]);
    if (!allowed.has(finalRole)) finalRole = "driver";

    // Admin kuralı (istersen sonra kaldırırız)
    if (normalizedEmail === "admin@driverall.com") {
      finalRole = "admin";
    }

    const passwordHash = await hashPassword(password);

    // Reklam veren: admin onayı gereksin
    const needsApproval = finalRole === "advertiser";

    const user = new User({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: finalRole,
      isActive: true,
      isApproved: finalRole === "admin" ? true : !needsApproval,
    });

    await user.save();

    const token = signToken(user);

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isApproved: user.isApproved,
      notes: user.notes,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error("POST /api/auth/register error:", err);
    return res.status(500).json({
      message: "Sunucu hatası (register).",
      error: err?.message || String(err),
    });
  }
});

// ----------------------------------------------------------
// Giriş (login)
// POST /api/auth/login
// body: { email, password }
// ----------------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "E-posta ve şifre zorunludur.",
      });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
    });

    if (!user) {
      return res.status(400).json({
        message: "E-posta veya şifre hatalı.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Bu hesap pasif / bloklu. Lütfen admin ile iletişime geçin.",
      });
    }

    // Reklam veren onaylı değilse giriş engeli
    if (user.role === "advertiser" && user.isApproved === false) {
      return res.status(403).json({
        message: "Hesabınız admin onayı bekliyor.",
      });
    }

    // Şifre kontrol (passwordHash)
    let isMatch = false;
    if (user.passwordHash) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } else if (user.password) {
      // Eski veri uyumluluğu varsa
      if (user.password === password) {
        isMatch = true;
        user.passwordHash = await hashPassword(password);
        await user.save();
      }
    }

    if (!isMatch) {
      return res.status(400).json({
        message: "E-posta veya şifre hatalı.",
      });
    }

    const token = signToken(user);

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isApproved: user.isApproved,
      notes: user.notes,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    return res.status(500).json({
      message: "Sunucu hatası (login).",
      error: err?.message || String(err),
    });
  }
});

module.exports = router;
