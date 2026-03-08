const mongoose = require("mongoose");

const adEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ["impression", "click"], index: true },

    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "AdCampaign", required: true, index: true },
    placement: { type: String, default: "", index: true },
    country: { type: String, default: "" },

    viewerGeo: {
      provinceCode: { type: String, default: "" },
      districtCode: { type: String, default: "" },
    },

    meta: {
      userAgent: { type: String, default: "" },
      referer: { type: String, default: "" },
      ip: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

adEventSchema.index({ campaignId: 1, type: 1, createdAt: -1 });
adEventSchema.index({ placement: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model("AdEvent", adEventSchema);
