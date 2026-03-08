// PATH: DriverAll-main/drivercv-backend/models/GeoGroup.js
// ----------------------------------------------------------
// Bölge Kümeleri (Marmara, Trakya, İzmir-Manisa-Aydın vb.)
// members: provinceCode veya districtCode listesi
// ----------------------------------------------------------

const mongoose = require("mongoose");

const geoGroupSchema = new mongoose.Schema(
  {
    country: { type: String, default: "TR", index: true },
    groupKey: { type: String, required: true, index: true }, // TR_MARMARA
    label: { type: String, default: "" },

    // serbest kampanyalarda hedef olarak kullanılır
    members: { type: [String], default: [] }, // ["TR-34","TR-16", ...] veya district code

    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

geoGroupSchema.index({ country: 1, groupKey: 1 }, { unique: true });

module.exports = mongoose.model("GeoGroup", geoGroupSchema);
