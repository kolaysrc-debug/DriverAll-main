// PATH: DriverAll-main/drivercv-backend/models/JobRequest.js
// ----------------------------------------------------------
// Job Request (İlan Talebi)
// - Employer: create + mine
// - Admin: list pending + approve/reject
// Approve -> Job publish meta set (publishedAt/startAt/endAt + status=published)
// ----------------------------------------------------------

const mongoose = require("mongoose");

const jobRequestSchema = new mongoose.Schema(
  {
    employerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },

    // ----------------------------------------------------------
    // IMPORTANT: Bu akışta JobRequest, mevcut Job (taslak ilan) ile bağlıdır
    // ----------------------------------------------------------
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      index: true,
      required: true,
    },
    jobTitle: { type: String, default: "" }, // listede hızlı göstermek için snapshot

    packageOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackageOrder",
      index: true,
      required: true,
    },

    // Paket ismi (listede hızlı göstermek için snapshot)
    packageName: { type: String, default: "" },

    // Order anındaki paket snapshot'ı (kurallar değişse bile geçmiş bozulmasın)
    packageSnapshot: { type: Object, default: {} },

    // Legacy (eski JobPackage tabanlı kayıtlar için)
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPackage",
      index: true,
      required: false,
    },

    // Ülke hedefi (şimdilik basit)
    countryTargets: { type: [String], default: ["ALL"], index: true },

    // Paket seviyesine uygun hedefleme (ileride büyütülecek)
    geoLevel: { type: String, default: "country" }, // country/state/city/district

    // Paket placement (vitrin alanı)
    placementKey: { type: String, default: "" },
    requestedDays: { type: Number, default: 7 },

    // Not (employer)
    note: { type: String, default: "" },

    // ----------------------------------------------------------
    // Legacy alanlar (eski kayıtlar için kalsın)
    // ----------------------------------------------------------
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    criteria: { type: Object, default: {} },
    businessType: { type: String, default: "GENERIC" },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    // Admin işlemleri
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejectedAt: { type: Date, default: null },
    adminNote: { type: String, default: "" },

    // Yayın süresi (onayda set edilir)
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobRequest", jobRequestSchema);
