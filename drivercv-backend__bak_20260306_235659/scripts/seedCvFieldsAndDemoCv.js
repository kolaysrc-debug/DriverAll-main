// PATH: drivercv-backend/scripts/seedCvFieldsAndDemoCv.js
// ----------------------------------------------------------
// Seed minimal FieldDefinitions for CV + write demo CV values
// - No deletions; uses upsert by key (FieldDefinition) and by userId (Cv)
// Usage:
//   node scripts/seedCvFieldsAndDemoCv.js
// Env:
//   MONGO_URI (default: mongodb://127.0.0.1:27017/driverall_dev)
//   DEMO_DRIVER_EMAIL (default: driver-demo@driverall.com)
//   DEMO_DRIVER_PASSWORD (default: demo12345)
// ----------------------------------------------------------

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const FieldDefinition = require("../models/FieldDefinition");
const Cv = require("../models/Cv");

function env(name, def) {
  const v = process.env[name];
  return v == null || String(v).trim() === "" ? def : v;
}

async function upsertDriverUser({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) throw new Error("DEMO_DRIVER_EMAIL required");

  let u = await User.findOne({ email: normalizedEmail });
  if (u) return u;

  const hashed = await bcrypt.hash(String(password || ""), 10);
  u = await User.create({
    name: "Demo Driver",
    email: normalizedEmail,
    passwordHash: hashed,
    role: "driver",
    isActive: true,
    isApproved: true,
    phone: "05000000004",
  });
  return u;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function yearsFromNowISO(years) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

async function upsertField(field) {
  const key = String(field.key || "").trim();
  if (!key) throw new Error("Field key required");

  const update = { $set: { ...field, key } };
  const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
  return FieldDefinition.findOneAndUpdate({ key }, update, opts);
}

async function main() {
  const MONGO_URI = env("MONGODB_URI", env("MONGO_URI", "mongodb://127.0.0.1:27017/driverall"));
  const driverEmail = env("DEMO_DRIVER_EMAIL", "driver-demo@driverall.com");
  const driverPassword = env("DEMO_DRIVER_PASSWORD", "demo12345");

  await mongoose.connect(MONGO_URI);
  console.log("[seedCvFieldsAndDemoCv] Connected:", MONGO_URI);
  console.log("[seedCvFieldsAndDemoCv] DB:", mongoose.connection.name);

  const driver = await upsertDriverUser({ email: driverEmail, password: driverPassword });

  const fields = [
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
  ];

  const upserted = [];
  for (const f of fields) {
    const doc = await upsertField(f);
    upserted.push(doc);
  }

  const demoValues = {
    EXPERIENCE_YEARS: 6,
    HAS_PSYCHOTECHNIC: true,
    PSYCHOTECHNIC_EXPIRY: yearsFromNowISO(2),
    HAS_ADR: false,
    LICENCE_B: true,
    LICENCE_C: true,
    LICENCE_CE: false,
    SRC1_TR: true,
    SRC2_TR: true,
    SRC3_TR: false,
    SRC4_TR: false,
    LAST_UPDATED: todayISO(),
  };

  const cv = await Cv.findOneAndUpdate(
    { userId: driver._id },
    { $set: { userId: driver._id, values: demoValues } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("\n[seedCvFieldsAndDemoCv] Upserted FieldDefinitions:", upserted.length);
  console.log("[seedCvFieldsAndDemoCv] Demo driver:", driver.email, String(driver._id));
  console.log("[seedCvFieldsAndDemoCv] Demo CV id:", String(cv._id));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("[seedCvFieldsAndDemoCv] Error:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
