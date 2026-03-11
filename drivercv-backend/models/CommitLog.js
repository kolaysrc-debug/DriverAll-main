// PATH: drivercv-backend/models/CommitLog.js
// ----------------------------------------------------------
// Commit İzleme — her snapshot/commit alındığında kaydedilir
// ----------------------------------------------------------

const mongoose = require("mongoose");
const { Schema } = mongoose;

const CommitLogSchema = new Schema(
  {
    // Git commit hash (kısa veya uzun)
    hash: { type: String, required: true, trim: true, index: true },

    // Commit mesajı
    message: { type: String, required: true, trim: true },

    // Commit tarihi
    committedAt: { type: Date, required: true, index: true },

    // Bu commit'te yapılanların özeti (markdown destekli)
    summary: { type: String, default: "", trim: true },

    // Değişen dosya sayısı
    filesChanged: { type: Number, default: 0 },

    // Eklenen satır
    insertions: { type: Number, default: 0 },

    // Silinen satır
    deletions: { type: Number, default: 0 },

    // Etkilenen modüller / alanlar (etiket olarak)
    tags: [{ type: String, trim: true }],

    // Önemli notlar (breaking change, dikkat edilecekler vb.)
    notes: { type: String, default: "", trim: true },

    // Build durumu
    buildStatus: {
      type: String,
      enum: ["unknown", "pass", "fail"],
      default: "unknown",
    },

    // TypeScript durumu
    tsStatus: {
      type: String,
      enum: ["unknown", "pass", "fail"],
      default: "unknown",
    },

    // Kim commit aldı
    author: { type: String, default: "Cascade AI", trim: true },

    // Admin tarafından onay durumu
    adminReviewed: { type: Boolean, default: false },
    adminNote: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommitLog", CommitLogSchema);
