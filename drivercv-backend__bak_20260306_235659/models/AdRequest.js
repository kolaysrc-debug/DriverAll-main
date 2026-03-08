// PATH: DriverAll-main/drivercv-backend/models/AdRequest.js
// ----------------------------------------------------------
// AdRequest (Reklam Yayın Talebi)
// ----------------------------------------------------------

const mongoose = require("mongoose");

const adRequestSchema = new mongoose.Schema(
  {
    advertiserUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },

    adId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ad",
      index: true,
      required: false,
      default: null,
    },
    adTitle: { type: String, default: "" }, // snapshot

    title: { type: String, default: "" },
    clickUrl: { type: String, default: "" },
    creativeUrl: { type: String, default: "" },
    creativeAlt: { type: String, default: "" },

    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdPackage",
      index: true,
      required: false,
      default: null,
    },
    packageName: { type: String, default: "" },

    packageOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackageOrder",
      index: true,
      required: false,
      default: null,
    },

    packageSnapshot: { type: Object, default: {} },

    placementKey: { type: String, default: "" },
    requestedDays: { type: Number, default: 7 },

    countryTargets: { type: [String], default: ["ALL"], index: true },
    geoLevel: { type: String, default: "country" },
    geoTargets: { type: [String], default: [] },

    note: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },

    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejectedAt: { type: Date, default: null },

    adminNote: { type: String, default: "" },

    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },

    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "AdCampaign", default: null, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdRequest", adRequestSchema);
