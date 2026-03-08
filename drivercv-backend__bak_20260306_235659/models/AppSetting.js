// PATH: DriverAll-main/drivercv-backend/models/AppSetting.js
// ----------------------------------------------------------
// Uygulama ayarları (ülke bazlı)
// ----------------------------------------------------------

const mongoose = require("mongoose");

const appSettingSchema = new mongoose.Schema(
  {
    country: { type: String, default: "TR", index: true },

    // Employer job create alan limitleri
    jobTitleMaxChars: { type: Number, default: 80 },
    jobDescriptionMaxChars: { type: Number, default: 1000 },

    // Advertiser brief limitleri (ileri kullanım)
    adTextMaxChars: { type: Number, default: 120 },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

appSettingSchema.index({ country: 1 }, { unique: true });

module.exports = mongoose.model("AppSetting", appSettingSchema);
