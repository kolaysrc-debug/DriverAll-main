// PATH: DriverAll-main/drivercv-backend/routes/uploads.js
// ----------------------------------------------------------
// File Upload API (Avatar + Document)
// - POST /api/uploads/avatar    → profil fotoğrafı (auto-resize 400x400)
// - POST /api/uploads/document  → belge dosyası (PDF/image)
// ----------------------------------------------------------

const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const Profile = require("../models/Profile");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-driverall-secret";

// Klasörleri oluştur
const AVATAR_DIR = path.join(__dirname, "..", "uploads", "avatars");
const DOCS_DIR = path.join(__dirname, "..", "uploads", "documents");
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ success: false, message: "Yetkisiz" });
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ success: false, message: "Token formatı hatalı" });
  jwt.verify(parts[1], JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ success: false, message: "Token geçersiz" });
    req.userId = decoded.userId || decoded.id || decoded._id;
    if (!req.userId) return res.status(401).json({ success: false, message: "Kullanıcı bilgisi yok" });
    next();
  });
}

// Multer: memory storage (sharp ile işlemek için)
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i;
    const extOk = allowed.test(path.extname(file.originalname));
    const mimeOk = file.mimetype.startsWith("image/");
    cb(null, extOk && mimeOk);
  },
});

// Multer: document upload (disk storage)
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DOCS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${req.userId}_${Date.now()}${ext}`;
    cb(null, unique);
  },
});

const docUpload = multer({
  storage: docStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // max 15MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|jpg|jpeg|png|gif|webp|doc|docx)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

// ----------------------------------------------------------
// POST /api/uploads/avatar
// Otomatik resize: max 400x400px, JPEG, quality 85
// ----------------------------------------------------------
router.post("/avatar", authMiddleware, avatarUpload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Dosya yüklenmedi veya format hatalı." });

    const filename = `${req.userId}_${Date.now()}.jpg`;
    const outputPath = path.join(AVATAR_DIR, filename);

    await sharp(req.file.buffer)
      .resize(400, 400, { fit: "cover", position: "centre" })
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    const avatarUrl = `/uploads/avatars/${filename}`;

    // Profile güncelle
    await Profile.findOneAndUpdate(
      { user: req.userId },
      { avatarUrl },
      { upsert: false }
    );

    return res.json({ success: true, avatarUrl });
  } catch (err) {
    console.error("Avatar upload failed:", err);
    return res.status(500).json({ success: false, message: "Avatar yüklenemedi.", error: err.message });
  }
});

// ----------------------------------------------------------
// POST /api/uploads/document
// body: fieldKey (hangi belge alanı)
// ----------------------------------------------------------
router.post("/document", authMiddleware, docUpload.single("document"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Dosya yüklenmedi veya format hatalı." });

    const fileUrl = `/uploads/documents/${req.file.filename}`;
    const fieldKey = String(req.body?.fieldKey || "").trim();

    return res.json({
      success: true,
      fileUrl,
      fieldKey,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    console.error("Document upload failed:", err);
    return res.status(500).json({ success: false, message: "Belge yüklenemedi.", error: err.message });
  }
});

module.exports = router;
