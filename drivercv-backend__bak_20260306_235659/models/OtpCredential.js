const mongoose = require("mongoose");

const otpCredentialSchema = new mongoose.Schema(
  {
    ref: { type: String, required: true, trim: true, index: true },
    providerKey: { type: String, required: true, trim: true },

    isActive: { type: Boolean, default: true },

    accountSid: { type: String, default: "", trim: true },
    verifyServiceSid: { type: String, default: "", trim: true },

    authTokenEnc: { type: Object, default: null },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

otpCredentialSchema.index({ ref: 1, providerKey: 1 }, { unique: true });

module.exports = mongoose.model("OtpCredential", otpCredentialSchema);
