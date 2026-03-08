// PATH: DriverAll-main/drivercv-backend/models/CompanyProfile.js
// ----------------------------------------------------------
// Firma Profili (Advertiser için)
// - Kısıtlı sektörlerde hedefleme bu profile göre kilitlenir
// ----------------------------------------------------------

const mongoose = require("mongoose");

const companyProfileSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },

    // Firma kimlik
    legalName: { type: String, default: "" },
    taxNo: { type: String, default: "" },
    taxOffice: { type: String, default: "" },
    addressText: { type: String, default: "" },

    country: { type: String, default: "TR", index: true }, // TR, DE...
    provinceCode: { type: String, default: "" }, // TR-34 gibi
    districtCodes: { type: [String], default: [] }, // TR-34-TUZLA gibi (1+)

    // İş kolu: admin onayı ile kesinleşir
    businessType: {
      type: String,
      default: "OTHER",
      index: true,
      // öneri enum; genişleyebilir
      enum: ["DRIVING_SCHOOL", "SRC_CENTER", "SRC5_CENTER", "PSIKOTEKNIK", "LOGISTICS", "OTHER"],
    },

    // Admin doğrulama
    verifiedStatus: { type: String, default: "pending", enum: ["pending", "verified", "rejected"], index: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },
    adminNote: { type: String, default: "" },

    // Admin: Reklam hedefleme istisnası (policy'yi geçersiz kılar)
    adTargetingOverride: {
      enabled: { type: Boolean, default: false },
      // country | province | district | geoGroup
      geoLevel: { type: String, default: "", enum: ["", "country", "province", "district", "geoGroup"] },
      geoTargets: { type: [String], default: [] },
      note: { type: String, default: "" },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      updatedAt: { type: Date, default: null },
    },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanyProfile", companyProfileSchema);
