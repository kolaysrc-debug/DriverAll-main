// PATH: DriverAll-main/drivercv-backend/models/Location.js
// ----------------------------------------------------------
// Location Model (Mongo)
// - country: TR, DE...
// - level: country/state/city/district
// - code: TR-34 (state), TR-34-KADIKOY (district) gibi
// - parentCode: district -> TR-34 gibi
// ----------------------------------------------------------

const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, index: true }, // "TR"
    level: {
      type: String,
      required: true,
      index: true,
      enum: ["country", "state", "city", "district"],
    },
    code: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },

    // district -> state bağlamak için
    parentCode: { type: String, default: null, index: true },

    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },

    // Kaynak bilgisi (manual / geonames)
    source: { type: String, default: "manual" },
    geonameId: { type: Number, default: null },
  },
  { timestamps: true }
);

// Aynı ülke+seviye+code tekrar eklenmesin
LocationSchema.index({ country: 1, level: 1, code: 1 }, { unique: true });

module.exports =
  mongoose.models.Location ||
  mongoose.model("Location", LocationSchema, "locations");
