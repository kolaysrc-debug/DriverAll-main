// PATH: DriverAll-main/drivercv-backend/models/JobPackage.js
// ----------------------------------------------------------
// JobPackage (İlan Paketi)
// - Reklam paketi mantığıyla aynı: ülke + geo level + placements + fiyat + süre
// - Kısıtlı firmalar için: restrictedBusinessTypes + requiresAdminApproval
// ----------------------------------------------------------

const mongoose = require("mongoose");

const placementSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },          // örn: HOME_JOB_TOP, JOB_LIST_TOP
    label: { type: String, default: "" },           // UI label
    maxDays: { type: Number, default: 0 },          // bu placement için maksimum gün
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const jobPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },      // Paket adı
    country: { type: String, default: "ALL", index: true },   // ALL/TR/DE...
    geoLevel: { type: String, default: "country", index: true }, // country/state/city/district

    // İlanın nerede görüneceği “yerler”
    // örn: HOME_JOB_TOP, JOB_LIST_TOP, DASHBOARD_RIGHT vb.
    placements: { type: [placementSchema], default: [] },

    // Paket kuralları
    durationDays: { type: Number, default: 7 },   // default süre (placement maxDays yoksa fallback)
    maxJobs: { type: Number, default: 1 },        // bu paketten kaç ilan üretilebilir (ileride)
    price: { type: Number, default: 0 },
    currency: { type: String, default: "EUR" },

    // Kısıt / Onay
    requiresAdminApproval: { type: Boolean, default: true },
    // Sadece belirli business type’lar bu paketi kullanabilsin (SRC/DRIVING_SCHOOL/PSYCHOTECH vb.)
    restrictedBusinessTypes: { type: [String], default: [] },

    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobPackage", jobPackageSchema);
