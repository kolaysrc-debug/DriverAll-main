// PATH: DriverAll-main/drivercv-backend/models/SubUserAction.js
// ----------------------------------------------------------
// SubUserAction
// - Alt kullanıcı aksiyon onay kuyruğu (owner approval)
// ----------------------------------------------------------

const mongoose = require("mongoose");

const subUserActionSchema = new mongoose.Schema(
  {
    parentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubUser",
      required: true,
      index: true,
    },

    actionType: {
      type: String,
      enum: ["job_publish", "ad_publish", "package_buy"],
      required: true,
      index: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    payload: {
      type: Object,
      default: {},
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    decidedAt: { type: Date, default: null },
    decidedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    decisionNote: { type: String, default: "" },

    executedAt: { type: Date, default: null },
    executionResult: { type: Object, default: {} },
  },
  { timestamps: true }
);

subUserActionSchema.index({ parentUserId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("SubUserAction", subUserActionSchema);
