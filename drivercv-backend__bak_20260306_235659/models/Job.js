// PATH: DriverAll-main/drivercv-backend/models/Job.js
// ----------------------------------------------------------
// Job ilanı - kriterler seçmeli, lokasyon motoru ile uyumlu
// + Paket/Yayın metası (admin onayı & süre yönetimi için)
// + Revizyon / Onay akışı
// ----------------------------------------------------------

const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    employerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },

    branchSnapshot: {
      _id: { type: mongoose.Schema.Types.ObjectId, default: null },
      code: { type: String, default: "" },
      displayName: { type: String, default: "" },
      locationLabel: { type: String, default: "" },
    },

    country: { type: String, default: "TR", index: true },

    // Lokasyon motorundan code’lar
    location: {
      countryCode: { type: String, default: "TR" }, // TR
      cityCode: { type: String, default: "" }, // TR-34 gibi / veya IST
      districtCode: { type: String, default: "" },
      label: { type: String, default: "" }, // ekranda gösterim için
    },

    title: { type: String, required: true },
    description: { type: String, default: "" },

    // Seçmeli kriterler (FieldDefinition key -> value)
    criteria: { type: Object, default: {} },

    // ----------------------------------------------------------
    // Durum (iş akışı)
    // draft     : employer taslak (admin görmez)
    // pending   : employer onaya gönderdi (admin listesinde)
    // published : admin onayladı (public listede)
    // rejected  : admin reddetti
    // archived  : employer/admin arşivledi
    // ----------------------------------------------------------
    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected", "archived"],
      default: "draft",
      index: true,
    },

    // Revizyon sayacı (published veya pending durumundan sonra değişiklik olursa artar)
    revision: { type: Number, default: 0 },
    approvedRevision: { type: Number, default: 0 },

    // Onaya gönderim / onay / red metası
    submittedAt: { type: Date, default: null },

    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    rejectedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    adminNote: { type: String, default: "" },

    // ----------------------------------------------------------
    // Paket/Yayın Metası (opsiyonel)
    // NOT: Bu alanlar TEK YERDE tanımlıdır; ikinci kez tanımlama yapmayın.
    // ----------------------------------------------------------
    publishedAt: { type: Date, default: null },

    placementKey: { type: String, default: "", index: true }, // vitrin/slot anahtarı

    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      default: null,
    },
    packageOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackageOrder",
      default: null,
      index: true,
    },
    packageName: { type: String, default: "" },

    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
