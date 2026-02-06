// =========================
// FILE: drivercv-backend/routes/cv.js
// =========================

const express = require("express");
const jwt = require("jsonwebtoken");
const Cv = require("../models/Cv");
const FieldDefinition = require("../models/FieldDefinition");
const { applyCriteriaRulesToValues } = require("../utils/criteriaLogic");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-driverall-secret";

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "Yetkisiz: token bulunamadı." });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Yetkisiz: token formatı hatalı." });
  }

  const token = parts[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT doğrulama hatası:", err);
      return res.status(401).json({ message: "Yetkisiz: token geçersiz." });
    }

    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) {
      return res.status(401).json({ message: "Yetkisiz: kullanıcı bilgisi yok." });
    }

    req.userId = userId;
    next();
  });
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const cv = await Cv.findOne({ userId: req.userId });

    if (!cv) {
      return res.json({
        cv: {
          userId: req.userId,
          values: {},
        },
      });
    }

    res.json({ cv });
  } catch (err) {
    console.error("GET /api/cv hata:", err);
    res.status(500).json({
      message: "CV bilgisi alınırken bir hata oluştu.",
      error: err.message,
    });
  }
});

router.put("/", authMiddleware, async (req, res) => {
  try {
    const { values } = req.body;

    if (!values || typeof values !== "object") {
      return res.status(400).json({
        message: "Geçersiz veri: 'values' alanı zorunludur.",
      });
    }

    const fields = await FieldDefinition.find({ active: { $ne: false } }).lean();

    const { values: normalizedValues, addedKeys } = applyCriteriaRulesToValues(values, fields);

    const updated = await Cv.findOneAndUpdate(
      { userId: req.userId },
      { values: normalizedValues },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ cv: updated, derived: { addedKeys } });
  } catch (err) {
    console.error("PUT /api/cv hata:", err);
    res.status(500).json({
      message: "CV bilgisi kaydedilirken bir hata oluştu.",
      error: err.message,
    });
  }
});

module.exports = router;

// =========================
// END FILE: drivercv-backend/routes/cv.js
// =========================
