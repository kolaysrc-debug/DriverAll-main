// PATH: drivercv-backend/scripts/seedFieldGroups.js
// ----------------------------------------------------------
// Dev helper: seed initial FieldGroups (EHL_TR, SRC_TR) and their derived FieldDefinitions.
// Usage:
//   MONGO_URI="mongodb://127.0.0.1:27017/driverall" \
//   RESET_FIELD_GROUPS=true \
//   node scripts/seedFieldGroups.js
// ----------------------------------------------------------

require("dotenv").config();
const mongoose = require("mongoose");

const FieldGroup = require("../models/FieldGroup");
const FieldDefinition = require("../models/FieldDefinition");

function toBool(v) {
  return String(v || "").trim().toLowerCase() === "true";
}

function node(key, label, opts = {}) {
  return {
    key,
    label,
    parentKey: opts.parentKey || "",
    sortOrder: Number.isFinite(opts.sortOrder) ? opts.sortOrder : 0,
    zones: Array.isArray(opts.zones) ? opts.zones : ["TR"],
    coverage: Array.isArray(opts.coverage) ? opts.coverage : [],
    requiredWith: Array.isArray(opts.requiredWith) ? opts.requiredWith : [],
    validityYears: opts.validityYears ?? null,
    maxAgeLimit: opts.maxAgeLimit ?? null,
    alertStartMonth: opts.alertStartMonth ?? null,
    alertFrequency: opts.alertFrequency ?? null,
    isDefault: opts.isDefault === true,
    active: opts.active !== false,
  };
}

function computeLevels(nodes) {
  const byKey = new Map(nodes.map((n) => [String(n.key), n]));
  const roots = [];

  for (const n of nodes) {
    const pk = String(n.parentKey || "").trim();
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
      if (String(child.parentKey || "").trim() === String(parent.key)) {
        child.level = Number(parent.level || 0) + 1;
        queue.push(child);
      }
    }
  }
}

async function upsertFieldFromNode(group, n) {
  const key = String(n.key || "").trim();
  if (!key) return;

  const update = {
    key,
    label: String(n.label || key).trim() || key,
    groupKey: group.groupKey,
    groupLabelOverride: group.groupLabel,
    country: group.country || "ALL",
    active: n.active !== false,
    fieldType: "boolean",
    uiType: "boolean",
    category: "profile",
    showInCv: true,
    zones: Array.isArray(n.zones) ? n.zones : ["TR"],
    coversKeys: Array.isArray(n.coverage) ? n.coverage : [],
    requiresKeys: Array.isArray(n.requiredWith) ? n.requiredWith : [],
  };

  await FieldDefinition.findOneAndUpdate({ key }, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });
}

async function seedFieldGroups() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/driverall";
  const reset = toBool(process.env.RESET_FIELD_GROUPS);

  await mongoose.connect(MONGO_URI);
  console.log("[seedFieldGroups] Connected:", MONGO_URI);

  if (reset) {
    await FieldGroup.deleteMany({ groupKey: { $in: ["EHL_TR", "SRC_TR"] } });
    await FieldDefinition.deleteMany({ groupKey: { $in: ["EHL_TR", "SRC_TR"] } });
    console.log("[seedFieldGroups] Reset existing EHL_TR/SRC_TR groups and fields.");
  }

  const groups = [
    {
      groupKey: "EHL_TR",
      groupLabel: "Ehliyet Sınıfları (TR)",
      country: "TR",
      nodes: [
        node("EHL_A", "A", { coverage: ["EHL_A1", "EHL_A2"] }),
        node("EHL_A1", "A1"),
        node("EHL_A2", "A2"),
        node("EHL_B", "B"),
        node("EHL_C", "C", { coverage: ["EHL_B"] }),
        node("EHL_CE", "CE", { coverage: ["EHL_C", "EHL_B"] }),
        node("EHL_D", "D", { coverage: ["EHL_B"] }),
        node("EHL_D1", "D1"),
        node("EHL_DE", "DE", { coverage: ["EHL_D", "EHL_B"] }),
      ],
    },
    {
      groupKey: "SRC_TR",
      groupLabel: "SRC / ADR Belgeleri (TR)",
      country: "TR",
      nodes: [
        node("SRC1_TR", "SRC 1 (Uluslararası Yolcu)", { coverage: ["SRC2_TR"] }),
        node("SRC2_TR", "SRC 2 (Yurtiçi Yolcu)"),
        node("SRC3_TR", "SRC 3 (Uluslararası Eşya-Kargo)", { coverage: ["SRC4_TR"] }),
        node("SRC4_TR", "SRC 4 (Yurtiçi Eşya-Kargo)"),
        node("SRC5_TR", "SRC 5 (Tehlikeli Madde)"),
        node("PSIKO_TR", "Psikoteknik"),
        node("ODY_TR", "ODY"),
        node("U2_TR", "U2 (Ticari Taşıt Kullanma)"),
      ],
    },
  ];

  for (const g of groups) {
    computeLevels(g.nodes);

    const doc = await FieldGroup.findOneAndUpdate(
      { groupKey: g.groupKey },
      {
        $set: {
          groupKey: g.groupKey,
          groupLabel: g.groupLabel,
          country: g.country || "ALL",
          active: true,
          nodes: g.nodes,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    for (const n of doc.nodes || []) {
      await upsertFieldFromNode(doc, n);
    }

    console.log(`[seedFieldGroups] Upserted group ${g.groupKey} (nodes=${(doc.nodes || []).length})`);
  }

  const groupCount = await FieldGroup.countDocuments({ groupKey: { $in: ["EHL_TR", "SRC_TR"] } });
  const fieldCount = await FieldDefinition.countDocuments({ groupKey: { $in: ["EHL_TR", "SRC_TR"] } });

  console.log("[seedFieldGroups] Done.");
  console.log("[seedFieldGroups] Group count:", groupCount);
  console.log("[seedFieldGroups] FieldDefinition count:", fieldCount);

  await mongoose.disconnect();
}

if (require.main === module) {
  seedFieldGroups().catch((err) => {
    console.error("[seedFieldGroups] Error:", err);
    process.exit(1);
  });
}

module.exports = seedFieldGroups;
