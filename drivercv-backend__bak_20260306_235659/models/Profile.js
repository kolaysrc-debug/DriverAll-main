// PATH: DriverAll-main/drivercv-backend/models/Profile.js
// ----------------------------------------------------------
// Profile (Driver / Employer / Advertiser / Admin)
// - Ortak profil alanları
// - Lokasyon standardı: location.countryCode + location.cityCode + location.districtCode
//   TR için:
//     - driver: il + ilçe zorunlu
//     - employer/advertiser: il zorunlu, ilçe opsiyonel
// ----------------------------------------------------------

const mongoose = require("mongoose");
const { Schema } = mongoose;

const profileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    role: { type: String, default: "driver" },

    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },

    // Ülke (legacy + UI için)
    country: { type: String, default: "TR" },

    // Legacy alan (eski UI'lar bozulmasın diye tutuyoruz)
    // Yeni standardımız: location.cityCode + location.districtCode
    city: { type: String, default: "" },
    district: { type: String, default: "" },

    // Yeni lokasyon standardı
    location: {
      countryCode: { type: String, default: "TR" }, // TR
      cityCode: { type: String, default: "" }, // TR-34 gibi (bizim "il" kodu)
      districtCode: { type: String, default: "" }, // TR-34-xxxx
      label: { type: String, default: "" }, // "Ankara / Çankaya" gibi
    },

    about: { type: String, default: "" },
    experienceYears: { type: Number, default: null },

    // serbest alanlar (ileride genişleteceğiz)
    dynamicValues: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Profile || mongoose.model("Profile", profileSchema);
