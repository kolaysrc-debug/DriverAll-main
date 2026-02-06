// PATH: DriverAll-main/drivercv-backend/models/User.js
// ----------------------------------------------------------
// User Model
// - Roles: admin | driver | employer | advertiser
// - Backward-compat: company (eski kayıtlar kırılmasın)
// ----------------------------------------------------------

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const advertiserLimitsSchema = new mongoose.Schema(
  {
    allowedCountries: { type: [String], default: [] },
    allowedCityCodes: { type: [String], default: [] },
    allowedDistrictCodes: { type: [String], default: [] },
    allowedPlacements: { type: [String], default: [] },
    maxAdTextLength: { type: Number, default: 800 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ["driver", "employer", "advertiser", "admin", "company"],
      default: "driver",
      index: true,
    },

    isActive: { type: Boolean, default: true },

    // advertiser için admin onayı, diğerleri için true
    isApproved: { type: Boolean, default: true },

    notes: { type: String, default: "" },

    // ---------------------------
    // Employer Company Profile (NEW)
    // ---------------------------
    companyName: { type: String, default: "", trim: true },       // görünen marka/firma adı
    companyLegalName: { type: String, default: "", trim: true },  // ünvan
    companyTaxNo: { type: String, default: "", trim: true },
    companyPhone: { type: String, default: "", trim: true },
    companyWebsite: { type: String, default: "", trim: true },

    companyCountry: { type: String, default: "TR", trim: true },
    companyCityCode: { type: String, default: "", trim: true },
    companyDistrictCode: { type: String, default: "", trim: true },
    companyAddressLine: { type: String, default: "", trim: true },

    advertiserLimits: { type: advertiserLimitsSchema, default: undefined },

    approvedAt: { type: Date, default: null },
    approvedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);
