// PATH: DriverAll-main/drivercv-backend/models/AdBooking.js
// ----------------------------------------------------------
// Rezervasyon (Hakkaniyet / çakışma engeli)
// - Fixed: unitsStart + unitsCount
// - Carousel: weightUnits
// ----------------------------------------------------------

const mongoose = require("mongoose");

const adBookingSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "AdCampaign", index: true, required: true },

    placementKey: { type: String, required: true, index: true },

    // hedef bölge anahtarı: "TR", "TR-34", "TR-34-TUZLA", "TR_MARMARA"
    geoKey: { type: String, required: true, index: true },

    mode: { type: String, required: true, enum: ["fixed", "carousel"], index: true },

    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },

    // fixed
    unitsStart: { type: Number, default: 0 },
    unitsCount: { type: Number, default: 1 },

    // carousel
    weightUnits: { type: Number, default: 1 },

    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

adBookingSchema.index({ placementKey: 1, geoKey: 1, mode: 1, startAt: 1, endAt: 1 });

module.exports = mongoose.model("AdBooking", adBookingSchema);
