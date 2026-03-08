// PATH: DriverAll-main/drivercv-backend/routes/payments.js
// ----------------------------------------------------------
// My Payments (PaymentTransaction)
// Base: /api/payments
// - GET /api/payments/mine
// - POST /api/payments/orders/:orderId/manual-eft
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const PaymentTransaction = require("../models/PaymentTransaction");
const PackageOrder = require("../models/PackageOrder");
const { requireAuth } = require("../middleware/auth");

function safeString(v) {
  return String(v || "").trim();
}

function pickAmountCurrencyFromOrder(o) {
  const amount = Number(o?.packageSnapshot?.price || 0) || 0;
  const currency = safeString(o?.packageSnapshot?.currency || "TRY") || "TRY";
  return { amount, currency };
}

router.get("/mine", requireAuth, async (req, res) => {
  try {
    const items = await PaymentTransaction.find({ buyerUserId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ success: true, payments: items });
  } catch (err) {
    res.status(500).json({ success: false, message: "list my payments failed", error: err.message });
  }
});

router.post("/orders/:orderId/manual-eft", requireAuth, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const b = req.body || {};

    const order = await PackageOrder.findById(orderId).lean();
    if (!order) return res.status(404).json({ success: false, message: "order not found" });

    if (String(order.buyerUserId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "forbidden" });
    }

    const { amount, currency } = pickAmountCurrencyFromOrder(order);

    const idempotencyKey =
      safeString(req.headers["idempotency-key"]) || safeString(b.idempotencyKey) || "";

    if (idempotencyKey) {
      const existing = await PaymentTransaction.findOne({ idempotencyKey }).lean();
      if (existing) return res.json({ success: true, payment: existing, idempotent: true });
    }

    const providerRef = safeString(b.providerRef);

    const payment = await PaymentTransaction.create({
      orderId: order._id,
      buyerUserId: req.user._id,
      provider: "manual_eft",
      status: "pending",
      amount,
      currency,
      providerRef,
      idempotencyKey,
      meta: typeof b.meta === "object" && b.meta ? b.meta : {},
      createdByUserId: req.user._id,
    });

    res.json({ success: true, payment });
  } catch (err) {
    const msg = String(err?.message || "");
    if (msg.includes("duplicate key") || msg.includes("E11000")) {
      return res.status(409).json({ success: false, message: "duplicate payment (idempotency/providerRef)" });
    }
    res.status(500).json({ success: false, message: "create manual eft payment failed", error: err.message });
  }
});

module.exports = router;
