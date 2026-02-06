// PATH: DriverAll-main/drivercv-backend/models/AdPlacement.js
// ----------------------------------------------------------
// Reklam Yerleşimi (Placement Inventory)
// - 1 sabit (fixed) + N kayar (carousel) konsepti burada tanımlanır
// - kayarda max merge 2 (senin kararın)
// ----------------------------------------------------------

const mongoose = require("mongoose");

const adPlacementSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, index: true }, // HOME_TOP, DASHBOARD_RIGHT, CV_SIDE...
    label: { type: String, default: "" },
    pageKey: { type: String, default: "" }, // home, dashboard, cv, job_builder...

    // fixed
    fixedEnabled: { type: Boolean, default: true },
    fixedUnitsTotal: { type: Number, default: 8 }, // sabit: eşit alan birimleri
    fixedAllowMerge: { type: Boolean, default: true },
    fixedMaxMergeUnits: { type: Number, default: 4 }, // sabitte 3-4-5 isteyebilirsin; şimdilik 4

    // carousel
    carouselEnabled: { type: Boolean, default: true },
    carouselAllowMerge: { type: Boolean, default: true },
    carouselMaxMergeUnits: { type: Number, default: 2 }, // ✅ kararın
    carouselSpeedMs: { type: Number, default: 4500 }, // bölgesel override’ı Sprint-2
    carouselMaxItems: { type: Number, default: 10 }, // bölgesel override’ı Sprint-2

    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

adPlacementSchema.index({ key: 1 }, { unique: true });

module.exports = mongoose.model("AdPlacement", adPlacementSchema);
