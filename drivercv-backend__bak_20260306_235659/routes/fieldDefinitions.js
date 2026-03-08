// DriverAll-main/drivercv-backend/routes/fieldDefinitions.js

const express = require("express");
const mongoose = require("mongoose");

const FieldDefinitionImport = require("../models/FieldDefinition");
const FieldDefinition =
  (FieldDefinitionImport && (FieldDefinitionImport.FieldDefinition || FieldDefinitionImport.default)) ||
  FieldDefinitionImport;

const FieldGroup = require("../models/FieldGroup");
const DeletedDefaultField = require("../models/DeletedDefaultField");

function slugifyKey(input) {
  return String(input || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const {
  expandCoveredKeys,
  validateRequiredKeys,
} = require("../utils/criteriaLogic");

const router = express.Router();

const DEFAULT_FIELDS = [
  {
    key: "EXPERIENCE_YEARS",
    label: "Deneyim (Yıl)",
    category: "profile",
    country: "ALL",
    fieldType: "number",
    uiType: "number",
    required: false,
    active: true,
    showInCv: true,
    showInJobFilter: true,
    groupLabel: "Genel",
  },
  {
    key: "HAS_PSYCHOTECHNIC",
    label: "Psikoteknik Belgesi",
    category: "profile",
    country: "TR",
    fieldType: "boolean",
    uiType: "boolean",
    required: false,
    active: true,
    showInCv: true,
    showInJobFilter: true,
    groupLabel: "Belgeler",
    hasExpiry: true,
    requiresIssueDate: false,
    expiryMode: "durationFromIssue",
    durationYearsFromIssue: 5,
  },
  {
    key: "HAS_ADR",
    label: "ADR Belgesi",
    category: "profile",
    country: "TR",
    fieldType: "boolean",
    uiType: "boolean",
    required: false,
    active: true,
    showInCv: true,
    showInJobFilter: true,
    groupLabel: "Belgeler",
    hasExpiry: true,
    requiresIssueDate: false,
    expiryMode: "durationFromIssue",
    durationYearsFromIssue: 5,
  },
  {
    key: "LICENCE_B",
    label: "Ehliyet B",
    category: "profile",
    country: "TR",
    fieldType: "boolean",
    uiType: "boolean",
    required: false,
    active: true,
    showInCv: true,
    showInJobFilter: true,
    groupLabel: "Ehliyet",
  },
  {
    key: "LICENCE_C",
    label: "Ehliyet C",
    category: "profile",
    country: "TR",
    fieldType: "boolean",
    uiType: "boolean",
    required: false,
    active: true,
    showInCv: true,
    showInJobFilter: true,
    groupLabel: "Ehliyet",
  },
  {
    key: "LICENCE_CE",
    label: "Ehliyet CE",
    category: "profile",
    country: "TR",
    fieldType: "boolean",
    uiType: "boolean",
    required: false,
    active: true,
    showInCv: true,
    showInJobFilter: true,
    groupLabel: "Ehliyet",
  },
  {
    key: "SRC1_TR",
    label: "SRC1 (Uluslararası Yolcu)",
    category: "profile",
    country: "TR",
    fieldType: "boolean",
    uiType: "boolean",
    required: false,
    active: true,
    showInCv: true,
    showInJobFilter: true,
    groupLabel: "SRC",
    coversKeys: ["SRC2_TR"],
  },
  {
    key: "SRC2_TR",
    label: "SRC2 (Yurtiçi Yolcu)",
    category: "profile",
    country: "TR",
    fieldType: "boolean",
    uiType: "boolean",
    required: false,
    active: true,
    showInCv: true,
    showInJobFilter: true,
    groupLabel: "SRC",
  },
  {
    key: "SRC3_TR",
    label: "SRC3 (Uluslararası Eşya)",
    category: "profile",
    country: "TR",
    fieldType: "boolean",
    uiType: "boolean",
    required: false,
    active: true,
    showInCv: true,
    showInJobFilter: true,
    groupLabel: "SRC",
    coversKeys: ["SRC4_TR"],
  },
  {
    key: "SRC4_TR",
    label: "SRC4 (Yurtiçi Eşya)",
    category: "profile",
    country: "TR",
    fieldType: "boolean",
    uiType: "boolean",
    required: false,
    active: true,
    showInCv: true,
    showInJobFilter: true,
    groupLabel: "SRC",
  },

  {
    key: "SRC5_TR",
    label: "SRC5 (Tehlikeli Madde)",
    category: "profile",
    country: "TR",
    fieldType: "boolean",
    uiType: "boolean",
    required: false,
    active: true,
    showInCv: true,
    showInJobFilter: true,
    groupLabel: "SRC",
  },

  {
    key: "HAS_MYK",
    label: "MYK Belgesi",
    category: "profile",
    country: "TR",
    fieldType: "boolean",
    uiType: "boolean",
    required: false,
    active: true,
    showInCv: true,
    showInJobFilter: true,
    groupLabel: "Belgeler",
  },
];

function applyFilterToDefaultFields(filter) {
  const category = filter?.category;
  const country = filter?.country;
  const activeOnly = filter?.activeOnly;

  return DEFAULT_FIELDS.filter((f) => {
    if (category && f.category !== category) return false;
    if (country && f.country !== "ALL" && f.country !== country) return false;
    if (activeOnly && f.active !== true) return false;
    return true;
  });
}

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

    const { category, country, activeOnly, groupKey } = req.query;

    const filter = {};
    if (category) filter.category = category === "cv" ? "profile" : category;
    if (country) filter.country = normalizeCountry(country, "ALL");
    if (activeOnly === "1" || activeOnly === "true") filter.active = true;
    if (groupKey) filter.groupKey = String(groupKey || "").trim();

    const fields = await FieldDefinition.find(filter).sort({ key: 1 });
    if (!fields || fields.length === 0) {
      const disableDefaultFields =
        String(process.env.DISABLE_DEFAULT_FIELDS || "").trim() === "1" ||
        String(process.env.DISABLE_DEFAULT_FIELDS || "").trim().toLowerCase() === "true";
      if (disableDefaultFields) {
        return res.json({ fields: [] });
      }

      let fallback = applyFilterToDefaultFields({
        category: filter.category,
        country: filter.country,
        activeOnly: !!filter.active,
      });

      try {
        const deleted = await DeletedDefaultField.find({})
          .select({ key: 1 })
          .lean();
        const deletedKeys = new Set(
          (deleted || [])
            .map((x) => String(x?.key || "").trim())
            .filter(Boolean)
        );
        fallback = (fallback || []).filter((f) => !deletedKeys.has(String(f?.key || "").trim()));
      } catch {
        // ignore tombstone errors, fallback still works
      }

      fallback = (fallback || []).sort((a, b) =>
        String(a.key).localeCompare(String(b.key))
      );
      return res.json({ fields: fallback });
    }

    return res.json({ fields });
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
    const before = await FieldDefinition.findById(req.params.id).lean();
    if (!before) {
      return res.status(404).json({ message: "Güncellenecek kriter bulunamadı." });
    }
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

    const syncCombos = [];
    const beforeKey = slugifyKey(before?.key);
    const afterKey = slugifyKey(field?.key);
    const beforeGroupKey = String(before?.groupKey || "").trim();
    const afterGroupKey = String(field?.groupKey || "").trim();

    if (beforeKey) syncCombos.push({ groupKey: beforeGroupKey, nodeKey: beforeKey });
    if (afterKey) syncCombos.push({ groupKey: afterGroupKey, nodeKey: afterKey });

    const unique = new Map();
    for (const x of syncCombos) {
      unique.set(`${x.groupKey}::${x.nodeKey}`, x);
    }

    for (const { groupKey, nodeKey } of unique.values()) {
      if (!nodeKey) continue;
      const query = groupKey
        ? { groupKey, "nodes.key": nodeKey }
        : { "nodes.key": nodeKey };
      await FieldGroup.updateMany(
        query,
        { $set: { "nodes.$[n].label": field.label } },
        { arrayFilters: [{ "n.key": nodeKey }] }
      );
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

    // Groups cleanup:
    // - node'u tamamen kaldır
    // - diğer node'larda parentKey / requiredWith / coverage / equivalentKeys referanslarını temizle
    try {
      const rawKey = String(field.key || "").trim();
      const nodeKey = slugifyKey(rawKey);
      const targetKeys = Array.from(new Set([rawKey, nodeKey].filter(Boolean)));
      if (targetKeys.length > 0) {
        // 1) Node'u pull ile sil (tüm gruplardan)
        await FieldGroup.updateMany(
          { "nodes.key": { $in: targetKeys } },
          { $pull: { nodes: { key: { $in: targetKeys } } } }
        );

        // 2) Parent'ı silinen node olan çocukları root'a çek (level 0)
        await FieldGroup.updateMany(
          { "nodes.parentKey": { $in: targetKeys } },
          { $set: { "nodes.$[n].parentKey": null, "nodes.$[n].level": 0 } },
          { arrayFilters: [{ "n.parentKey": { $in: targetKeys } }] }
        );

        // 3) requiredWith/coverage/equivalentKeys içinde bu key varsa kaldır
        await FieldGroup.updateMany(
          { "nodes.requiredWith": { $in: targetKeys } },
          { $pull: { "nodes.$[n].requiredWith": { $in: targetKeys } } },
          { arrayFilters: [{ "n.requiredWith": { $in: targetKeys } }] }
        );

        await FieldGroup.updateMany(
          { "nodes.coverage": { $in: targetKeys } },
          { $pull: { "nodes.$[n].coverage": { $in: targetKeys } } },
          { arrayFilters: [{ "n.coverage": { $in: targetKeys } }] }
        );

        await FieldGroup.updateMany(
          { "nodes.equivalentKeys": { $in: targetKeys } },
          { $pull: { "nodes.$[n].equivalentKeys": { $in: targetKeys } } },
          { arrayFilters: [{ "n.equivalentKeys": { $in: targetKeys } }] }
        );
      }
    } catch (e) {
      console.warn("[fields.delete] FieldGroup cleanup failed:", e?.message || e);
    }

    // Tombstone default fields so they are not reinserted by bootstrap
    try {
      const deletedKey = String(field.key || "").trim();
      if (deletedKey) {
        const isDefault = DEFAULT_FIELDS.some(
          (x) => String(x?.key || "").trim() === deletedKey
        );
        if (isDefault) {
          await DeletedDefaultField.updateOne(
            { key: deletedKey },
            { $setOnInsert: { key: deletedKey, deletedAt: new Date() } },
            { upsert: true }
          );
        }
      }
    } catch (e) {
      console.warn("[fields.delete] DeletedDefaultField tombstone failed:", e?.message || e);
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

router.DEFAULT_FIELDS = DEFAULT_FIELDS;
router.applyFilterToDefaultFields = applyFilterToDefaultFields;

module.exports = router;
