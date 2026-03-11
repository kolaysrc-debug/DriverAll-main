// PATH: drivercv-backend/models/ServiceListing.js
// ----------------------------------------------------------
// Hizmet Veren (Service Provider) — Hizmet İlanı Modeli
// Adaylara yönelik kurs/eğitim/belge hizmetleri
// ----------------------------------------------------------

const mongoose = require("mongoose");
const { Schema } = mongoose;

const ServiceListingSchema = new Schema(
  {
    // Hizmet veren kullanıcı
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Temel bilgiler
    title: { type: String, required: true, trim: true },         // "SRC1 Eğitimi", "CE Ehliyet Kursu"
    description: { type: String, default: "", trim: true },       // Detaylı açıklama
    
    // Hizmet kategorisi — ServiceCategory.key ile eşleşir (dinamik)
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // İlgili kriter key'leri (FieldDefinition key'leri)
    // Örn: ["SRC1_TR", "SRC2_TR"] veya ["EHL_CE", "EHL_C"]
    relatedCriteriaKeys: [{ type: String }],

    // Hizmet verme yöntemi
    deliveryMethods: [{
      type: String,
      enum: ["yuz_yuze", "online", "uygulamali", "karma"],
    }],

    // Fiyat bilgisi
    price: {
      amount: { type: Number, default: null },         // Fiyat (TL)
      currency: { type: String, default: "TRY" },
      displayText: { type: String, default: "" },       // "2.500 TL'den başlayan", "Ücretsiz danışma"
      isNegotiable: { type: Boolean, default: false },  // Fiyat pazarlığa açık mı
    },

    // Süre bilgisi
    duration: {
      value: { type: Number, default: null },           // Süre değeri
      unit: { type: String, enum: ["saat", "gun", "hafta", "ay"], default: "gun" },
      displayText: { type: String, default: "" },       // "2 hafta", "40 saat"
    },

    // Lokasyon
    location: {
      countryCode: { type: String, default: "TR" },
      stateCode: { type: String, default: "" },         // İl kodu
      stateName: { type: String, default: "" },
      districtCode: { type: String, default: "" },      // İlçe kodu
      districtName: { type: String, default: "" },
      address: { type: String, default: "" },           // Açık adres
      label: { type: String, default: "" },             // "İstanbul / Kadıköy"
    },

    // İletişim
    contact: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      website: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
    },

    // Durum
    status: {
      type: String,
      enum: ["active", "passive", "draft"],
      default: "draft",
      index: true,
    },

    // Ek bilgiler
    tags: [{ type: String }],                             // Etiketler: "acil", "kampanya", "garantili"
    maxCapacity: { type: Number, default: null },         // Kontenjan
    startDate: { type: Date, default: null },             // Başlangıç tarihi (planlanan kurs)
    endDate: { type: Date, default: null },               // Bitiş tarihi

    // Meta
    viewCount: { type: Number, default: 0 },
    inquiryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ServiceListingSchema.index({ userId: 1, status: 1 });
ServiceListingSchema.index({ category: 1, status: 1 });
ServiceListingSchema.index({ "location.stateCode": 1 });

module.exports = mongoose.model("ServiceListing", ServiceListingSchema);
