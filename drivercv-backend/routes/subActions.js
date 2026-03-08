// PATH: DriverAll-main/drivercv-backend/routes/subActions.js
// ----------------------------------------------------------
// SubUser Actions
// Base: /api/sub
// - POST /api/sub/jobs/:id/publish
// - POST /api/sub/ads/:id/publish
// - POST /api/sub/packages/:id/buy
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const { requireSubUserAuth } = require("../middleware/subUserAuth");

const SubUserAction = require("../models/SubUserAction");
const Job = require("../models/Job");
const Ad = require("../models/Ad");
const Package = require("../models/Package");
const PackageOrder = require("../models/PackageOrder");

function mustApprove(req) {
  return req.subUser?.approvalSettings?.requireActionApproval === true;
}

async function createPending(parentUserId, subUserId, actionType, targetId, payload) {
  const doc = await SubUserAction.create({
    parentUserId,
    subUserId,
    actionType,
    targetId: targetId || null,
    payload: payload || {},
    status: "pending",
  });
  return doc;
}

// JOB PUBLISH (subuser)
router.post("/jobs/:id/publish", requireSubUserAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ success: false, message: "not found" });

    if (String(job.employerUserId) !== String(req.parentUserId)) {
      return res.status(403).json({ success: false, message: "forbidden" });
    }

    if (mustApprove(req)) {
      const act = await createPending(req.parentUserId, req.subUser._id, "job_publish", job._id, {
        adminNote: String(req.body?.adminNote || ""),
      });
      return res.json({ success: true, mode: "pending", action: act });
    }

    // onaysız: mevcut employer publish davranışına benzer
    if (job.status !== "draft") {
      return res.status(400).json({ success: false, message: `cannot submit job in status=${job.status}` });
    }

    job.status = "pending";
    job.submittedAt = new Date();
    await job.save();

    return res.json({ success: true, mode: "executed", job });
  } catch (err) {
    return res.status(500).json({ success: false, message: "publish failed", error: err.message });
  }
});

// AD PUBLISH (subuser)
router.post("/ads/:id/publish", requireSubUserAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const ad = await Ad.findById(id);
    if (!ad) return res.status(404).json({ success: false, message: "not found" });

    if (String(ad.advertiserUserId) !== String(req.parentUserId)) {
      return res.status(403).json({ success: false, message: "forbidden" });
    }

    if (mustApprove(req)) {
      const act = await createPending(req.parentUserId, req.subUser._id, "ad_publish", ad._id, {});
      return res.json({ success: true, mode: "pending", action: act });
    }

    if (ad.status !== "draft") {
      return res.status(400).json({ success: false, message: `cannot submit ad in status=${ad.status}` });
    }

    ad.status = "pending";
    ad.submittedAt = new Date();
    await ad.save();

    return res.json({ success: true, mode: "executed", ad });
  } catch (err) {
    return res.status(500).json({ success: false, message: "publish failed", error: err.message });
  }
});

// PACKAGE BUY (subuser)
router.post("/packages/:id/buy", requireSubUserAuth, async (req, res) => {
  try {
    const id = req.params.id;

    const p = await Package.findById(id).lean();
    if (!p || p.deletedAt || p.active === false) {
      return res.status(404).json({ success: false, message: "package not found or inactive" });
    }

    if (mustApprove(req)) {
      const act = await createPending(req.parentUserId, req.subUser._id, "package_buy", p._id, {});
      return res.json({ success: true, mode: "pending", action: act });
    }

    const order = await PackageOrder.create({
      buyerUserId: req.parentUserId,
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

    return res.json({ success: true, mode: "executed", order });
  } catch (err) {
    return res.status(500).json({ success: false, message: "buy package failed", error: err.message });
  }
});

module.exports = router;
