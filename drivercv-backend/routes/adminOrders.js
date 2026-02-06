// PATH: DriverAll-main/drivercv-backend/routes/adminOrders.js
// ----------------------------------------------------------
// Admin Orders
// Base: /api/admin/orders
// - GET /api/admin/orders?paymentStatus=unpaid
// - PUT /api/admin/orders/:id/mark-paid
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const PackageOrder = require("../models/PackageOrder");
const { requireAuth, requireRoles } = require("../middleware/auth");

// LIST
router.get("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const paymentStatus = String(req.query.paymentStatus || "").trim();
    const orderStatus = String(req.query.orderStatus || "").trim();

    const q = {};
    if (paymentStatus) q.paymentStatus = paymentStatus;
    if (orderStatus) q.orderStatus = orderStatus;

    const items = await PackageOrder.find(q).sort({ createdAt: -1 }).limit(300).lean();
    res.json({ success: true, orders: items });
  } catch (err) {
    res.status(500).json({ success: false, message: "admin list orders failed", error: err.message });
  }
});

// MARK PAID (activate)
router.put("/:id/mark-paid", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body || {};

    const o = await PackageOrder.findById(id);
    if (!o) return res.status(404).json({ success: false, message: "not found" });

    o.paymentStatus = "paid";
    o.orderStatus = "active";
    o.paidAt = new Date();
    o.adminNote = String(b.adminNote || o.adminNote || "");
    o.updatedByAdminId = req.user?._id || null;

    await o.save();
    res.json({ success: true, order: o.toObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: "mark paid failed", error: err.message });
  }
});

module.exports = router;
