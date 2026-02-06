// PATH: DriverAll-main/drivercv-backend/models/PackageOrder.js
// ----------------------------------------------------------
// PackageOrder (Purchase/Order)
// - Kullanıcı paket seçer -> order oluşur
// - paymentStatus: unpaid/paid...
// - orderStatus: created/active/...
// - creditsRemaining: paket hakları
// ----------------------------------------------------------

const mongoose = require("mongoose");
const { Schema } = mongoose;

const PackageOrderSchema = new Schema(
  {
    buyerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    packageId: { type: Schema.Types.ObjectId, ref: "Package", required: true, index: true },

    // Paket sonradan değişse bile order geçmişi bozulmasın diye snapshot tutuyoruz
    packageSnapshot: {
      type: Schema.Types.Mixed,
      default: {},
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed", "refunded"],
      default: "unpaid",
      index: true,
    },

    orderStatus: {
      type: String,
      enum: ["created", "active", "exhausted", "expired", "cancelled"],
      default: "created",
      index: true,
    },

    creditsRemaining: {
      jobCount: { type: Number, default: 0 },
      adCount: { type: Number, default: 0 },
    },

    paidAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },

    adminNote: { type: String, default: "" },
    updatedByAdminId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

PackageOrderSchema.index({ buyerUserId: 1, createdAt: -1 });
PackageOrderSchema.index({ paymentStatus: 1, orderStatus: 1, createdAt: -1 });

module.exports = mongoose.model("PackageOrder", PackageOrderSchema);
