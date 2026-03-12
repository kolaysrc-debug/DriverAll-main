// PATH: DriverAll-main/drivercv-backend/routes/jobRequests.js
// ----------------------------------------------------------
// İlan Talep Akışı (Employer -> Admin onayı)
// - Employer: create request (pending)
// - Employer: mine
// - Admin: list + approve/reject
// Approve -> Job publish meta set (publishedAt/startAt/endAt + status=published)
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const Job = require("../models/Job");
const JobRequest = require("../models/JobRequest");
const PackageOrder = require("../models/PackageOrder");
const User = require("../models/User");

const { requireAuth, requireRoles } = require("../middleware/auth");
const { notifyJobApproved, notifyJobRejected } = require("../services/emailService");

// helpers
function toUpperList(arr, fallback = ["ALL"]) {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  const out = arr.map((x) => String(x || "").trim().toUpperCase()).filter(Boolean);
  return out.length ? out : fallback;
}
function parseDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
}

// ----------------------------------------------------------
// Optional: GET "/"
// GET /api/job-requests
// ----------------------------------------------------------
router.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message:
      "Job requests endpoint. Use POST /api/job-requests (body jobId...), POST /api/job-requests/from-job/:id, GET /api/job-requests/mine, GET /api/job-requests/admin/list.",
  });
});

// ----------------------------------------------------------
// Core create logic
// ----------------------------------------------------------
async function createJobRequestCore(req, res, forcedJobId) {
  try {
    const body = req.body || {};

    const jobId = String(forcedJobId || body.jobId || body.jobID || body.jobid || req.query.jobId || "").trim();
    if (!jobId) {
      return res.status(400).json({ success: false, message: "jobId required" });
    }

    const packageOrderId = String(body.packageOrderId || "").trim();
    if (!packageOrderId) {
      return res.status(400).json({ success: false, message: "packageOrderId required" });
    }

    const placementKey = String(body.placementKey || "").trim();
    if (!placementKey) return res.status(400).json({ success: false, message: "placementKey required" });

    const requestedDays = Number(body.requestedDays || 0) || 1;
    if (requestedDays < 1) return res.status(400).json({ success: false, message: "requestedDays invalid" });

    const job = await Job.findById(jobId).lean();
    if (!job) return res.status(404).json({ success: false, message: "job not found" });

    if (String(job.employerUserId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "not your job" });
    }

    const order = await PackageOrder.findById(packageOrderId).lean();
    if (!order) return res.status(404).json({ success: false, message: "order not found" });
    if (String(order.buyerUserId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "order not yours" });
    }
    if (order.paymentStatus !== "paid" || order.orderStatus !== "active") {
      return res.status(400).json({ success: false, message: "order is not active" });
    }
    if (order.expiresAt && new Date(order.expiresAt).getTime() <= Date.now()) {
      return res.status(400).json({ success: false, message: "order expired" });
    }

    const snap = order.packageSnapshot || {};
    const snapRules = snap.rules || {};
    const allowedPlacements = Array.isArray(snapRules.allowedPlacements)
      ? snapRules.allowedPlacements
      : [];

    if (allowedPlacements.length && !allowedPlacements.includes(placementKey)) {
      return res
        .status(400)
        .json({ success: false, message: "placement not allowed for this order" });
    }

    const maxMap = snapRules.maxDurationDaysByPlacement || {};
    const maxDays = Number(maxMap?.[placementKey] || 0) || 9999;
    if (requestedDays > maxDays) {
      return res
        .status(400)
        .json({ success: false, message: `requestedDays exceeds maxDays (${maxDays})` });
    }

    const countryTargets = toUpperList(body.countryTargets, [String(job.country || "TR").toUpperCase()]);
    const geoLevel = String(body.geoLevel || "country").trim();

    const doc = await JobRequest.create({
      employerUserId: req.user._id,

      // FIX: model ile uyumlu
      jobId: job._id,
      jobTitle: String(job.title || ""),

      packageOrderId: order._id,
      packageName: String(snap.name || ""),
      packageSnapshot: snap,

      placementKey,
      requestedDays,

      countryTargets,
      geoLevel,

      note: String(body.note || ""),

      status: "pending",
    });

    return res.json({ success: true, jobRequest: doc });
  } catch (err) {
    console.error("job request create failed:", err);
    return res.status(500).json({ success: false, message: "job request create failed", error: err.message });
  }
}

// ----------------------------------------------------------
// Employer: create request (pending)
// POST /api/job-requests
// body: { jobId, packageOrderId, placementKey, requestedDays, note?, countryTargets?, geoLevel? }
// ----------------------------------------------------------
router.post("/", requireAuth, requireRoles("employer"), async (req, res) => {
  return createJobRequestCore(req, res, null);
});

// ----------------------------------------------------------
// Employer: create request from job id in URL (UI için kolay)
// POST /api/job-requests/from-job/:id
// body: { packageOrderId, placementKey, requestedDays, ... }
// ----------------------------------------------------------
router.post("/from-job/:id", requireAuth, requireRoles("employer"), async (req, res) => {
  return createJobRequestCore(req, res, req.params.id);
});

// ----------------------------------------------------------
// Employer: my requests
// GET /api/job-requests/mine
// ----------------------------------------------------------
router.get("/mine", requireAuth, requireRoles("employer"), async (req, res) => {
  try {
    const list = await JobRequest.find({ employerUserId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return res.json({ success: true, list });
  } catch (err) {
    return res.status(500).json({ success: false, message: "mine failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Admin: list pending/approved/rejected
// GET /api/job-requests/admin/list?status=pending
// ----------------------------------------------------------
router.get("/admin/list", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const status = String(req.query.status || "pending").trim();
    const q = {};
    if (status) q.status = status;

    const list = await JobRequest.find(q).sort({ createdAt: -1 }).limit(300).lean();
    return res.json({ success: true, list });
  } catch (err) {
    return res.status(500).json({ success: false, message: "admin list failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Admin: approve -> publishes job with package metadata
// body: { startAt?: ISO string, adminNote?: string }
// ----------------------------------------------------------
router.post("/:id/approve", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;

    const doc = await JobRequest.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "not found" });
    if (doc.status !== "pending") return res.status(400).json({ success: false, message: "not pending" });

    const job = await Job.findById(doc.jobId);
    if (!job) return res.status(404).json({ success: false, message: "job not found" });

    const order = await PackageOrder.findById(doc.packageOrderId);
    if (!order) return res.status(404).json({ success: false, message: "order not found" });

    if (order.paymentStatus !== "paid" || order.orderStatus !== "active") {
      return res.status(400).json({ success: false, message: "order is not active" });
    }
    if (order.expiresAt && new Date(order.expiresAt).getTime() <= Date.now()) {
      order.orderStatus = "expired";
      await order.save();
      return res.status(400).json({ success: false, message: "order expired" });
    }

    const remaining = Number(order?.creditsRemaining?.jobPostCount || 0);
    if (remaining <= 0) {
      order.orderStatus = "exhausted";
      await order.save();
      return res.status(400).json({ success: false, message: "job post credits exhausted" });
    }

    const startAt = parseDateOrNull(req.body?.startAt) || new Date();
    const endAt = addDays(startAt, doc.requestedDays || 1);

    // job publish meta
    job.status = "published";
    job.publishedAt = new Date();

    const snap = order.packageSnapshot || doc.packageSnapshot || {};
    job.packageId = order.packageId || null;
    job.packageOrderId = order._id;
    job.packageName = String(snap?.name || doc.packageName || "");
    job.placementKey = String(doc.placementKey || "");

    job.startAt = startAt;
    job.endAt = endAt;

    await job.save();

    // decrement credit
    order.creditsRemaining.jobPostCount = remaining - 1;
    if (order.creditsRemaining.jobPostCount <= 0) {
      order.orderStatus = "exhausted";
    }
    await order.save();

    doc.status = "approved";
    doc.startAt = startAt;
    doc.endAt = endAt;
    doc.approvedBy = req.user._id;
    doc.approvedAt = new Date();
    doc.adminNote = String(req.body?.adminNote || "");
    await doc.save();

    // Email bildirimi
    try {
      const employer = await User.findById(doc.employerUserId).lean();
      if (employer?.email) {
        notifyJobApproved({ to: employer.email, userName: employer.name, jobTitle: job.title }).catch(() => {});
      }
    } catch (_) {}

    return res.json({ success: true, jobRequest: doc, job });
  } catch (err) {
    console.error("approve job request failed:", err);
    return res.status(500).json({ success: false, message: "approve failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Admin: reject
// POST /api/job-requests/:id/reject
// body: { adminNote?: string }
// ----------------------------------------------------------
router.post("/:id/reject", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;

    const doc = await JobRequest.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "not found" });
    if (doc.status !== "pending") return res.status(400).json({ success: false, message: "not pending" });

    doc.status = "rejected";
    doc.rejectedBy = req.user._id;
    doc.rejectedAt = new Date();
    doc.adminNote = String(req.body?.adminNote || "");
    await doc.save();

    // Email bildirimi
    try {
      const employer = await User.findById(doc.employerUserId).lean();
      const job = await Job.findById(doc.jobId).lean();
      if (employer?.email) {
        notifyJobRejected({ to: employer.email, userName: employer.name, jobTitle: job?.title, reason: doc.adminNote }).catch(() => {});
      }
    } catch (_) {}

    return res.json({ success: true, jobRequest: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "reject failed", error: err.message });
  }
});

module.exports = router;
