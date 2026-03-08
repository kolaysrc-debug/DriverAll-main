// PATH: DriverAll-main/drivercv-backend/models/PaymentTransaction.js
// ----------------------------------------------------------
// PaymentTransaction (Ledger)
// - Order'a bağlı tahsilat denemesi / kaydı
// - Manuel EFT/Havale ve ileride Iyzico/Banka gibi kaynakları tek modelde toplar
// ----------------------------------------------------------

const mongoose = require("mongoose");
const { Schema } = mongoose;

const PaymentTransactionSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "PackageOrder", required: true, index: true },
    buyerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    provider: {
      type: String,
      enum: ["manual_eft", "iyzico"],
      default: "manual_eft",
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },

    amount: { type: Number, default: 0 },
    currency: { type: String, default: "TRY" },

    // Provider tarafındaki referans (örn: dekont no, iyzico paymentId). Opsiyonel.
    providerRef: { type: String, default: "", trim: true },

    // İstemcinin aynı isteği tekrar gönderdiğinde duplicate oluşmasın (idempotency)
    idempotencyKey: { type: String, default: "", trim: true },

    meta: { type: Schema.Types.Mixed, default: {} },

    adminNote: { type: String, default: "" },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },

    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedByAdminId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

PaymentTransactionSchema.index({ orderId: 1, createdAt: -1 });
PaymentTransactionSchema.index({ buyerUserId: 1, createdAt: -1 });
PaymentTransactionSchema.index(
  { provider: 1, providerRef: 1 },
  { unique: true, sparse: true, partialFilterExpression: { providerRef: { $type: "string", $ne: "" } } }
);
PaymentTransactionSchema.index(
  { idempotencyKey: 1 },
  { unique: true, sparse: true, partialFilterExpression: { idempotencyKey: { $type: "string", $ne: "" } } }
);

module.exports = mongoose.model("PaymentTransaction", PaymentTransactionSchema);
