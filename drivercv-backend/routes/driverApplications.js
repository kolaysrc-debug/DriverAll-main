// PATH: DriverAll-main/drivercv-backend/routes/driverApplications.js
// ----------------------------------------------------------
// Applications Routes (Driver & Employer)
// - POST   /api/jobs/:jobId/apply
// - GET    /api/my-applications
// - GET    /api/employer/applications
// - PATCH  /api/applications/:id
//
// Employer değerlendirmesi (MANUEL):
// - employerScore (0-100)  (geriye uyum: score)
// - employerLabelColor     (geriye uyum: labelColor)
// - employerNote
// - meetingUrl
//
// Sistem kalite (OTOMATİK - şimdilik yalnızca "varsa göster"):
// - qualityScore (0-100)   (admin/sistem yazar)
// - qualityLabelColor
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const DriverApplication = require("../models/DriverApplication");
const Job = require("../models/Job");
const Cv = require("../models/Cv");

const { requireAuth, requireRoles } = require("../middleware/auth");

const VALID_STATUS = ["new", "reviewed", "shortlisted", "rejected", "hired"];
const VALID_LABELS = ["none", "red", "yellow", "orange", "green"];

function pickEmployerScore(body) {
  // geriye uyum: score
  if (body.employerScore === null || body.score === null) return null;
  const v = body.employerScore != null ? body.employerScore : body.score;
  if (v == null) return undefined;
  const s = Number(v);
  if (!Number.isFinite(s) || s < 0 || s > 100) return "__INVALID__";
  return s;
}

function pickEmployerLabel(body) {
  // geriye uyum: labelColor
  const v = body.employerLabelColor != null ? body.employerLabelColor : body.labelColor;
  if (v == null) return undefined;
  const c = String(v);
  if (!VALID_LABELS.includes(c)) return "__INVALID__";
  return c;
}

// ----------------------------------------------------------
// POST /api/jobs/:jobId/apply  (driver)
// body: { note? }
// ----------------------------------------------------------
router.post(
  "/jobs/:jobId/apply",
  requireAuth,
  requireRoles("driver"),
  async (req, res) => {
    try {
      const userId = req.user._id;
      const { jobId } = req.params;
      const { note } = req.body || {};

      const job = await Job.findById(jobId).lean();
      if (!job) return res.status(404).json({ success: false, message: "job not found" });

      // CV snapshot (opsiyonel)
      const cvDoc = await Cv.findOne({ userId }).lean();
      const cvSnapshot = cvDoc ? cvDoc.values || {} : {};

      let doc;
      try {
        doc = await DriverApplication.create({
          job: job._id,
          driver: userId,
          employerUserId: job.employerUserId, // ✅ kritik
          note: String(note || ""),
          cvSnapshot,

          // Sistem kalite (ileride otomatik hesaplanacak)
          qualityScore: null,
          qualityLabelColor: "none",

          // Employer değerlendirmesi (başlangıç)
          employerScore: null,
          employerLabelColor: "none",
        });
      } catch (err) {
        // duplicate => zaten başvurmuş
        if (err && err.code === 11000) {
          const existing = await DriverApplication.findOne({ job: job._id, driver: userId })
            .populate("job")
            .lean();
          return res.status(200).json({
            success: true,
            alreadyApplied: true,
            application: existing,
            message: "already applied",
          });
        }
        throw err;
      }

      const populated = await DriverApplication.findById(doc._id)
        .populate("job")
        .populate("driver", "name email role")
        .lean();

      return res.status(201).json({ success: true, application: populated });
    } catch (err) {
      console.error("apply failed:", err);
      return res.status(500).json({ success: false, message: "apply failed", error: err.message });
    }
  }
);

// ----------------------------------------------------------
// GET /api/my-applications (driver)
// ----------------------------------------------------------
router.get(
  "/my-applications",
  requireAuth,
  requireRoles("driver", "admin"),
  async (req, res) => {
    try {
      const userId = req.user._id;

      const list = await DriverApplication.find({ driver: userId })
        .sort({ createdAt: -1 })
        .populate("job") // ✅ job içeriği geri gelir
        .lean();

      return res.json({ success: true, applications: list });
    } catch (err) {
      return res.status(500).json({ success: false, message: "my-applications failed", error: err.message });
    }
  }
);

// ----------------------------------------------------------
// GET /api/employer/applications (employer/admin)
// ----------------------------------------------------------
router.get(
  "/employer/applications",
  requireAuth,
  requireRoles("employer", "admin"),
  async (req, res) => {
    try {
      const isAdmin = req.user.role === "admin";

      const q = isAdmin ? {} : { employerUserId: req.user._id }; // ✅ doğru filtre

      const list = await DriverApplication.find(q)
        .sort({ createdAt: -1 })
        .limit(300)
        .populate("job")
        .populate("driver", "name email role")
        .lean();

      return res.json({ success: true, applications: list });
    } catch (err) {
      return res.status(500).json({ success: false, message: "employer applications failed", error: err.message });
    }
  }
);

// ----------------------------------------------------------
// PATCH /api/applications/:id (employer/admin)
// body:
// - status?
// - employerScore? (geriye uyum: score)
// - employerLabelColor? (geriye uyum: labelColor)
// - employerNote?
// - meetingUrl?
// - qualityScore? (SADECE admin/sistem)
// - qualityLabelColor? (SADECE admin/sistem)
// ----------------------------------------------------------
router.patch(
  "/applications/:id",
  requireAuth,
  requireRoles("employer", "admin"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const body = req.body || {};

      const doc = await DriverApplication.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: "application not found" });

      const isAdmin = req.user.role === "admin";
      const isOwner = String(doc.employerUserId) === String(req.user._id);
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ success: false, message: "forbidden" });
      }

      // status
      if (body.status != null) {
        const v = String(body.status);
        if (!VALID_STATUS.includes(v)) {
          return res.status(400).json({ success: false, message: "invalid status" });
        }
        doc.status = v;
      }

      // employer score (geriye uyum: score)
      const empScore = pickEmployerScore(body);
      if (empScore === "__INVALID__") {
        return res.status(400).json({ success: false, message: "employerScore must be 0-100" });
      }
      if (empScore !== undefined) {
        // mevcut şema score/labelColor kullanıyorsa da çalışsın diye iki tarafa yazıyoruz
        doc.score = empScore; // legacy
        doc.set("employerScore", empScore, { strict: false });
      }

      // employer label (geriye uyum: labelColor)
      const empLabel = pickEmployerLabel(body);
      if (empLabel === "__INVALID__") {
        return res.status(400).json({ success: false, message: "invalid employerLabelColor" });
      }
      if (empLabel !== undefined) {
        doc.labelColor = empLabel; // legacy
        doc.set("employerLabelColor", empLabel, { strict: false });
      }

      // notes + meeting
      if (body.employerNote != null) doc.employerNote = String(body.employerNote || "");
      if (body.meetingUrl != null) doc.meetingUrl = String(body.meetingUrl || "");

      // qualityScore / qualityLabelColor => sadece admin/sistem
      if (body.qualityScore !== undefined || body.qualityLabelColor !== undefined) {
        if (!isAdmin) {
          return res.status(403).json({ success: false, message: "quality fields are admin-only" });
        }

        if (body.qualityScore === null) {
          doc.set("qualityScore", null, { strict: false });
        } else if (body.qualityScore != null) {
          const qs = Number(body.qualityScore);
          if (!Number.isFinite(qs) || qs < 0 || qs > 100) {
            return res.status(400).json({ success: false, message: "qualityScore must be 0-100" });
          }
          doc.set("qualityScore", qs, { strict: false });
        }

        if (body.qualityLabelColor != null) {
          const qc = String(body.qualityLabelColor);
          if (!VALID_LABELS.includes(qc)) {
            return res.status(400).json({ success: false, message: "invalid qualityLabelColor" });
          }
          doc.set("qualityLabelColor", qc, { strict: false });
        }
      }

      await doc.save();

      const out = await DriverApplication.findById(doc._id)
        .populate("job")
        .populate("driver", "name email role")
        .lean();

      // response aliases (UI için daha okunaklı)
      if (out) {
        out.employerScore = out.employerScore ?? out.score ?? null;
        out.employerLabelColor = out.employerLabelColor ?? out.labelColor ?? "none";
        out.qualityScore = out.qualityScore ?? null;
        out.qualityLabelColor = out.qualityLabelColor ?? "none";
      }

      return res.json({ success: true, application: out });
    } catch (err) {
      return res.status(500).json({ success: false, message: "update failed", error: err.message });
    }
  }
);

module.exports = router;
