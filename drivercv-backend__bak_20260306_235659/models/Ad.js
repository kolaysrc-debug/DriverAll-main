// PATH: DriverAll-main/drivercv-backend/models/Ad.js
// ----------------------------------------------------------
// Ad (Reklam) - kreatif + hedefleme + yayın metası
// ----------------------------------------------------------

const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    advertiserUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },

    // Temel kreatif
    title: { type: String, required: true },
    description: { type: String, default: "" },

    // Banner / görsel
    imageUrl: { type: String, default: "" },

    // Tıklama hedefi
    targetUrl: { type: String, default: "" },

    // Hedef ülke(ler)
    countryTargets: { type: [String], default: ["ALL"], index: true },

    // ----------------------------------------------------------
    // Durum (iş akışı)
    // draft     : reklamveren taslak
    // pending   : onay bekliyor
    // published : yayında
    // rejected  : reddedildi
    // archived  : arşiv
    // ----------------------------------------------------------
    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected", "archived"],
      default: "draft",
      index: true,
    },

    // Revizyon
    revision: { type: Number, default: 0 },
    approvedRevision: { type: Number, default: 0 },

    // Onaya gönderim / onay / red metası
    submittedAt: { type: Date, default: null },

    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    rejectedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    adminNote: { type: String, default: "" },

    // ----------------------------------------------------------
    // Yayın Metası (opsiyonel)
    // ----------------------------------------------------------
    publishedAt: { type: Date, default: null },

    placementKey: { type: String, default: "", index: true }, // slot

    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdPackage",
      default: null,
    },
    packageName: { type: String, default: "" },

    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ad", adSchema);
