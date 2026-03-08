const mongoose = require("mongoose");

const InstructionTaskSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },

    // Checklist alanları (talimat -> dev yaptı -> admin test -> ok / not ok)
    instruction: { type: String, default: "" },
    devDone: { type: Boolean, default: false, index: true },
    devDoneAt: { type: Date, default: null },
    adminTested: { type: Boolean, default: false, index: true },
    adminTestedAt: { type: Date, default: null },
    adminResult: {
      type: String,
      enum: ["", "ok", "not_ok"],
      default: "",
      index: true,
    },
    adminResultNote: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "in_progress", "blocked", "done", "canceled"],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    tags: { type: [String], default: [] },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    dueAt: { type: Date, default: null },
    doneAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InstructionTask", InstructionTaskSchema);
