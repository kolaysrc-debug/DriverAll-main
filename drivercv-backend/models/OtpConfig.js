const mongoose = require("mongoose");

const providerRefSchema = new mongoose.Schema(
  {
    providerKey: { type: String, required: true, trim: true },
    credentialRef: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const otpConfigSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true, uppercase: true, index: true },

    isActive: { type: Boolean, default: true },

    channelPriority: { type: [String], default: ["whatsapp", "sms"] },

    providers: {
      whatsapp: { type: [providerRefSchema], default: [] },
      sms: { type: [providerRefSchema], default: [] },
    },

    brandName: { type: String, default: "DriverAll", trim: true },
    locale: { type: String, default: "tr", trim: true },

    otpLength: { type: Number, default: 6 },
    ttlSeconds: { type: Number, default: 300 },

    resendCooldownSeconds: { type: Number, default: 60 },
    maxRequestsPerPhonePerDay: { type: Number, default: 10 },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

otpConfigSchema.index({ country: 1 }, { unique: true });

module.exports = mongoose.model("OtpConfig", otpConfigSchema);
