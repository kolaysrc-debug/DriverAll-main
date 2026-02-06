// PATH: DriverAll-main/drivercv-backend/models/BusinessPolicy.js
// ----------------------------------------------------------
// İş Kolu Politikası (ülkeye göre)
// - Kısıtlı sektörlerde hedefleme kilitli
// - Serbest sektörlerde geoGroup dahil serbest hedefleme
// ----------------------------------------------------------

const mongoose = require("mongoose");

const businessPolicySchema = new mongoose.Schema(
  {
    country: { type: String, default: "TR", index: true }, // TR/ALL
    businessType: {
      type: String,
      required: true,
      index: true,
      enum: ["DRIVING_SCHOOL", "SRC_CENTER", "SRC5_CENTER", "PSIKOTEKNIK", "LOGISTICS", "OTHER"],
    },

    restricted: { type: Boolean, default: false },

    // restricted ise hedefleme seviyesi kilitli olur:
    // country | province | district
    requiredGeoLevel: { type: String, default: "district", enum: ["country", "province", "district", "geoGroup"] },

    // serbest ise geoGroup seçimine izin
    allowGeoGroups: { type: Boolean, default: true },

    note: { type: String, default: "" },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

businessPolicySchema.index({ country: 1, businessType: 1 }, { unique: true });

module.exports = mongoose.model("BusinessPolicy", businessPolicySchema);
