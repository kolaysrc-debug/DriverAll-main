// DriverAll-main/drivercv-backend/models/Cv.js

const mongoose = require("mongoose");

const CvSchema = new mongoose.Schema(
  {
    // Bu CV hangi kullanıcıya ait?
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true, // her kullanıcı için tek CV kaydı
    },

    // Kriter motorundan gelen ham değerler
    values: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cv", CvSchema);