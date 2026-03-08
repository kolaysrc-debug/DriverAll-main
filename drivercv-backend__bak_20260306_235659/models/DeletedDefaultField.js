// DriverAll-main/drivercv-backend/models/DeletedDefaultField.js

const mongoose = require("mongoose");

const DeletedDefaultFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    deletedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

DeletedDefaultFieldSchema.index({ key: 1 }, { unique: true });

module.exports = mongoose.model("DeletedDefaultField", DeletedDefaultFieldSchema);
