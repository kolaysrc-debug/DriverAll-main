// DriverAll-main/drivercv-backend/models/FieldDefinition.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

// ----------------------------------------------------------
// Alt şema: otomatik uyarı ayarları
// ----------------------------------------------------------
const NotificationSchema = new Schema(
  {
    trackExpiry: { type: Boolean, default: false }, // süresi takip edilsin mi?
    startBefore: {
      unit: { type: String, enum: ["day", "month", "year"], default: "month" },
      value: { type: Number, default: 1 },
    },
    repeatEvery: {
      unit: { type: String, enum: ["day", "month"], default: "month" },
      value: { type: Number, default: 1 },
    },
  },
  { _id: false }
);

// ----------------------------------------------------------
// Ana şema: FieldDefinition
// Kriter / alan motorunun backend modeli
// ----------------------------------------------------------
const FieldDefinitionSchema = new Schema(
  {
    // Teknik kimlikler
    key: { type: String, required: true, unique: true }, // örn: "SRC1_TR"
    label: { type: String, required: true },             // örn: "SRC1 Belgesi"

    // Kısa açıklama (UI'da tooltip / kısa metin)
    description: { type: String, default: "" },

    // FieldGroup entegrasyonu
    // Admin grup motorundan türeyen kriterlerde hangi gruba ait olduğunu tutar
    groupKey: { type: String, default: null, index: true },
    // UI’da groupLabel yerine kullanılacak override (opsiyonel)
    groupLabelOverride: { type: String, default: null },

    // Hangi ekrana ait?
    // profile = aday profili (CV)
    // job     = ilan
    // global  = ortak / sistem geneli
    category: {
      type: String,
      enum: ["profile", "job", "global"],
      default: "profile",
      index: true,
    },

    // Görsel gruplama – kriter ekranında başlık olarak kullanabiliriz
    // örn: "SRC Belgeleri", "Ehliyet Sınıfları", "ADR Eğitimleri"
    groupLabel: { type: String, default: null },

    // Ülke sınırlaması: "ALL" veya "TR", "DE" gibi ISO kodu
    country: { type: String, default: "ALL", index: true },

    // Alan tipi / veri tipi
    fieldType: {
      type: String,
      enum: ["boolean", "date", "string", "number", "select"],
      default: "boolean",
    },

    // Form üzerinde nasıl görünecek?
    uiType: {
      type: String,
      enum: ["text", "number", "boolean", "date", "select", "multiselect"],
      default: "boolean",
    },

    required: { type: Boolean, default: false },
    active: { type: Boolean, default: true },

    // Bu alan nerelerde kullanılacak?
    showInCv: { type: Boolean, default: true },          // CV formu
    showInJobFilter: { type: Boolean, default: true },   // İlan filtreleri

    // Bu alanın seçenekleri bir FieldGroup’tan mı geliyor?
    // Örn: Ehliyet sınıfı alanı → optionsGroupKey = "LICENCE_TR"
    //      SRC türü          → optionsGroupKey = "SRC_TR"
    optionsGroupKey: { type: String, default: null },

    // Bölgesel geçerlilik / zone bilgileri (Unified Rule Engine)
    zones: [{ type: String }],

    // Geçerlilik / süre bilgileri (genel model)
    requiresIssueDate: { type: Boolean, default: false }, // CV’de "belge tarihi" sorulsun mu?
    hasExpiry: { type: Boolean, default: false },         // son kullanım tarihi var mı?

    // Basit modelde doğrudan X yıl geçerli
    validityYears: { type: Number, default: null },

    // expiryMode:
    //  - none              : süre/yaş kontrolü yok
    //  - age               : yaş sınırı (örn. 65)
    //  - durationFromIssue : alındığı tarihten itibaren X yıl
    expiryMode: {
      type: String,
      enum: ["none", "age", "durationFromIssue"],
      default: "none",
    },

    maxAge: { type: Number, default: null },                // age modunda (örn. 65)
    durationYearsFromIssue: { type: Number, default: null }, // durationFromIssue modunda

    // ADR gibi özel modeller için:
    //  "simple"    : normal süre
    //  "adr_linked": Temel + Tank / Sınıf-1 / Sınıf-7 ilişkili yapı
    //  "none"      : hiç kontrol yok
    validityModel: {
      type: String,
      default: "simple",
    },

    // Diğer alanlarla ilişkiler (kapsama kuralları)
    // Örn: "SRC1" → coversKeys: ["SRC2"] (uluslararası yolcu → yurtiçi yolcu)
    coversKeys: [{ type: String }],
    requiresKeys: [{ type: String }],

    // Kriterin kalite / ağırlık puanı (ileride eşleştirme için)
    qualityScore: { type: Number, default: null },

    // Otomatik uyarı ayarları (örneğin belge bitişine 1 ay kala)
    notification: { type: NotificationSchema, default: undefined },

    // Rollere/engine’lere göre kullanım alanı (şimdilik opsiyonel)
    roles: [{ type: String }],
    engines: {
      profile: { type: Boolean, default: true },
      jobs: { type: Boolean, default: false },
      searchFilter: { type: Boolean, default: false },
      matching: { type: Boolean, default: false },
    },

    // Esnek alan – ADR özel senaryoları vb. için
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FieldDefinition", FieldDefinitionSchema);
