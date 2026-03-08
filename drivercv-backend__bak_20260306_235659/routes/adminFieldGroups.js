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
    equivalentKeys: normalizeStringArray(n.equivalentKeys),
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
    sortOrder: Number.isFinite(g.sortOrder) ? g.sortOrder : 0,
    selectionMode: String(g.selectionMode || "multi"),
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

function dedupeNodesByKey(nodes) {
  const map = new Map();
  for (const n of nodes || []) {
    const rawKey = String(n?.key || "");
    const key = slugifyKey(rawKey);
    if (!key) continue;
    n.key = key;
    map.set(key, n);
  }
  return Array.from(map.values());
}

async function assertExistingFieldForGroupOrThrow(group, key) {
  const k = String(key || "").trim();
  if (!k) {
    const err = new Error("Eksik bilgi.");
    err.statusCode = 400;
    throw err;
  }

  const existing = await FieldDefinition.findOne({ key: k }).lean();
  if (!existing) {
    const err = new Error(
      `Bu key Fields tarafında yok: ${k}. Önce Admin > Fields ekranından oluşturup gruba bağlayın.`
    );
    err.statusCode = 400;
    throw err;
  }

  const existingGroupKey = String(existing.groupKey || "").trim();
  if (!existingGroupKey) {
    const err = new Error(
      `Bu kriter henüz bir gruba atanmadı: ${k}. Önce Admin > Fields ekranında groupKey=${group.groupKey} olacak şekilde kaydedin.`
    );
    err.statusCode = 400;
    throw err;
  }
  if (existingGroupKey !== group.groupKey) {
    const err = new Error(
      `Bu kriter başka bir gruba bağlı: ${k} (groupKey=${existingGroupKey}).`
    );
    err.statusCode = 400;
    throw err;
  }

  return existing;
}

// ENDPOINTS
router.get("/", async (req, res) => {
  try {
    const groups = await FieldGroup.find({}).sort({ sortOrder: 1, groupKey: 1 });

    const groupKeys = Array.from(
      new Set(groups.map((g) => String(g?.groupKey || "").trim()).filter(Boolean))
    );
    const fields = await FieldDefinition.find({ groupKey: { $in: groupKeys } })
      .select({ key: 1, label: 1, groupKey: 1 })
      .lean();

    const fieldKeysByGroup = new Map();
    for (const f of fields || []) {
      const gk = String(f?.groupKey || "").trim();
      const k = slugifyKey(f?.key);
      const l = String(f?.label || "").trim();
      if (!gk || !k) continue;
      if (!fieldKeysByGroup.has(gk)) fieldKeysByGroup.set(gk, []);
      fieldKeysByGroup.get(gk).push({ key: k, label: l || k });
    }

    const labelByGroupAndKey = new Map();
    for (const f of fields || []) {
      const gk = String(f?.groupKey || "").trim();
      const k = slugifyKey(f?.key);
      const l = String(f?.label || "").trim();
      if (!gk || !k || !l) continue;
      labelByGroupAndKey.set(`${gk}::${k}`, l);
    }

    // Otomatik senkron: Fields'te bu gruba bağlı olan her kriter için node materyalize et
    // NOT: domain=options grupları (select/multiselect seçenek listeleri) Fields ile sync edilmez.
    for (const group of groups) {
      if (String(group?.domain || "").trim().toLowerCase() === "options") continue;

      const gk = String(group?.groupKey || "").trim();
      if (!gk) continue;

      const fieldKeys = fieldKeysByGroup.get(gk) || [];
      const allowedKeySet = new Set((fieldKeys || []).map((x) => slugifyKey(x?.key)).filter(Boolean));
      const existingKeys = new Set((group.nodes || []).map((n) => slugifyKey(n?.key)).filter(Boolean));

      let changed = false;

      // Orphan cleanup: Fields tarafında artık olmayan node'ları kaldır
      if (allowedKeySet.size > 0 && Array.isArray(group.nodes) && group.nodes.length > 0) {
        const beforeLen = group.nodes.length;
        group.nodes = (group.nodes || []).filter((n) => {
          const k = slugifyKey(n?.key);
          return !k || allowedKeySet.has(k);
        });
        if (group.nodes.length !== beforeLen) changed = true;

        // Kaldırılan key'lere referansları temizle
        const validKeys = new Set((group.nodes || []).map((n) => slugifyKey(n?.key)).filter(Boolean));
        for (const n of group.nodes || []) {
          const pk = slugifyKey(n?.parentKey);
          if (pk && !validKeys.has(pk)) {
            n.parentKey = "";
            n.level = 0;
            changed = true;
          }

          if (Array.isArray(n.coverage)) {
            const next = n.coverage
              .map((k) => slugifyKey(k))
              .filter((k) => k && validKeys.has(k) && k !== slugifyKey(n?.key));
            if (String(next) !== String(n.coverage)) {
              n.coverage = next;
              changed = true;
            }
          }

          if (Array.isArray(n.requiredWith)) {
            const next = n.requiredWith
              .map((k) => slugifyKey(k))
              .filter((k) => k && validKeys.has(k) && k !== slugifyKey(n?.key));
            if (String(next) !== String(n.requiredWith)) {
              n.requiredWith = next;
              changed = true;
            }
          }

          if (Array.isArray(n.equivalentKeys)) {
            const next = n.equivalentKeys
              .map((k) => slugifyKey(k))
              .filter((k) => k && validKeys.has(k) && k !== slugifyKey(n?.key));
            if (String(next) !== String(n.equivalentKeys)) {
              n.equivalentKeys = next;
              changed = true;
            }
          }
        }
      }

      if (fieldKeys.length === 0) {
        if (Array.isArray(group.nodes) && group.nodes.length > 0) {
          group.nodes = [];
          changed = true;
        }
        if (changed) {
          group.nodes = dedupeNodesByKey(group.nodes);
          recomputeLevels(group.nodes);
          await group.save();
        }
        continue;
      }

      for (const fk of fieldKeys) {
        if (existingKeys.has(fk.key)) continue;
        changed = true;
        group.nodes = group.nodes || [];
        group.nodes.push({
          key: fk.key,
          label: fk.label,
          parentKey: "",
          level: 0,
          sortOrder: 0,
          active: true,
          zones: ["TR"],
          coverage: [],
          requiredWith: [],
          equivalentKeys: [],
        });
      }

      if (changed) {
        group.nodes = dedupeNodesByKey(group.nodes);
        recomputeLevels(group.nodes);
        await group.save();
      }
    }

    const apiGroups = groups.map((g) => {
      const groupKey = String(g?.groupKey || "").trim();
      const mapped = toApiGroup(g.toObject());
      mapped.nodes = (mapped.nodes || []).map((n) => {
        const k = slugifyKey(n?.key);
        const override = labelByGroupAndKey.get(`${groupKey}::${k}`);
        return override ? { ...n, label: override } : n;
      });
      return mapped;
    });

    return res.json({ groups: apiGroups });
  } catch (err) {
    const status = err?.statusCode || 500;
    return res
      .status(status)
      .json({ message: err?.message || "Hata", error: err?.message || String(err) });
  }
});

router.post("/", async (req, res) => {
  try {
    const groupKey = slugifyKey(req.body.groupKey);
    const groupLabel = String(req.body.groupLabel || "").trim();
    if (!groupKey || !groupLabel) return res.status(400).json({ message: "Eksik bilgi." });
    const sortOrderRaw = Number(req.body.sortOrder);
    const sortOrder = Number.isFinite(sortOrderRaw) ? sortOrderRaw : 0;
    const selectionModeRaw = String(req.body.selectionMode || "").trim().toLowerCase();
    const selectionMode = selectionModeRaw === "single" ? "single" : "multi";
    const group = await FieldGroup.create({ groupKey, groupLabel, sortOrder, selectionMode, nodes: [] });
    return res.status(201).json({ group: toApiGroup(group.toObject()) });
  } catch (err) {
    const status = err?.statusCode || 500;
    return res
      .status(status)
      .json({ message: err?.message || "Hata", error: err?.message || String(err) });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const sortOrderRaw = Number(req.body.sortOrder);
    const sortOrder = Number.isFinite(sortOrderRaw) ? sortOrderRaw : undefined;

    const selectionModeRaw =
      req.body.selectionMode === undefined ? undefined : String(req.body.selectionMode || "").trim().toLowerCase();
    const selectionMode =
      selectionModeRaw === undefined
        ? undefined
        : selectionModeRaw === "single"
          ? "single"
          : "multi";

    const updateData = {};

    if (req.body.groupLabel !== undefined) updateData.groupLabel = req.body.groupLabel;
    if (req.body.active !== undefined) updateData.active = req.body.active !== false;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (selectionMode !== undefined) updateData.selectionMode = selectionMode;

    // Yeni Motor Alanları (opsiyonel)
    if (req.body.defaultValidityYears !== undefined)
      updateData.defaultValidityYears = req.body.defaultValidityYears;
    if (req.body.defaultMaxAgeLimit !== undefined)
      updateData.defaultMaxAgeLimit = req.body.defaultMaxAgeLimit;
    if (req.body.defaultAlertStartMonth !== undefined)
      updateData.defaultAlertStartMonth = req.body.defaultAlertStartMonth;
    if (req.body.defaultAlertFrequency !== undefined)
      updateData.defaultAlertFrequency = req.body.defaultAlertFrequency;

    const group = await FieldGroup.findByIdAndUpdate(req.params.id, updateData, { new: true });
    return res.json({ group: toApiGroup(group.toObject()) });
  } catch (err) {
    const status = err?.statusCode || 500;
    return res
      .status(status)
      .json({ message: err?.message || "Hata", error: err?.message || String(err) });
  }
});

// DELETE /api/admin/field-groups/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const group = await FieldGroup.findById(id).lean();
    if (!group) return res.status(404).json({ message: "Grup bulunamadı." });

    const nodes = Array.isArray(group.nodes) ? group.nodes : [];
    if (nodes.length > 0) {
      return res.status(400).json({
        message:
          "Grup silinemez. Önce grubun içindeki üyeleri (node'ları) silin/çıkarın; grup boş olmalıdır.",
      });
    }

    const groupKey = String(group.groupKey || "").trim();
    if (groupKey) {
      const usedAsGroup = await FieldDefinition.findOne({ groupKey }).select({ _id: 1, key: 1 }).lean();
      if (usedAsGroup) {
        return res.status(400).json({
          message: `Grup silinemez. Bu grup FieldDefinition'larda kullanılıyor (örn: ${String(usedAsGroup.key || usedAsGroup._id)}). Çözüm: Grubu pasif yapın (active=false) veya ilgili field'larda groupKey değiştirin.`,
        });
      }

      const usedAsOptions = await FieldDefinition.findOne({ optionsGroupKey: groupKey })
        .select({ _id: 1, key: 1 })
        .lean();
      if (usedAsOptions) {
        return res.status(400).json({
          message: `Grup silinemez. Bu grup seçenek kaynağı olarak kullanılıyor (optionsGroupKey) (örn: ${String(usedAsOptions.key || usedAsOptions._id)}). Çözüm: İlgili field'da optionsGroupKey'i kaldırın/değiştirin veya grubu pasif yapın (active=false).`,
        });
      }
    }

    await FieldGroup.deleteOne({ _id: id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: "Grup silinemedi.", error: err?.message || String(err) });
  }
});

router.put("/:id/nodes/:nodeKey", async (req, res) => {
  try {
    const group = await FieldGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Grup yok." });

    const nodeKey = slugifyKey(req.params.nodeKey);
    if (!nodeKey) return res.status(400).json({ message: "Eksik bilgi." });

    const nodes = Array.isArray(group.nodes) ? group.nodes : [];
    const idx = nodes.findIndex((n) => slugifyKey(n?.key) === nodeKey);
    if (idx < 0) return res.status(404).json({ message: "Node yok." });

    const validKeys = new Set(
      (nodes || []).map((n) => slugifyKey(n?.key)).filter(Boolean)
    );

    const rawParentKey = slugifyKey(req.body.parentKey);
    const parentKey =
      rawParentKey && rawParentKey !== nodeKey && validKeys.has(rawParentKey)
        ? rawParentKey
        : "";

    const sortOrderRaw = Number(req.body.sortOrder);
    const sortOrder = Number.isFinite(sortOrderRaw) ? sortOrderRaw : 0;

    const zones = normalizeStringArray(req.body.zones);

    const coverage = normalizeStringArray(req.body.coverage)
      .map((k) => slugifyKey(k))
      .filter((k) => k && k !== nodeKey && validKeys.has(k));

    const requiredWith = normalizeStringArray(req.body.requiredWith)
      .map((k) => slugifyKey(k))
      .filter((k) => k && k !== nodeKey && validKeys.has(k));

    const equivalentKeys = normalizeStringArray(req.body.equivalentKeys)
      .map((k) => slugifyKey(k))
      .filter((k) => k && k !== nodeKey && validKeys.has(k));

    const active = req.body.active !== false;

    // Motor alanları (opsiyonel)
    const validityYearsRaw = req.body.validityYears;
    const maxAgeLimitRaw = req.body.maxAgeLimit;
    const alertStartMonthRaw = req.body.alertStartMonth;
    const alertFrequencyRaw = req.body.alertFrequency;

    const validityYears =
      validityYearsRaw === null || validityYearsRaw === ""
        ? null
        : Number.isFinite(Number(validityYearsRaw))
          ? Number(validityYearsRaw)
          : null;

    const maxAgeLimit =
      maxAgeLimitRaw === null || maxAgeLimitRaw === ""
        ? null
        : Number.isFinite(Number(maxAgeLimitRaw))
          ? Number(maxAgeLimitRaw)
          : null;

    const alertStartMonth =
      alertStartMonthRaw === null || alertStartMonthRaw === ""
        ? null
        : Number.isFinite(Number(alertStartMonthRaw))
          ? Number(alertStartMonthRaw)
          : null;

    const alertFrequency =
      alertFrequencyRaw === null || alertFrequencyRaw === ""
        ? null
        : String(alertFrequencyRaw || "").trim() || null;

    const node = nodes[idx];
    node.parentKey = parentKey;
    node.sortOrder = sortOrder;
    node.zones = zones.length > 0 ? zones : node.zones || ["TR"];
    node.coverage = coverage;
    node.requiredWith = requiredWith;
    node.equivalentKeys = equivalentKeys;
    node.active = active;
    node.validityYears = validityYears;
    node.maxAgeLimit = maxAgeLimit;
    node.alertStartMonth = alertStartMonth;
    node.alertFrequency = alertFrequency;

    group.nodes = dedupeNodesByKey(group.nodes);
    recomputeLevels(group.nodes);
    await group.save();

    return res.json({ group: toApiGroup(group.toObject()) });
  } catch (err) {
    const status = err?.statusCode || 500;
    res
      .status(status)
      .json({ message: err?.message || "Hata", error: err?.message || String(err) });
  }
});

router.delete("/:id/nodes/:nodeKey", async (req, res) => {
  try {
    const group = await FieldGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Grup yok." });

    const domain = String(group?.domain || "").trim().toLowerCase();
    if (domain !== "options") {
      return res.status(403).json({
        message:
          "Node silme kapalı. Kriterler sadece Admin > Fields ekranından silinir; ilgili grup node'ları otomatik temizlenir.",
      });
    }

    const nodeKey = slugifyKey(req.params.nodeKey);
    if (!nodeKey) return res.status(400).json({ message: "Eksik bilgi." });

    const beforeLen = Array.isArray(group.nodes) ? group.nodes.length : 0;
    group.nodes = (group.nodes || []).filter((n) => slugifyKey(n?.key) !== nodeKey);

    if ((group.nodes || []).length === beforeLen) {
      return res.status(404).json({ message: "Node yok." });
    }

    // referans temizliği
    const validKeys = new Set((group.nodes || []).map((n) => slugifyKey(n?.key)).filter(Boolean));
    for (const n of group.nodes || []) {
      const pk = slugifyKey(n?.parentKey);
      if (pk && !validKeys.has(pk)) {
        n.parentKey = "";
        n.level = 0;
      }

      if (Array.isArray(n.coverage)) {
        n.coverage = n.coverage
          .map((k) => slugifyKey(k))
          .filter((k) => k && validKeys.has(k) && k !== slugifyKey(n?.key));
      }

      if (Array.isArray(n.requiredWith)) {
        n.requiredWith = n.requiredWith
          .map((k) => slugifyKey(k))
          .filter((k) => k && validKeys.has(k) && k !== slugifyKey(n?.key));
      }

      if (Array.isArray(n.equivalentKeys)) {
        n.equivalentKeys = n.equivalentKeys
          .map((k) => slugifyKey(k))
          .filter((k) => k && validKeys.has(k) && k !== slugifyKey(n?.key));
      }
    }

    group.nodes = dedupeNodesByKey(group.nodes);
    recomputeLevels(group.nodes);
    await group.save();

    return res.json({ group: toApiGroup(group.toObject()) });
  } catch (err) {
    const status = err?.statusCode || 500;
    res
      .status(status)
      .json({ message: err?.message || "Hata", error: err?.message || String(err) });
  }
});

module.exports = router;