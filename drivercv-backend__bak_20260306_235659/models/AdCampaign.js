// PATH: DriverAll-main/drivercv-backend/models/AdCampaign.js

const mongoose = require("mongoose");

const creativeSchema = new mongoose.Schema(
  { kind: { type: String, default: "image" }, url: { type: String, default: "" }, alt: { type: String, default: "" } },
  { _id: false }
);

const adCampaignSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },

    countryTargets: { type: [String], default: ["ALL"], index: true },

    // ✅ hedefleme (kısıtlı/serbest)
    geoLevel: { type: String, default: "country", enum: ["country", "province", "district", "geoGroup"] },
    geoTargets: { type: [String], default: [] },

    placements: { type: [String], default: [], index: true },

    title: { type: String, default: "" },
    clickUrl: { type: String, default: "" },
    creatives: { type: [creativeSchema], default: [] },

    status: { type: String, default: "running", enum: ["running", "paused", "ended"], index: true },
    rejectionReason: { type: String, default: "" },

    startAt: { type: Date, default: null, index: true },
    endAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdCampaign", adCampaignSchema);
