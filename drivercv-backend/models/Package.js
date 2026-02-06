// PATH: DriverAll-main/drivercv-backend/models/Package.js
// ----------------------------------------------------------
// Package (Offer/Plan) Model
// - Admin oluşturur
// - Job/Ad/Both destekler
// - Placement + duration kuralları + kredi (credits) tutar
// ----------------------------------------------------------

const mongoose = require("mongoose");
const { Schema } = mongoose;

const PackageSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["JOB", "AD", "BOTH"],
      default: "JOB",
      index: true,
    },

    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true, index: true }, // örn: JOB_BASIC_TR

    description: { type: String, default: "" },

    country: { type: String, default: "ALL", index: true }, // ALL / TR / DE ...

    currency: { type: String, default: "TRY" },
    price: { type: Number, default: 0 }, // şimdilik number, ileride cents

    credits: {
      jobCount: { type: Number, default: 0 },
      adCount: { type: Number, default: 0 },
    },

    rules: {
      allowedPlacements: { type: [String], default: [] }, // HOME_BAR_1, HOME_BAR_2...
      maxDurationDaysByPlacement: { type: Schema.Types.Mixed, default: {} }, // { HOME_BAR_1: 3 }
      requiresApproval: { type: Boolean, default: true },
    },

    active: { type: Boolean, default: true, index: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PackageSchema.index({ type: 1, country: 1, active: 1, createdAt: -1 });

module.exports = mongoose.model("Package", PackageSchema);
