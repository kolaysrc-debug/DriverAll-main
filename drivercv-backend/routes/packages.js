// PATH: DriverAll-main/drivercv-backend/routes/packages.js
// ----------------------------------------------------------
// Public Packages + Buy
// Base: /api/packages
// - GET /api/packages?type=JOB&country=TR
// - POST /api/packages/:id/buy  (requireAuth)
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const Package = require("../models/Package");
const PackageOrder = require("../models/PackageOrder");
const { requireAuth, requireRoles } = require("../middleware/auth");

function upper(v, fallback = "") {
  const s = String(v || "").trim();
  return (s || fallback).toUpperCase();
}

// LIST ACTIVE PACKAGES
router.get("/", async (req, res) => {
  try {
    const type = upper(req.query.type);
    const country = upper(req.query.country, "TR");

    const q = {
      deletedAt: null,
      active: true,
      $or: [{ country: "ALL" }, { country }],
    };

    if (type) {
      // BOTH paketler de listelensin
      q.$and = [{ $or: [{ type }, { type: "BOTH" }] }];
    }

    const items = await Package.find(q).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, packages: items });
  } catch (err) {
    res.status(500).json({ success: false, message: "list public packages failed", error: err.message });
  }
});

// BUY (create order)
// Not: şimdilik ödeme yok; order unpaid/created olur. Admin sonra paid yapar.
router.post("/:id/buy", requireAuth, requireRoles("admin", "employer", "advertiser"), async (req, res) => {
  try {
    const id = req.params.id;

    const p = await Package.findById(id).lean();
    if (!p || p.deletedAt || p.active === false) {
      return res.status(404).json({ success: false, message: "package not found or inactive" });
    }

    const order = await PackageOrder.create({
      buyerUserId: req.user._id,
      packageId: p._id,
      packageSnapshot: {
        type: p.type,
        name: p.name,
        code: p.code,
        country: p.country,
        currency: p.currency,
        price: p.price,
        credits: p.credits,
        rules: p.rules,
      },
      paymentStatus: "unpaid",
      orderStatus: "created",
      creditsRemaining: {
        jobCount: Number(p?.credits?.jobCount || 0),
        adCount: Number(p?.credits?.adCount || 0),
      },
    });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: "buy package failed", error: err.message });
  }
});

module.exports = router;
