// DriverAll-main/drivercv-backend/routes/fieldDefinitions.js

const express = require("express");
const mongoose = require("mongoose");

const FieldDefinitionImport = require("../models/FieldDefinition");
const FieldDefinition =
  (FieldDefinitionImport && (FieldDefinitionImport.FieldDefinition || FieldDefinitionImport.default)) ||
  FieldDefinitionImport;

const {
  expandCoveredKeys,
  validateRequiredKeys,
} = require("../utils/criteriaLogic");

const router = express.Router();

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------
function toStr(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeKey(v) {
  return toStr(v).trim();
}

function normalizeCountry(v, fallback) {
  const s = toStr(v).trim();
  if (!s) return fallback;
  const u = s.toUpperCase();
  if (u === "ALL") return "ALL";

  const alias = {
    TURKEY: "TR",
    TURKIYE: "TR",
    "TÜRKİYE": "TR",
    "TÜRKİYE CUMHURİYETİ": "TR",
    "TURKIYE CUMHURIYETI": "TR",
  };
  if (alias[u]) return alias[u];

  // ISO2 gibi girildiyse
  if (u.length === 2) return u;

  // Bilinmeyen değer: olduğu gibi bırak
  return u;
}

function parseKeyList(v) {
  if (Array.isArray(v)) {
    return v.map(normalizeKey).filter(Boolean);
  }
  const s = toStr(v).trim();
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizePayload(body) {
  const p = { ...(body || {}) };

  // key/label trim
  if (p.key != null) p.key = normalizeKey(p.key);
  if (p.label != null) p.label = toStr(p.label).trim();

  // country normalize
  if (p.country != null) p.country = normalizeCountry(p.country, "ALL");

  // category uyumluluğu: eski "cv" -> yeni "profile"
  if (p.category === "cv") p.category = "profile";
  if (!p.category) p.category = "profile";

  // uiType uyumluluğu: eski "checkbox" -> backend enum "boolean"
  if (p.uiType === "checkbox") p.uiType = "boolean";
  if (!p.uiType) p.uiType = "boolean";

  // showInJob -> showInJobFilter (eski frontend uyumluluğu)
  if (typeof p.showInJob === "boolean" && typeof p.showInJobFilter !== "boolean") {
    p.showInJobFilter = p.showInJob;
  }

  // covers/require string geldiyse array'e çevir
  if (p.coversKeys != null) p.coversKeys = parseKeyList(p.coversKeys);
  if (p.requiresKeys != null) p.requiresKeys = parseKeyList(p.requiresKeys);

  // validityYears string -> number/null
  if (p.validityYears != null) {
    const s = toStr(p.validityYears).trim();
    p.validityYears = s === "" ? null : Number(s);
    if (Number.isNaN(p.validityYears)) p.validityYears = null;
  }

  return p;
}

function validationDetails(err) {
  const details = {};
  if (err && err.errors) {
    for (const [k, v] of Object.entries(err.errors)) {
      details[k] = v?.message || "Invalid";
    }
  }
  return details;
}

function assertModelReady() {
  if (!FieldDefinition || typeof FieldDefinition.find !== "function") {
    // Bu hata: model dosyası yanlış export ediliyor demektir.
    const type = FieldDefinition == null ? String(FieldDefinition) : typeof FieldDefinition;
    const keys =
      FieldDefinition && typeof FieldDefinition === "object" ? Object.keys(FieldDefinition) : [];
    throw new Error(
      `FieldDefinition model import hatalı. typeof=${type} keys=${JSON.stringify(keys)}`
    );
  }
}

// ----------------------------------------------------------
// GET /api/admin/fields
// query: category, country, activeOnly
// ----------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    // Mongo bağlantı durumunu açık raporlayalım
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "MongoDB bağlantısı hazır değil. (readyState != 1)",
        readyState: mongoose.connection.readyState,
      });
    }

    assertModelReady();

    const { category, country, activeOnly } = req.query;

    const filter = {};
    if (category) filter.category = category === "cv" ? "profile" : category;
    if (country) filter.country = normalizeCountry(country, "ALL");
    if (activeOnly === "1" || activeOnly === "true") filter.active = true;

    const fields = await FieldDefinition.find(filter).sort({ key: 1 });
    res.json({ fields });
  } catch (err) {
    console.error("GET /api/admin/fields error:", err);
    res.status(500).json({
      message: "Kriter listesi alınırken sunucu hatası oluştu.",
      error: err && err.message ? err.message : String(err),
      name: err && err.name ? err.name : undefined,
    });
  }
});

// ----------------------------------------------------------
// GET /api/admin/fields/:id
// ----------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    assertModelReady();
    const field = await FieldDefinition.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ message: "Kriter bulunamadı." });
    }
    res.json({ field });
  } catch (err) {
    console.error("GET /api/admin/fields/:id error:", err);
    res.status(500).json({
      message: "Kriter detayı alınırken sunucu hatası oluştu.",
      error: err && err.message ? err.message : String(err),
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/fields
// ----------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    assertModelReady();
    const payload = normalizePayload(req.body);

    if (!payload.key || payload.key === "") {
      return res.status(400).json({ message: "Key alanı zorunludur." });
    }
    if (!payload.label || payload.label === "") {
      return res.status(400).json({ message: "Label alanı zorunludur." });
    }

    const existing = await FieldDefinition.findOne({ key: payload.key });
    if (existing) {
      return res.status(400).json({
        message: `'${payload.key}' key'i zaten sistemde kayıtlı.`,
      });
    }

    const field = new FieldDefinition(payload);
    await field.save();

    res.status(201).json({
      success: true,
      message: "Kriter başarıyla oluşturuldu.",
      field,
    });
  } catch (err) {
    console.error("POST /api/admin/fields error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Bu key zaten başka bir kriterde kullanılıyor.",
      });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Kriter oluşturulamadı. Doğrulama hataları:",
        details: validationDetails(err),
      });
    }

    res.status(500).json({
      message: "Kriter oluşturulurken sunucu hatası oluştu.",
      error: err && err.message ? err.message : String(err),
    });
  }
});

// ----------------------------------------------------------
// PUT /api/admin/fields/:id
// ----------------------------------------------------------
router.put("/:id", async (req, res) => {
  try {
    assertModelReady();
    const payload = normalizePayload(req.body);

    if (payload.key) {
      const existingWithKey = await FieldDefinition.findOne({
        key: payload.key,
        _id: { $ne: req.params.id },
      });
      if (existingWithKey) {
        return res.status(400).json({
          message: `'${payload.key}' key'i zaten başka bir kriterde kullanılıyor.`,
        });
      }
    }

    const field = await FieldDefinition.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!field) {
      return res.status(404).json({ message: "Güncellenecek kriter bulunamadı." });
    }

    res.json({
      success: true,
      message: "Kriter başarıyla güncellendi.",
      field,
    });
  } catch (err) {
    console.error("PUT /api/admin/fields/:id error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Key değişikliği başka bir kriterle çakışıyor.",
      });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Kriter güncellenemedi. Doğrulama hataları:",
        details: validationDetails(err),
      });
    }

    res.status(500).json({
      message: "Kriter güncellenirken sunucu hatası oluştu.",
      error: err && err.message ? err.message : String(err),
    });
  }
});

// ----------------------------------------------------------
// DELETE /api/admin/fields/:id
// ----------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    assertModelReady();
    const field = await FieldDefinition.findByIdAndDelete(req.params.id);

    if (!field) {
      return res.status(404).json({ message: "Silinecek kriter bulunamadı." });
    }

    res.json({
      success: true,
      message: `'${field.key}' kriteri başarıyla silindi.`,
    });
  } catch (err) {
    console.error("DELETE /api/admin/fields/:id error:", err);
    res.status(500).json({
      message: "Kriter silinirken sunucu hatası oluştu.",
      error: err && err.message ? err.message : String(err),
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/fields/expand-keys
// Body: { keys: ["SRC1", "SRC3"] }
// ----------------------------------------------------------
router.post("/expand-keys", async (req, res) => {
  try {
    assertModelReady();
    const { keys } = req.body;

    if (!Array.isArray(keys)) {
      return res.status(400).json({
        message: "keys alanı zorunludur ve dizi olmalıdır.",
      });
    }

    const fields = await FieldDefinition.find({});
    const expandedKeys = expandCoveredKeys(keys, fields);

    res.json({
      success: true,
      keys,
      expandedKeys,
    });
  } catch (err) {
    console.error("POST /api/admin/fields/expand-keys error:", err);
    res.status(500).json({
      message: "Key'ler genişletilirken sunucu hatası oluştu.",
      error: err && err.message ? err.message : String(err),
    });
  }
});

// ----------------------------------------------------------
// POST /api/admin/fields/validate-keys
// Body: { keys: ["SRC5", "SRC1"] }
// ----------------------------------------------------------
router.post("/validate-keys", async (req, res) => {
  try {
    assertModelReady();
    const { keys } = req.body;

    if (!Array.isArray(keys)) {
      return res.status(400).json({
        message: "keys alanı zorunludur ve dizi olmalıdır.",
      });
    }

    const fields = await FieldDefinition.find({});
    const issues = validateRequiredKeys(keys, fields);

    res.json({
      success: true,
      keys,
      issues,
    });
  } catch (err) {
    console.error("POST /api/admin/fields/validate-keys error:", err);
    res.status(500).json({
      message: "Key'ler doğrulanırken sunucu hatası oluştu.",
      error: err && err.message ? err.message : String(err),
    });
  }
});

module.exports = router;
