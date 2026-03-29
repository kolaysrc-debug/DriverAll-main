const mongoose = require("mongoose");

const dashboardItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const dashboardGroupSchema = new mongoose.Schema(
  {
    groupId: { type: String, required: true },
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    items: [dashboardItemSchema],
  },
  { _id: false }
);

const navBarItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const dashboardLayoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDefault: { type: Boolean, default: false },
    groups: [dashboardGroupSchema],
    topBar: [navBarItemSchema],
    bottomBar: [navBarItemSchema],
  },
  { timestamps: true }
);

dashboardLayoutSchema.index({ userId: 1 }, { unique: true, sparse: true });
dashboardLayoutSchema.index(
  { isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

module.exports = mongoose.model("DashboardLayout", dashboardLayoutSchema);
