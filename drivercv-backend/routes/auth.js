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
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const Role = require("../models/Role");
const { notifyWelcome, sendMail } = require("../services/emailService");

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

function safeStr(v) {
  return String(v ?? "").trim();
}

function normEmail(v) {
  return safeStr(v).toLowerCase();
}

function normPhone(v) {
  const raw = safeStr(v);
  if (!raw) return "";
  return raw.replace(/\s+/g, "");
}

function parseAllowlistEnv(raw) {
  const s = String(raw || "").trim();
  if (!s) return [];
  return s
    .split(",")
    .map((x) => String(x || "").trim())
    .filter(Boolean);
}

function isAllowlisted({ email, phone }) {
  const emails = parseAllowlistEnv(process.env.DRIVERALL_BETA_ALLOWLIST_EMAILS);
  const phones = parseAllowlistEnv(process.env.DRIVERALL_BETA_ALLOWLIST_PHONES);

  if (emails.length === 0 && phones.length === 0) return true;

  const em = normEmail(email);
  const ph = normPhone(phone);

  if (em && emails.map((x) => String(x).toLowerCase()).includes(em)) return true;
  if (ph && phones.map((x) => normPhone(x)).includes(ph)) return true;
  return false;
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
});

function normalizeSubRoles(input) {
  const allowed = new Set(["driver", "courier", "forklift", "shuttle"]);
  const arr = Array.isArray(input) ? input : [];
  const out = arr
    .map((x) => String(x || "").trim().toLowerCase())
    .filter((x) => allowed.has(x));
  return Array.from(new Set(out));
}

let _candidateSubRoleCache = {
  loadedAtMs: 0,
  keys: /** @type {string[]} */ ([]),
};

async function getCandidateSubRoleKeys() {
  const now = Date.now();
  // 60s TTL
  if (_candidateSubRoleCache.keys.length > 0 && now - _candidateSubRoleCache.loadedAtMs < 60_000) {
    return _candidateSubRoleCache.keys;
  }

  const roles = await Role.find({ category: "candidate", level: { $gt: 0 }, isActive: true })
    .sort({ sortOrder: 1, level: 1, name: 1 })
    .select({ name: 1 })
    .lean();

  const keys = (roles || [])
    .map((r) => String(r?.name || "").trim().toLowerCase())
    .filter((x) => !!x);

  _candidateSubRoleCache = {
    loadedAtMs: now,
    keys: Array.from(new Set(keys)),
  };

  return _candidateSubRoleCache.keys;
}

async function normalizeSubRolesDynamic(input) {
  const arr = Array.isArray(input) ? input : [];
  const cleaned = arr.map((x) => String(x || "").trim().toLowerCase()).filter((x) => !!x);

  try {
    const allowedKeys = new Set(await getCandidateSubRoleKeys());
    return Array.from(new Set(cleaned.filter((x) => allowedKeys.has(x))));
  } catch {
    // DB hatasında fallback: eski allowlist
    return normalizeSubRoles(cleaned);
  }
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

    // Hoş geldin emaili
    notifyWelcome({ to: user.email, userName: user.name, role: user.role }).catch(() => {});

    return res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error("POST /api/auth/register error:", err);
    return res.status(500).json({
      message: "Sunucu hatası (register).",
      error: err?.message || String(err),
    });
  }
});

// Minimal kayıt (mobile-first)
// POST /api/auth/register-minimal
// body: { name, email, phone, cityCode, districtCode, role?, subRoles? }
router.post("/register-minimal", authLimiter, async (req, res) => {
  try {
    const { name, email, phone, cityCode, districtCode, role, subRoles } = req.body || {};

    const nm = safeStr(name);
    const em = normEmail(email);
    const ph = normPhone(phone);
    const cc = safeStr(cityCode);
    const dc = safeStr(districtCode);
    const sr = await normalizeSubRolesDynamic(subRoles);

    if (!isAllowlisted({ email: em, phone: ph })) {
      return res.status(403).json({ message: "Kapalı beta: davet gerekli." });
    }

    if (!nm || !em || !ph) {
      return res.status(400).json({ message: "Ad, e-posta ve telefon zorunludur." });
    }

    const existingEmail = await User.findOne({ email: em });
    if (existingEmail) {
      return res.status(400).json({ message: "Bu e-posta ile zaten bir hesap var." });
    }

    const existingPhone = await User.findOne({ phone: ph });
    if (existingPhone) {
      return res.status(400).json({ message: "Bu telefon ile zaten bir hesap var." });
    }

    let finalRole = normalizeRole(role);
    const allowedRoles = new Set(["admin", "driver", "employer", "advertiser"]);
    if (!allowedRoles.has(finalRole)) finalRole = "driver";

    if (em === "admin@driverall.com") {
      finalRole = "admin";
    }

    const generatedPassword = `da_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    const passwordHash = await hashPassword(generatedPassword);

    const needsApproval = finalRole === "advertiser";

    const user = new User({
      name: nm,
      email: em,
      phone: ph,
      cityCode: cc,
      districtCode: dc,
      subRoles: sr,
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
      phone: user.phone,
      cityCode: user.cityCode,
      districtCode: user.districtCode,
      subRoles: user.subRoles,
      role: user.role,
      isActive: user.isActive,
      isApproved: user.isApproved,
      notes: user.notes,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error("POST /api/auth/register-minimal error:", err);
    return res.status(500).json({
      message: "Sunucu hatası (register-minimal).",
      error: err?.message || String(err),
    });
  }
});

// ----------------------------------------------------------
// Giriş (login)
// POST /api/auth/login
// body: { email, password }
// ----------------------------------------------------------
router.post("/login", loginLimiter, async (req, res) => {
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

// ----------------------------------------------------------
// Minimal giriş (password'suz)
// POST /api/auth/login-minimal
// body: { email, phone }
// ----------------------------------------------------------
router.post("/login-minimal", loginLimiter, async (req, res) => {
  try {
    const { email, phone } = req.body || {};

    const em = normEmail(email);
    const ph = normPhone(phone);

    if (!em || !ph) {
      return res.status(400).json({
        message: "E-posta ve telefon zorunludur.",
      });
    }

    if (!isAllowlisted({ email: em, phone: ph })) {
      return res.status(403).json({
        message: "Kapalı beta: davet gerekli.",
      });
    }

    const user = await User.findOne({ email: em });
    if (!user) {
      return res.status(400).json({
        message: "E-posta veya telefon hatalı.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Bu hesap pasif / bloklu. Lütfen admin ile iletişime geçin.",
      });
    }

    if (user.role === "advertiser" && user.isApproved === false) {
      return res.status(403).json({
        message: "Hesabınız admin onayı bekliyor.",
      });
    }

    const storedPhone = normPhone(user.phone);
    if (!storedPhone || storedPhone !== ph) {
      return res.status(400).json({
        message: "E-posta veya telefon hatalı.",
      });
    }

    const token = signToken(user);

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      cityCode: user.cityCode,
      districtCode: user.districtCode,
      subRoles: user.subRoles,
      role: user.role,
      isActive: user.isActive,
      isApproved: user.isApproved,
      notes: user.notes,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("POST /api/auth/login-minimal error:", err);
    return res.status(500).json({
      message: "Sunucu hatası (login-minimal).",
      error: err?.message || String(err),
    });
  }
});

// ----------------------------------------------------------
// POST /api/auth/forgot-password
// body: { email }
// ----------------------------------------------------------
router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "E-posta zorunludur." });

    const user = await User.findOne({ email });
    // Güvenlik: kullanıcı bulunamasa bile aynı yanıtı ver
    if (!user) return res.json({ success: true, message: "Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi." });

    // Token oluştur (6 haneli kod + hash)
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const resetToken = crypto.createHash("sha256").update(resetCode).digest("hex");

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 dakika
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    await sendMail({
      to: user.email,
      subject: "DriverAll — Şifre Sıfırlama",
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
          <h2 style="color:#3b82f6">Şifre Sıfırlama</h2>
          <p>Merhaba <strong>${user.name || "Kullanıcı"}</strong>,</p>
          <p>Şifre sıfırlama kodunuz:</p>
          <div style="text-align:center;margin:24px 0">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#10b981;background:#0f172a;padding:12px 24px;border-radius:12px;display:inline-block">${resetCode}</span>
          </div>
          <p>Bu kod <strong>15 dakika</strong> geçerlidir.</p>
          <p>Şifre sıfırlama sayfası: <a href="${frontendUrl}/reset-password" style="color:#3b82f6">${frontendUrl}/reset-password</a></p>
          <p style="font-size:12px;color:#94a3b8;margin-top:16px">Bu isteği siz yapmadıysanız, bu e-postayı görmezden gelin.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
          <p style="font-size:12px;color:#94a3b8">DriverAll • Sürücü Platformu</p>
        </div>
      `,
    }).catch(() => {});

    return res.json({ success: true, message: "Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi." });
  } catch (err) {
    console.error("POST /api/auth/forgot-password error:", err);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
});

// ----------------------------------------------------------
// POST /api/auth/reset-password
// body: { email, code, newPassword }
// ----------------------------------------------------------
router.post("/reset-password", authLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || "").toLowerCase().trim();
    const code = String(req.body?.code || "").trim();
    const newPassword = req.body?.newPassword;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "E-posta, kod ve yeni şifre zorunludur." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Şifre en az 6 karakter olmalıdır." });
    }

    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    const user = await User.findOne({
      email,
      passwordResetToken: hashedCode,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Kod geçersiz veya süresi dolmuş." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return res.json({ success: true, message: "Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz." });
  } catch (err) {
    console.error("POST /api/auth/reset-password error:", err);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
});

module.exports = router;
