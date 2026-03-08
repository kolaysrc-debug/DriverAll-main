// PATH: DriverAll-main/drivercv-backend/routes/ownerSubActions.js
// ----------------------------------------------------------
// Owner SubUser Actions Approval
// Base: /api/owner/sub-actions
// - GET /api/owner/sub-actions?status=pending
// - POST /api/owner/sub-actions/:id/approve
// - POST /api/owner/sub-actions/:id/reject
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");

const SubUserAction = require("../models/SubUserAction");
const Job = require("../models/Job");
const Ad = require("../models/Ad");
const Package = require("../models/Package");
const PackageOrder = require("../models/PackageOrder");

function requireOwnerOrAdmin(req, res, next) {
  if (req.user?.role === "admin") return next();
  if (!req.user?._id) return res.status(401).json({ message: "Yetkisiz erişim" });
  return next();
}

function assertOwnerOrAdmin(req, action) {
  if (req.user?.role === "admin") return true;
  return String(action.parentUserId) === String(req.user._id);
}

async function executeAction(actionDoc, decidedByUserId, decisionNote) {
  const t = actionDoc.actionType;

  if (t === "job_publish") {
    const job = await Job.findById(actionDoc.targetId);
    if (!job) throw new Error("job not found");
    if (String(job.employerUserId) !== String(actionDoc.parentUserId)) throw new Error("job owner mismatch");
    if (job.status !== "draft") throw new Error(`cannot submit job in status=${job.status}`);

    job.status = "pending";
    job.submittedAt = new Date();
    await job.save();

    return { kind: "job", id: String(job._id), status: job.status };
  }

  if (t === "ad_publish") {
    const ad = await Ad.findById(actionDoc.targetId);
    if (!ad) throw new Error("ad not found");
    if (String(ad.advertiserUserId) !== String(actionDoc.parentUserId)) throw new Error("ad owner mismatch");
    if (ad.status !== "draft") throw new Error(`cannot submit ad in status=${ad.status}`);

    ad.status = "pending";
    ad.submittedAt = new Date();
    await ad.save();

    return { kind: "ad", id: String(ad._id), status: ad.status };
  }

  if (t === "package_buy") {
    const p = await Package.findById(actionDoc.targetId).lean();
    if (!p || p.deletedAt || p.active === false) throw new Error("package not found or inactive");

    const order = await PackageOrder.create({
      buyerUserId: actionDoc.parentUserId,
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
        jobPostCount: Number(p?.credits?.jobPostCount || 0),
        cvViewCount: Number(p?.credits?.cvViewCount || 0),
        cvSaveCount: Number(p?.credits?.cvSaveCount || 0),
      },
    });

    return { kind: "package_order", id: String(order._id), status: order.orderStatus };
  }

  throw new Error("unknown actionType");
}

// LIST
router.get("/", requireAuth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const status = String(req.query.status || "pending").trim();

    const q = { status };
    if (req.user?.role !== "admin") {
      q.parentUserId = req.user._id;
    }

    const list = await SubUserAction.find(q)
      .sort({ createdAt: -1 })
      .limit(300)
      .populate("subUserId");

    return res.json({ success: true, list });
  } catch (err) {
    return res.status(500).json({ success: false, message: "list failed", error: err.message });
  }
});

// APPROVE
router.post("/:id/approve", requireAuth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const note = String(req.body?.note || "");

    const action = await SubUserAction.findById(id);
    if (!action) return res.status(404).json({ success: false, message: "not found" });

    if (!assertOwnerOrAdmin(req, action)) {
      return res.status(403).json({ success: false, message: "forbidden" });
    }

    if (action.status !== "pending") {
      return res.status(400).json({ success: false, message: "not pending" });
    }

    action.status = "approved";
    action.decidedAt = new Date();
    action.decidedByUserId = req.user._id;
    action.decisionNote = note;

    const result = await executeAction(action, req.user._id, note);
    action.executedAt = new Date();
    action.executionResult = result;

    await action.save();

    return res.json({ success: true, action });
  } catch (err) {
    console.error("owner approve failed:", err);
    return res.status(500).json({ success: false, message: "approve failed", error: err.message });
  }
});

// REJECT
router.post("/:id/reject", requireAuth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const note = String(req.body?.note || "");

    const action = await SubUserAction.findById(id);
    if (!action) return res.status(404).json({ success: false, message: "not found" });

    if (!assertOwnerOrAdmin(req, action)) {
      return res.status(403).json({ success: false, message: "forbidden" });
    }

    if (action.status !== "pending") {
      return res.status(400).json({ success: false, message: "not pending" });
    }

    action.status = "rejected";
    action.decidedAt = new Date();
    action.decidedByUserId = req.user._id;
    action.decisionNote = note;

    await action.save();

    return res.json({ success: true, action });
  } catch (err) {
    return res.status(500).json({ success: false, message: "reject failed", error: err.message });
  }
});

module.exports = router;
