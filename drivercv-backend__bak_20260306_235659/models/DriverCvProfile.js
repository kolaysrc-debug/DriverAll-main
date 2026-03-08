// DriverAll-main/drivercv-backend/models/DriverCvProfile.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Sürücü CV profili
 * - user: ilgili kullanıcı (her kullanıcı için tek CV)
 * - criteria: FieldDefinition.key -> değer (boolean, string, number, array, date vs)
 */
const DriverCvProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Basit temel alanlar (istersen ileride genişletebiliriz)
    country: { type: String, default: "TR" },
    fullName: { type: String },
    city: { type: String },
    phone: { type: String },
    birthYear: { type: Number },
    experienceYears: { type: Number },

    // Dinamik kriterler: key = FieldDefinition.key
    criteria: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DriverCvProfile", DriverCvProfileSchema);
