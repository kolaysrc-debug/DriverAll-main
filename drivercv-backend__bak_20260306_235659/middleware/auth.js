// PATH: DriverAll-main/drivercv-backend/middleware/auth.js
// ----------------------------------------------------------
// Auth Middleware
// - requireAuth: JWT doğrular, req.user / req.userId set eder
// - requireRoles(...roles): rol kontrolü
// NOT: Export uyumluluğu:
//   - require("../middleware/auth") => direkt middleware (requireAuth)
//   - const { requireAuth, requireRoles } = require(...) => çalışır
// ----------------------------------------------------------

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev-driverall-secret";

function extractToken(req) {
  const h = req.headers.authorization || "";
  const parts = h.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") return parts[1];
  return null;
}

async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Giriş gerekli (token yok)." });
    }

    const payload = jwt.verify(token, JWT_SECRET);

    // Geriye dönük uyumluluk: bazı yerlerde req.userId kullanılıyor olabilir
    req.userId = payload.userId;

    // DB’den kullanıcıyı çekelim (rol/isApproved güncel kalsın)
    const user = await User.findById(payload.userId).lean();
    if (!user) return res.status(401).json({ message: "Geçersiz token (kullanıcı yok)." });
    if (user.isActive === false) {
      return res.status(403).json({ message: "Bu hesap pasif / bloklu." });
    }

    // advertiser için onay zorunlu
    if (user.role === "advertiser" && user.isApproved === false) {
      return res.status(403).json({ message: "Reklamveren hesabı onay bekliyor." });
    }

    // req.user: routes/jobs.js gibi yerler bunu bekliyor
    req.user = {
      _id: String(user._id),
      role: user.role,
      email: user.email,
      name: user.name,
      isApproved: user.isApproved,
      isActive: user.isActive,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ message: "Token doğrulanamadı.", error: err.message });
  }
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ message: "Giriş gerekli." });

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Yetkisiz.", role, allowedRoles });
    }
    return next();
  };
}

// --- UYUMLU EXPORT ---
// 1) Default export: middleware fonksiyonu
module.exports = requireAuth;

// 2) Named exports: eski kullanımlar bozulmasın
module.exports.requireAuth = requireAuth;
module.exports.requireRoles = requireRoles;
module.exports.extractToken = extractToken;
