// PATH: DriverAll-main/drivercv-backend/routes/adminPayments.js
// ----------------------------------------------------------
// Admin Payments (PaymentTransaction)
// Base: /api/admin/payments
// - GET /api/admin/payments?status=pending&provider=manual_eft
// - PUT /api/admin/payments/:id/approve
// - PUT /api/admin/payments/:id/reject
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const PaymentTransaction = require("../models/PaymentTransaction");
const PackageOrder = require("../models/PackageOrder");
const User = require("../models/User");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { notifyPaymentApproved } = require("../services/emailService");

function safeString(v) {
  return String(v || "").trim();
}

function parseDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

async function activateOrderFromPayment(orderId, adminUserId, options) {
  const order = await PackageOrder.findById(orderId);
  if (!order) return null;

  if (options && options.expiresAt !== undefined) {
    order.expiresAt = parseDateOrNull(options.expiresAt);
  }

  if (options && options.creditsRemaining && typeof options.creditsRemaining === "object") {
    const cr = options.creditsRemaining;
    if (cr.adCount !== undefined) order.creditsRemaining.adCount = Number(cr.adCount || 0) || 0;
    if (cr.jobCount !== undefined) order.creditsRemaining.jobCount = Number(cr.jobCount || 0) || 0;
    if (cr.jobPostCount !== undefined) order.creditsRemaining.jobPostCount = Number(cr.jobPostCount || 0) || 0;
    if (cr.cvViewCount !== undefined) order.creditsRemaining.cvViewCount = Number(cr.cvViewCount || 0) || 0;
    if (cr.cvSaveCount !== undefined) order.creditsRemaining.cvSaveCount = Number(cr.cvSaveCount || 0) || 0;
  }

  order.paymentStatus = "paid";
  order.orderStatus = "active";
  if (!order.paidAt) order.paidAt = new Date();
  order.updatedByAdminId = adminUserId || null;
  if (options && options.adminNote !== undefined) {
    order.adminNote = safeString(options.adminNote);
  }

  await order.save();
  return order;
}

// LIST
router.get("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const status = safeString(req.query.status);
    const provider = safeString(req.query.provider);
    const orderId = safeString(req.query.orderId);

    const q = {};
    if (status) q.status = status;
    if (provider) q.provider = provider;
    if (orderId) q.orderId = orderId;

    const items = await PaymentTransaction.find(q).sort({ createdAt: -1 }).limit(500).lean();
    res.json({ success: true, payments: items });
  } catch (err) {
    res.status(500).json({ success: false, message: "admin list payments failed", error: err.message });
  }
});

// APPROVE
router.put("/:id/approve", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body || {};

    const p = await PaymentTransaction.findById(id);
    if (!p) return res.status(404).json({ success: false, message: "not found" });

    if (p.status === "approved") {
      return res.json({ success: true, payment: p.toObject(), alreadyApproved: true });
    }
    if (["rejected", "cancelled"].includes(p.status)) {
      return res.status(409).json({ success: false, message: `cannot approve in status=${p.status}` });
    }

    const order = await activateOrderFromPayment(p.orderId, req.user?._id || null, {
      expiresAt: b.expiresAt,
      creditsRemaining: b.creditsRemaining,
      adminNote: b.adminNote,
    });
    if (!order) return res.status(404).json({ success: false, message: "order not found" });

    p.status = "approved";
    p.approvedAt = new Date();
    p.rejectedAt = null;
    p.updatedByAdminId = req.user?._id || null;
    p.adminNote = safeString(b.adminNote || p.adminNote || "");

    await p.save();

    // Email bildirimi (async, hata durumunda bloklamaz)
    try {
      const buyer = await User.findById(order.buyerUserId).lean();
      if (buyer?.email) {
        const pkgName = order.packageSnapshot?.name || "";
        notifyPaymentApproved({ to: buyer.email, userName: buyer.name, orderId: order._id, packageName: pkgName }).catch(() => {});
      }
    } catch (_) { /* email failure should not block response */ }

    res.json({ success: true, payment: p.toObject(), order: order.toObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: "approve payment failed", error: err.message });
  }
});

// REJECT
router.put("/:id/reject", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body || {};

    const p = await PaymentTransaction.findById(id);
    if (!p) return res.status(404).json({ success: false, message: "not found" });

    if (p.status === "rejected") {
      return res.json({ success: true, payment: p.toObject(), alreadyRejected: true });
    }
    if (p.status === "approved") {
      return res.status(409).json({ success: false, message: "cannot reject approved payment" });
    }

    p.status = "rejected";
    p.rejectedAt = new Date();
    p.updatedByAdminId = req.user?._id || null;
    p.adminNote = safeString(b.adminNote || p.adminNote || "");

    await p.save();
    res.json({ success: true, payment: p.toObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: "reject payment failed", error: err.message });
  }
});

module.exports = router;
