// PATH: DriverAll-main/drivercv-backend/models/JobPost.js
// =======================================================
// JobPost modeli
// - İşveren (employer) ilan oluşturur (draft)
// - İnceleme/Onay süreci: draft -> submitted -> published / rejected
// - values: dinamik kriter değerleri (boolean/select/multiselect vb.)
// - requiredKeys / optionalKeys: özellikle boolean kriterlerde eşleştirme için
// =======================================================

const mongoose = require("mongoose");
const { Schema } = mongoose;

const JobPostSchema = new Schema(
  {
    employerId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Uluslararası bağlam
    country: { type: String, required: true, default: "TR", index: true },
    locale: { type: String, default: "" }, // örn: "tr", "de" (opsiyonel)

    // İlan temel meta
    title: { type: String, default: "" },     // MVP: opsiyonel
    city: { type: String, default: "" },
    about: { type: String, default: "" },     // MVP: opsiyonel serbest alan

    // Yaşam döngüsü
    status: {
      type: String,
      enum: ["draft", "submitted", "published", "rejected", "archived"],
      default: "draft",
      index: true,
    },
    rejectionReason: { type: String, default: "" },

    // Dinamik kriterler
    values: { type: Schema.Types.Mixed, default: {} },

    // Eşleştirme için hızlı alanlar (özellikle boolean kriterler)
    trueKeys: { type: [String], default: [], index: true },     // seçili boolean true’lar
    requiredKeys: { type: [String], default: [], index: true }, // zorunlu
    optionalKeys: { type: [String], default: [], index: true }, // opsiyonel

    // Yayın bilgileri
    submittedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

JobPostSchema.index({ employerId: 1, createdAt: -1 });
JobPostSchema.index({ country: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("JobPost", JobPostSchema);
