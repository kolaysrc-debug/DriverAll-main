// PATH: DriverAll-main/drivercv-backend/models/AdPackage.js
// ----------------------------------------------------------
// AdPackage (Reklam Paketi)
// - Admin tanımlar
// - Reklam verme akışında seçilir
// ----------------------------------------------------------

const mongoose = require("mongoose");

const placementSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },          // örn: HOME_TOP_BANNER
    label: { type: String, default: "" },           // örn: Ana Sayfa Üst Banner
    maxDays: { type: Number, default: 3 },          // bu placement için max süre (gün)
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const adPackageSchema = new mongoose.Schema(
  {
    // Paket adı
    name: { type: String, required: true, index: true },

    // Ülke kısıtı (ALL veya TR/DE/NL...)
    country: { type: String, default: "ALL", index: true },

    // Bölge seviyesi (şimdilik meta bilgi; ileride lokasyon motoru ile bağlayacağız)
    // global | country | state | city | district
    geoLevel: { type: String, default: "country" },

    // Paket içinde izin verilen reklam yerleri
    placements: { type: [placementSchema], default: [] },

    // Paket fiyatı
    price: { type: Number, default: 0 },
    currency: { type: String, default: "TRY" },

    // Aynı anda kaç reklam hazırlanabilir (paket limiti)
    maxAds: { type: Number, default: 1 },

    // Paket aktif mi
    active: { type: Boolean, default: true, index: true },

    // İleride: kriter kısıtları vs için boş alan
    rules: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdPackage", adPackageSchema);
