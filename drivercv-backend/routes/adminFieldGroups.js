// drivercv-backend/routes/adminFieldGroups.js
const express = require("express");
const FieldGroup = require("../models/FieldGroup");
const FieldDefinition = require("../models/FieldDefinition");

const router = express.Router();

function slugifyKey(input) {
  return String(input || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeStringArray(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((x) => String(x || "").trim()).filter(Boolean);
  if (typeof input === "string")
    return input.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}

function toApiNode(n) {
  return {
    key: n.key,
    label: n.label,
    parentKey: n.parentKey || "",
    level: Number.isFinite(n.level) ? n.level : 0,
    sortOrder: Number.isFinite(n.sortOrder) ? n.sortOrder : 0,
    active: n.active !== false,
    zones: normalizeStringArray(n.zones || ["TR"]), 
    coverage: normalizeStringArray(n.coverage),
    requiredWith: normalizeStringArray(n.requiredWith),
    // MOTOR ALANLARI EKLENDİ
    validityYears: n.validityYears,
    maxAgeLimit: n.maxAgeLimit,
    alertStartMonth: n.alertStartMonth,
    alertFrequency: n.alertFrequency,
  };
}

function toApiGroup(g) {
  return {
    _id: g._id,
    groupKey: g.groupKey,
    groupLabel: g.groupLabel,
    country: g.country || "ALL",
    active: g.active !== false,
    // GRUP VARSAYILANLARI EKLENDİ
    defaultValidityYears: g.defaultValidityYears,
    defaultMaxAgeLimit: g.defaultMaxAgeLimit,
    defaultAlertStartMonth: g.defaultAlertStartMonth,
    defaultAlertFrequency: g.defaultAlertFrequency,
    nodes: (g.nodes || []).map(toApiNode),
  };
}

function recomputeLevels(nodes) {
  const byKey = new Map();
  for (const n of nodes) byKey.set(n.key, n);
  const roots = [];
  for (const n of nodes) {
    const pk = (n.parentKey || "").trim();
    if (!pk || !byKey.has(pk)) {
      n.parentKey = "";
      n.level = 0;
      roots.push(n);
    }
  }
  const queue = [...roots];
  while (queue.length) {
    const parent = queue.shift();
    for (const child of nodes) {
      if ((child.parentKey || "").trim() === parent.key) {
        child.level = (parent.level || 0) + 1;
        queue.push(child);
      }
    }
  }
}

async function upsertFieldFromNode(group, node) {
  const key = String(node.key || "").trim();
  if (!key) return;
  const label = String(node.label || key).trim() || key;

  const update = {
    key,
    label,
    groupKey: group.groupKey,
    groupLabelOverride: group.groupLabel,
    country: group.country || "ALL",
    active: node.active !== false,
    valueType: "boolean",
    category: "cv",
    showInCv: true,
    zones: normalizeStringArray(node.zones || ["TR"]),
    coversKeys: normalizeStringArray(node.coverage),
    requiresKeys: normalizeStringArray(node.requiredWith)
  };

  await FieldDefinition.findOneAndUpdate({ key }, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });
}

async function deactivateFieldByKey(key) {
  const k = String(key || "").trim();
  if (!k) return;
  await FieldDefinition.findOneAndUpdate({ key: k }, { active: false, showInCv: false }, { new: true });
}

// ENDPOINTS
router.get("/", async (req, res) => {
  try {
    const groups = await FieldGroup.find({}).sort({ groupKey: 1 }).lean();
    res.json({ groups: groups.map(toApiGroup) });
  } catch (err) {
    res.status(500).json({ message: "Hata", error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const groupKey = slugifyKey(req.body.groupKey);
    const groupLabel = String(req.body.groupLabel || "").trim();
    if (!groupKey || !groupLabel) return res.status(400).json({ message: "Eksik bilgi." });
    const group = await FieldGroup.create({ groupKey, groupLabel, nodes: [] });
    res.status(201).json({ group: toApiGroup(group.toObject()) });
  } catch (err) {
    res.status(500).json({ message: "Hata", error: err.message });
  }
});

// GRUP GÜNCELLEME - TÜM ALANLAR KORUNDU VE YENİLER EKLENDİ
router.put("/:id", async (req, res) => {
  try {
    const updateData = {
      groupLabel: req.body.groupLabel,
      active: req.body.active !== false,
      // Yeni Motor Alanları:
      defaultValidityYears: req.body.defaultValidityYears,
      defaultMaxAgeLimit: req.body.defaultMaxAgeLimit,
      defaultAlertStartMonth: req.body.defaultAlertStartMonth,
      defaultAlertFrequency: req.body.defaultAlertFrequency
    };
    const group = await FieldGroup.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ group: toApiGroup(group.toObject()) });
  } catch (err) {
    res.status(500).json({ message: "Hata", error: err.message });
  }
});

router.post("/:id/nodes", async (req, res) => {
  try {
    const group = await FieldGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Grup yok." });

    const key = slugifyKey(req.body.key);
    const newNode = {
      key,
      label: req.body.label,
      parentKey: slugifyKey(req.body.parentKey),
      zones: normalizeStringArray(req.body.zones || ["TR"]),
      coverage: normalizeStringArray(req.body.coverage || req.body.coversKeys),
      requiredWith: normalizeStringArray(req.body.requiredWith || req.body.requiresKeys),
      active: true,
      // Yeni alanlar insert anında da gelebilir
      validityYears: req.body.validityYears,
      maxAgeLimit: req.body.maxAgeLimit,
      alertStartMonth: req.body.alertStartMonth,
      alertFrequency: req.body.alertFrequency
    };

    group.nodes.push(newNode);
    recomputeLevels(group.nodes);
    await group.save();
    await upsertFieldFromNode(group, newNode);

    res.status(201).json({ group: toApiGroup(group.toObject()) });
  } catch (err) {
    res.status(500).json({ message: "Hata", error: err.message });
  }
});

// NODE GÜNCELLEME - TÜM ALANLAR KORUNDU VE YENİLER EKLENDİ
router.put("/:id/nodes/:nodeKey", async (req, res) => {
  try {
    const group = await FieldGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Grup yok." });

    const idx = group.nodes.findIndex(n => n.key === req.params.nodeKey);
    if (idx === -1) return res.status(404).json({ message: "Node yok." });

    const node = group.nodes[idx];
    node.label = req.body.label || node.label;
    node.zones = normalizeStringArray(req.body.zones || node.zones);
    node.coverage = normalizeStringArray(req.body.coverage || node.coverage);
    node.requiredWith = normalizeStringArray(req.body.requiredWith || node.requiredWith);
    node.active = req.body.active !== false;
    
    // YENİ MOTOR ALANLARI:
    node.validityYears = req.body.validityYears;
    node.maxAgeLimit = req.body.maxAgeLimit;
    node.alertStartMonth = req.body.alertStartMonth;
    node.alertFrequency = req.body.alertFrequency;

    recomputeLevels(group.nodes);
    await group.save();
    await upsertFieldFromNode(group, node);

    res.json({ group: toApiGroup(group.toObject()) });
  } catch (err) {
    res.status(500).json({ message: "Hata", error: err.message });
  }
});

router.delete("/:id/nodes/:nodeKey", async (req, res) => {
  try {
    const group = await FieldGroup.findById(req.params.id);
    group.nodes = group.nodes.filter(n => n.key !== req.params.nodeKey);
    await group.save();
    await deactivateFieldByKey(req.params.nodeKey);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Hata", error: err.message });
  }
});

module.exports = router;