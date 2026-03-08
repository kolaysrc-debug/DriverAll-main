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
const Package = require("../models/Package");
const { requireAuth, requireRoles } = require("../middleware/auth");

function parseDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

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
    if (b.expiresAt !== undefined) {
      o.expiresAt = parseDateOrNull(b.expiresAt);
    }

    if (b.creditsRemaining && typeof b.creditsRemaining === "object") {
      const cr = b.creditsRemaining;
      if (cr.adCount !== undefined) o.creditsRemaining.adCount = Number(cr.adCount || 0) || 0;
      if (cr.jobCount !== undefined) o.creditsRemaining.jobCount = Number(cr.jobCount || 0) || 0;
      if (cr.jobPostCount !== undefined) o.creditsRemaining.jobPostCount = Number(cr.jobPostCount || 0) || 0;
      if (cr.cvViewCount !== undefined) o.creditsRemaining.cvViewCount = Number(cr.cvViewCount || 0) || 0;
      if (cr.cvSaveCount !== undefined) o.creditsRemaining.cvSaveCount = Number(cr.cvSaveCount || 0) || 0;
    }

    o.adminNote = String(b.adminNote || o.adminNote || "");
    o.updatedByAdminId = req.user?._id || null;

    await o.save();
    res.json({ success: true, order: o.toObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: "mark paid failed", error: err.message });
  }
});

// UPDATE (admin edit)
router.put("/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body || {};

    const o = await PackageOrder.findById(id);
    if (!o) return res.status(404).json({ success: false, message: "not found" });

    if (b.paymentStatus != null) {
      const ps = String(b.paymentStatus || "").trim();
      if (["unpaid", "paid", "failed", "refunded"].includes(ps)) {
        o.paymentStatus = ps;
      }
    }
    if (b.orderStatus != null) {
      const os = String(b.orderStatus || "").trim();
      if (["created", "active", "exhausted", "expired", "cancelled"].includes(os)) {
        o.orderStatus = os;
      }
    }
    if (b.expiresAt !== undefined) {
      o.expiresAt = parseDateOrNull(b.expiresAt);
    }

    if (b.creditsRemaining && typeof b.creditsRemaining === "object") {
      const cr = b.creditsRemaining;
      if (cr.adCount !== undefined) o.creditsRemaining.adCount = Number(cr.adCount || 0) || 0;
      if (cr.jobCount !== undefined) o.creditsRemaining.jobCount = Number(cr.jobCount || 0) || 0;
      if (cr.jobPostCount !== undefined) o.creditsRemaining.jobPostCount = Number(cr.jobPostCount || 0) || 0;
      if (cr.cvViewCount !== undefined) o.creditsRemaining.cvViewCount = Number(cr.cvViewCount || 0) || 0;
      if (cr.cvSaveCount !== undefined) o.creditsRemaining.cvSaveCount = Number(cr.cvSaveCount || 0) || 0;
    }

    if (b.adminNote !== undefined) {
      o.adminNote = String(b.adminNote || "");
    }

    o.updatedByAdminId = req.user?._id || null;
    await o.save();
    res.json({ success: true, order: o.toObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: "update order failed", error: err.message });
  }
});

router.put("/:id/cancel", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body || {};
    const o = await PackageOrder.findById(id);
    if (!o) return res.status(404).json({ success: false, message: "not found" });

    o.orderStatus = "cancelled";
    o.adminNote = String(b.adminNote || o.adminNote || "");
    o.updatedByAdminId = req.user?._id || null;
    await o.save();
    res.json({ success: true, order: o.toObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: "cancel failed", error: err.message });
  }
});

router.put("/:id/expire", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body || {};
    const o = await PackageOrder.findById(id);
    if (!o) return res.status(404).json({ success: false, message: "not found" });

    o.orderStatus = "expired";
    if (!o.expiresAt) o.expiresAt = new Date();
    o.adminNote = String(b.adminNote || o.adminNote || "");
    o.updatedByAdminId = req.user?._id || null;
    await o.save();
    res.json({ success: true, order: o.toObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: "expire failed", error: err.message });
  }
});

// REFRESH SNAPSHOT FROM PACKAGE
// PUT /api/admin/orders/:id/refresh-snapshot
// body: { overwriteCredits?: boolean, adminNote?: string }
router.put("/:id/refresh-snapshot", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body || {};

    const o = await PackageOrder.findById(id);
    if (!o) return res.status(404).json({ success: false, message: "not found" });

    const p = await Package.findById(o.packageId).lean();
    if (!p || p.deletedAt || p.active === false) {
      return res.status(400).json({ success: false, message: "package not found or inactive" });
    }

    o.packageSnapshot = {
      type: p.type,
      name: p.name,
      code: p.code,
      country: p.country,
      currency: p.currency,
      price: p.price,
      credits: p.credits,
      rules: p.rules,
    };

    const overwriteCredits = b.overwriteCredits === true;
    if (overwriteCredits) {
      o.creditsRemaining = {
        jobCount: Number(p?.credits?.jobCount || 0),
        adCount: Number(p?.credits?.adCount || 0),
        jobPostCount: Number(p?.credits?.jobPostCount || 0),
        cvViewCount: Number(p?.credits?.cvViewCount || 0),
        cvSaveCount: Number(p?.credits?.cvSaveCount || 0),
      };
    }

    if (b.adminNote !== undefined) {
      o.adminNote = String(b.adminNote || "");
    }
    o.updatedByAdminId = req.user?._id || null;
    await o.save();

    return res.json({ success: true, order: o.toObject() });
  } catch (err) {
    return res.status(500).json({ success: false, message: "refresh snapshot failed", error: err.message });
  }
});

module.exports = router;
