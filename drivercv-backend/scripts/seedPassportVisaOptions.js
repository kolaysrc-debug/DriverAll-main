const mongoose = require("mongoose");

const FieldGroup = require("../models/FieldGroup");

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/driverall";

function buildNodes(items) {
  const seen = new Set();
  const nodes = [];
  let i = 0;
  for (const it of items || []) {
    const key = String(it.key || "").trim();
    const label = String(it.label || "").trim() || key;
    if (!key) continue;
    const k = key.toUpperCase();
    if (seen.has(k)) continue;
    seen.add(k);
    nodes.push({
      key: k,
      label,
      parentKey: "",
      level: 0,
      sortOrder: Number.isFinite(Number(it.sortOrder)) ? Number(it.sortOrder) : i,
      zones: ["TR"],
      coverage: [],
      requiredWith: [],
      equivalentKeys: [],
      validityYears: null,
      maxAgeLimit: null,
      alertStartMonth: null,
      alertFrequency: null,
      isDefault: false,
      active: true,
    });
    i += 1;
  }
  return nodes;
}

async function upsertGroup({ groupKey, groupLabel, country, domain, nodes }) {
  const key = String(groupKey || "").trim().toUpperCase();
  if (!key) throw new Error("groupKey required");

  await FieldGroup.updateOne(
    { groupKey: key },
    {
      $setOnInsert: {
        groupKey: key,
      },
      $set: {
        groupLabel: String(groupLabel || key),
        country: String(country || "ALL"),
        domain: String(domain || "options"),
        active: true,
        nodes: Array.isArray(nodes) ? nodes : [],
      },
    },
    { upsert: true }
  );
}

async function main() {
  console.log("Seeding passport/visa option groups...");
  console.log("Mongo URI:", MONGO_URI);

  await mongoose.connect(MONGO_URI);

  const passportNodes = buildNodes([
    { key: "UMUMI", label: "Umumi (Bordo)", sortOrder: 10 },
    { key: "HUSUSI", label: "Hususi (Yeşil)", sortOrder: 20 },
    { key: "HIZMET", label: "Hizmet (Gri)", sortOrder: 30 },
    { key: "DIPLOMATIK", label: "Diplomatik (Siyah)", sortOrder: 40 },
  ]);

  const visaNodes = buildNodes([
    { key: "SCHENGEN", label: "Schengen", sortOrder: 10 },
    { key: "UK", label: "Birleşik Krallık (UK)", sortOrder: 20 },
    { key: "USA", label: "Amerika (USA)", sortOrder: 30 },
    { key: "CANADA", label: "Kanada", sortOrder: 40 },
    { key: "UAE", label: "BAE (Dubai)", sortOrder: 50 },
    { key: "SAUDI", label: "Suudi Arabistan", sortOrder: 60 },
  ]);

  await upsertGroup({
    groupKey: "PASSPORT_TYPES_TR",
    groupLabel: "Pasaport Tipleri (TR)",
    country: "TR",
    domain: "options",
    nodes: passportNodes,
  });

  await upsertGroup({
    groupKey: "VISA_TYPES",
    groupLabel: "Vize Tipleri",
    country: "ALL",
    domain: "options",
    nodes: visaNodes,
  });

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
