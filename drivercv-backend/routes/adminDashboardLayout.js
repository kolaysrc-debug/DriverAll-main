const express = require("express");
const router = express.Router();
const DashboardLayout = require("../models/DashboardLayout");
const { requireAuth, requireRoles } = require("../middleware/auth");

router.use(requireAuth);

router.get("/my", async (req, res) => {
  try {
    let layout = await DashboardLayout.findOne({ userId: req.user._id }).lean();
    if (!layout) {
      layout = await DashboardLayout.findOne({ isDefault: true }).lean();
    }
    res.json({ layout: layout || null, isCustom: !!layout?.userId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/default", async (req, res) => {
  try {
    const layout = await DashboardLayout.findOne({ isDefault: true }).lean();
    res.json({ layout: layout || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/my", async (req, res) => {
  try {
    const { groups, topBar, bottomBar } = req.body;

    const update = {};
    if (Array.isArray(groups)) update.groups = groups;
    if (Array.isArray(topBar)) update.topBar = topBar;
    if (Array.isArray(bottomBar)) update.bottomBar = bottomBar;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "groups, topBar veya bottomBar dizisi gerekli" });
    }

    let layout = await DashboardLayout.findOne({ userId: req.user._id });
    if (layout) {
      Object.assign(layout, update);
      await layout.save();
    } else {
      layout = await DashboardLayout.create({
        userId: req.user._id,
        isDefault: false,
        ...update,
      });
    }
    res.json({ layout, message: "Düzen kaydedildi" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/my", async (req, res) => {
  try {
    await DashboardLayout.findOneAndDelete({ userId: req.user._id });
    res.json({ message: "Varsayılan düzene dönüldü" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/default", requireRoles("admin"), async (req, res) => {
  try {
    const { groups, topBar, bottomBar } = req.body;

    const update = {};
    if (Array.isArray(groups)) update.groups = groups;
    if (Array.isArray(topBar)) update.topBar = topBar;
    if (Array.isArray(bottomBar)) update.bottomBar = bottomBar;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "groups, topBar veya bottomBar dizisi gerekli" });
    }

    let layout = await DashboardLayout.findOne({ isDefault: true });
    if (layout) {
      Object.assign(layout, update);
      await layout.save();
    } else {
      layout = await DashboardLayout.create({
        userId: null,
        isDefault: true,
        ...update,
      });
    }
    res.json({ layout, message: "Varsayılan düzen kaydedildi" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
