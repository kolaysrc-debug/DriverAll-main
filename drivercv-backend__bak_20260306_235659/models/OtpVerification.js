const mongoose = require("mongoose");

const otpVerificationSchema = new mongoose.Schema(
  {
    phoneE164: { type: String, required: true, trim: true, index: true },
    country: { type: String, required: true, trim: true, uppercase: true, index: true },

    channel: { type: String, required: true, trim: true },
    providerKey: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ["requested", "sent", "verified", "failed", "expired"],
      default: "requested",
      index: true,
    },

    providerRequestId: { type: String, default: "", trim: true },

    attempts: { type: Number, default: 0 },

    expiresAt: { type: Date, required: true, index: true },

    lastError: { type: String, default: "" },

    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },

    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

otpVerificationSchema.index({ phoneE164: 1, createdAt: -1 });

module.exports = mongoose.model("OtpVerification", otpVerificationSchema);
