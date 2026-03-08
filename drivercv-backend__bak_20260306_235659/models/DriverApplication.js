// PATH: DriverAll-main/drivercv-backend/models/DriverApplication.js
// ----------------------------------------------------------
// DriverApplication
// - job -> ref: "Job"  (SİZİN PROJEDEKİ İLAN MODELİ)
// - employerUserId -> ilanın sahibi (employer dashboard sorguları için)
// - NEW: employerNote + labelColor + meetingUrl + score
// ----------------------------------------------------------

const mongoose = require("mongoose");
const { Schema } = mongoose;

const DriverApplicationSchema = new Schema(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    driver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // İLAN SAHİBİ (Employer listeleri için kritik)
    employerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Driver'ın başvuru notu
    note: { type: String, default: "" },

    status: {
      type: String,
      enum: ["new", "reviewed", "shortlisted", "rejected", "hired"],
      default: "new",
      index: true,
    },

    score: { type: Number, default: null },

    employerNote: { type: String, default: "" },

    labelColor: {
      type: String,
      enum: ["none", "red", "yellow", "orange", "green"],
      default: "none",
      index: true,
    },

    meetingUrl: { type: String, default: "" },

    cvSnapshot: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// aynı driver aynı job'a 1 kez başvurabilsin
DriverApplicationSchema.index({ job: 1, driver: 1 }, { unique: true });

module.exports = mongoose.model("DriverApplication", DriverApplicationSchema);
