// PATH: DriverAll-main/drivercv-backend/middleware/subUserAuth.js
// ----------------------------------------------------------
// SubUser Auth Middleware
// - requireSubUserAuth: JWT doğrular, req.subUser / req.parentUserId set eder
// ----------------------------------------------------------

const jwt = require("jsonwebtoken");
const SubUser = require("../models/SubUser");

const JWT_SECRET = process.env.JWT_SECRET || "dev-driverall-secret";

function extractToken(req) {
  const h = req.headers.authorization || "";
  const parts = h.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") return parts[1];
  return null;
}

async function requireSubUserAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Giriş gerekli (token yok)." });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || payload.kind !== "subuser" || !payload.subUserId) {
      return res.status(401).json({ message: "Geçersiz token (subuser değil)." });
    }

    const subUser = await SubUser.findById(payload.subUserId).lean();
    if (!subUser) return res.status(401).json({ message: "Geçersiz token (alt kullanıcı yok)." });

    if (subUser.status?.isApproved === false) {
      return res.status(403).json({ message: "Alt kullanıcı onay bekliyor." });
    }
    if (subUser.status?.isActive === false) {
      return res.status(403).json({ message: "Alt kullanıcı pasif." });
    }

    req.subUser = {
      _id: String(subUser._id),
      parentUser: String(subUser.parentUser),
      role: String(subUser.role),
      email: subUser.email,
      name: subUser.name,
      assignedBranches: Array.isArray(subUser.assignedBranches) ? subUser.assignedBranches : [],
      assignedUnits: Array.isArray(subUser.assignedUnits) ? subUser.assignedUnits : [],
      permissions: Array.isArray(subUser.permissions) ? subUser.permissions : [],
      approvalSettings: subUser.approvalSettings || { requireOwnerApproval: true, requireActionApproval: false },
    };

    req.parentUserId = String(subUser.parentUser);

    return next();
  } catch (err) {
    return res.status(401).json({ message: "Token doğrulanamadı.", error: err.message });
  }
}

module.exports = { requireSubUserAuth, extractToken };
