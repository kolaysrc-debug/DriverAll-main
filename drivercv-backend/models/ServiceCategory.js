// PATH: drivercv-backend/models/ServiceCategory.js
// ----------------------------------------------------------
// Hizmet Veren Kategori Motoru — Dinamik
// Admin panelinden yönetilir. Sabit enum kullanılmaz.
// ----------------------------------------------------------

const mongoose = require("mongoose");
const { Schema } = mongoose;

const ServiceCategorySchema = new Schema(
  {
    // Teknik anahtar — slug benzeri
    key: { type: String, required: true, unique: true, trim: true, index: true },

    // Görünen isim
    label: { type: String, required: true, trim: true },

    // Kısa açıklama
    description: { type: String, default: "", trim: true },

    // İkon (emoji veya icon class)
    icon: { type: String, default: "" },

    // İlgili kriter key'leri (FieldDefinition key'leri ile eşleşme)
    // Örn: ["SRC1_TR", "SRC2_TR", "SRC3_TR", "SRC4_TR", "SRC5_TR"]
    relatedCriteriaKeys: [{ type: String }],

    // İlgili FieldGroup key'leri
    // Örn: ["SRC_TR", "EHL_TR"]
    relatedGroupKeys: [{ type: String }],

    // Sıralama
    sortOrder: { type: Number, default: 0, index: true },

    // Aktif / pasif
    active: { type: Boolean, default: true, index: true },

    // Ülke kısıtı
    country: { type: String, default: "ALL", index: true },

    // Meta (esnek alan)
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceCategory", ServiceCategorySchema);
