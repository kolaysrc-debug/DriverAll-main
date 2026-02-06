// DriverAll-main/drivercv-backend/models/FieldGroup.js
const mongoose = require("mongoose");

const NodeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true }, 
    label: { type: String, required: true },
    parentKey: { type: String, default: null },
    level: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
    zones: { type: [String], default: ["TR"] }, 
    coverage: { type: [String], default: [] }, 
    requiredWith: { type: [String], default: [] }, 
    equivalentKeys: { type: [String], default: [] },
    
    // --- YENİ EKLENEN MOTOR ALANLARI ---
    validityYears: { type: Number, default: null },
    maxAgeLimit: { type: Number, default: null },
    alertStartMonth: { type: Number, default: null },
    alertFrequency: { type: String, default: null },
    // ----------------------------------

    isDefault: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { _id: false, timestamps: true }
);

const FieldGroupSchema = new mongoose.Schema(
  {
    groupKey: { type: String, required: true, unique: true, trim: true },
    groupLabel: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    domain: { type: String, default: "" },
    country: { type: String, default: "ALL" }, 

    // --- GRUP VARSAYILANLARI (GÜNCELLENDİ) ---
    defaultValidityYears: { type: Number, default: 5 },
    defaultMaxAgeLimit: { type: Number, default: 65 },
    defaultAlertStartMonth: { type: Number, default: 12 },
    defaultAlertFrequency: { type: String, default: "6-months" },
    // -----------------------------------------

    validityModel: { type: String, default: "none" }, // legacy
    required: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    nodes: { type: [NodeSchema], default: [] },
  },
  { timestamps: true }
);

FieldGroupSchema.index({ groupKey: 1 }, { unique: true });
module.exports = mongoose.model("FieldGroup", FieldGroupSchema);