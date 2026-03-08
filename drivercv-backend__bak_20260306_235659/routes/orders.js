// PATH: DriverAll-main/drivercv-backend/routes/orders.js
// ----------------------------------------------------------
// My Orders
// Base: /api/orders
// - GET /api/orders/mine
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const PackageOrder = require("../models/PackageOrder");
const { requireAuth } = require("../middleware/auth");

router.get("/mine", requireAuth, async (req, res) => {
  try {
    const items = await PackageOrder.find({ buyerUserId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json({ success: true, orders: items });
  } catch (err) {
    res.status(500).json({ success: false, message: "list my orders failed", error: err.message });
  }
});

module.exports = router;
