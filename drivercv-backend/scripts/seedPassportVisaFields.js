const mongoose = require("mongoose");

const FieldDefinition = require("../models/FieldDefinition");

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/driverall";

function slugifyKey(input) {
  return String(input || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function upsertField(payload) {
  const key = slugifyKey(payload.key);
  if (!key) throw new Error("field key required");

  await FieldDefinition.updateOne(
    { key },
    {
      $setOnInsert: { key },
      $set: {
        label: String(payload.label || key),
        description: String(payload.description || ""),
        category: payload.category || "profile",
        country: payload.country || "TR",
        fieldType: payload.fieldType || "select",
        uiType: payload.uiType || "select",
        groupKey: payload.groupKey || "TRAVEL_DOCS",
        groupLabel: payload.groupLabel || "Seyahat Belgeleri",
        groupLabelOverride: payload.groupLabelOverride || payload.groupLabel || "Seyahat Belgeleri",
        optionsGroupKey: payload.optionsGroupKey || null,
        showInCv: payload.showInCv !== false,
        showInJobFilter: payload.showInJobFilter !== false,
        active: payload.active !== false,
        requiresIssueDate: !!payload.requiresIssueDate,
        hasExpiry: !!payload.hasExpiry,
        expiryMode: payload.expiryMode || "none",
        durationYearsFromIssue: payload.durationYearsFromIssue ?? null,
        maxAge: payload.maxAge ?? null,
        validityYears: payload.validityYears ?? null,
        validityModel: payload.validityModel || "simple",
        meta: payload.meta || {},
      },
    },
    { upsert: true }
  );
}

async function main() {
  console.log("Seeding passport/visa field definitions...");
  console.log("Mongo URI:", MONGO_URI);

  await mongoose.connect(MONGO_URI);

  await upsertField({
    key: "PASSPORT_TYPE_TR",
    label: "Pasaport Tipi",
    description: "Pasaport türünüzü seçin.",
    category: "profile",
    country: "TR",
    fieldType: "select",
    uiType: "select",
    groupKey: "TRAVEL_DOCS",
    groupLabel: "Seyahat Belgeleri",
    optionsGroupKey: "PASSPORT_TYPES_TR",
    showInCv: true,
    showInJobFilter: false,
    active: true,
    requiresIssueDate: true,
    hasExpiry: true,
    expiryMode: "durationFromIssue",
    durationYearsFromIssue: null,
  });

  await upsertField({
    key: "VISA_TYPES",
    label: "Vize Tipleri",
    description: "Sahip olduğunuz vizeleri seçin.",
    category: "profile",
    country: "ALL",
    fieldType: "select",
    uiType: "multiselect",
    groupKey: "TRAVEL_DOCS",
    groupLabel: "Seyahat Belgeleri",
    optionsGroupKey: "VISA_TYPES",
    showInCv: true,
    showInJobFilter: false,
    active: true,
    requiresIssueDate: true,
    hasExpiry: true,
    expiryMode: "durationFromIssue",
    durationYearsFromIssue: 5,
    meta: {
      visibility: {
        dependsOnKey: "PASSPORT_TYPE_TR",
        whenFilled: true,
        clearWhenHidden: true,
      },
    },
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
