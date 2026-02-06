// PATH: DriverAll-main/drivercv-backend/routes/jobs.js
// ----------------------------------------------------------
// Jobs API
// - Public listing:   GET    /api/jobs
// - Public filters:   GET    /api/jobs/filters?country=TR
// - Public read:      GET    /api/jobs/:id   (published ise)
// - Employer mine:    GET    /api/jobs/mine
// - Admin pending:    GET    /api/jobs/pending   (pending işler)
// - Employer create:  POST   /api/jobs
// - Employer update:  PUT    /api/jobs/:id
// - Employer submit:  POST   /api/jobs/:id/publish   (isim korunuyor: "publish" -> employer için submit/pending)
// - Employer archive: POST   /api/jobs/:id/archive
// - Employer delete:  DELETE /api/jobs/:id
//
// Ek (Admin):
// - Admin approve:    POST   /api/jobs/:id/approve
// - Admin reject:     POST   /api/jobs/:id/reject
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const Job = require("../models/Job");
const FieldGroup = require("../models/FieldGroup");
const { requireAuth, requireRoles, extractToken } = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev-driverall-secret";

// ----------------------------------------------------------
// Public: ilan filtre şeması
// GET /api/jobs/filters?country=TR
// ----------------------------------------------------------
router.get("/filters", async (req, res) => {
  try {
    const country = String(req.query.country || "TR").toUpperCase();

    const all = await FieldGroup.find({}).lean();

    const groups = (all || [])
      .filter((g) => g && g.active !== false)
      .filter((g) => {
        if (!g.country) return true;
        const c = String(g.country || "").toUpperCase();
        return c === "ALL" || c === country;
      })
      .map((g) => ({
        _id: g._id,
        groupKey: g.groupKey,
        groupLabel: g.groupLabel,
        country: g.country || "ALL",
        active: g.active !== false,
        nodes: Array.isArray(g.nodes)
          ? g.nodes
              .filter((n) => n && n.active !== false)
              .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
              .map((n) => ({
                key: n.key,
                label: n.label,
                parentKey: n.parentKey || null,
                level: Number(n.level || 0),
                sortOrder: Number(n.sortOrder || 0),
              }))
          : [],
      }));

    return res.json({ success: true, groups });
  } catch (err) {
    return res.status(500).json({ success: false, message: "filters failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Admin: bekleyen (onaya gönderilmiş) ilanlar
// GET /api/jobs/pending
// ----------------------------------------------------------
router.get("/pending", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const jobs = await Job.find({ status: "pending" })
      .sort({ submittedAt: -1, createdAt: -1 })
      .limit(300)
      .lean();

    return res.json({ success: true, jobs });
  } catch (err) {
    return res.status(500).json({ success: false, message: "pending failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Employer: ilan oluştur (draft)
// POST /api/jobs
// ----------------------------------------------------------
router.post("/", requireAuth, requireRoles("employer", "admin"), async (req, res) => {
  try {
    const body = req.body || {};
    const title = String(body.title || "").trim();
    if (!title) return res.status(400).json({ success: false, message: "title required" });

    const country = String(body.country || "TR").toUpperCase();

    const job = await Job.create({
      employerUserId: req.user._id,
      country,
      location: body.location || { countryCode: country },
      title,
      description: String(body.description || ""),
      criteria: body.criteria || {},
      status: "draft",
      revision: 0,
      approvedRevision: 0,
    });

    return res.json({ success: true, job });
  } catch (err) {
    return res.status(500).json({ success: false, message: "create job failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Employer/Admin: kendi ilanlarım (admin ise hepsi)
// GET /api/jobs/mine
// ----------------------------------------------------------
router.get("/mine", requireAuth, requireRoles("employer", "admin"), async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const query = isAdmin ? {} : { employerUserId: req.user._id };

    const jobs = await Job.find(query)
  .populate("employerUserId", "name email companyName companyLegalName")
  .sort({ createdAt: -1 })
  .limit(200)
  .lean();
    return res.json({ success: true, jobs });
  } catch (err) {
    return res.status(500).json({ success: false, message: "mine failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Public: ilan listele (published)
// GET /api/jobs?country=TR&cityCode=IST&q=...&criteria=A,B,C
// ----------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const country = String(req.query.country || "TR").toUpperCase();
    const cityCode = String(req.query.cityCode || "").trim();
    const q = String(req.query.q || "").trim();

    const query = { status: "published", country };

    if (cityCode) query["location.cityCode"] = cityCode;
    if (q) query.title = { $regex: q, $options: "i" };

// criteriaCsv: "SRC1,ADR_TANK" => criteria.SRC1 var AND false değil  (yani fiilen true)
// Not: $ne:false tek başına alan yokken de eşleşir; bu yüzden $exists ekliyoruz.
const criteriaCsv = String(req.query.criteria || "").trim();
if (criteriaCsv) {
  const keys = criteriaCsv.split(",").map((x) => x.trim()).filter(Boolean);
  for (const k of keys) {
    query[`criteria.${k}`] = { $exists: true, $ne: false };
  }
}

    const jobs = await Job.find(query)
  .populate("employerUserId", "name email companyName companyLegalName")
  .sort({ createdAt: -1 })
  .limit(50)
  .lean();
    return res.json({ success: true, jobs });
  } catch (err) {
    return res.status(500).json({ success: false, message: "list failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Public/Owner: ilan oku
// GET /api/jobs/:id
// ----------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const job = await Job.findById(id)
  .populate("employerUserId", "name email companyName companyLegalName")
  .lean();

    if (!job) return res.status(404).json({ success: false, message: "not found" });

    // Published ise public
    if (job.status === "published") {
      return res.json({ success: true, job });
    }

    // Draft/pending/rejected/archived ise auth zorunlu
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "login required for draft/archived job" });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: "invalid token" });
    }

    const user = await User.findById(payload.userId).lean();
    if (!user) {
      return res.status(401).json({ success: false, message: "user not found" });
    }

    // Admin her şeyi görebilir
    if (String(user.role) === "admin") {
      return res.json({ success: true, job });
    }

    // Employer sadece kendi ilanını görebilir
    if (String(user.role) === "employer" && String(job.employerUserId) === String(user._id)) {
      return res.json({ success: true, job });
    }

    return res.status(403).json({ success: false, message: "forbidden" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "read failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Employer/Admin: ilan güncelle
// PUT /api/jobs/:id
// ----------------------------------------------------------
router.put("/:id", requireAuth, requireRoles("employer", "admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ success: false, message: "not found" });

    const isOwner = String(job.employerUserId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "forbidden" });

    // Employer published/pending ilanı değiştirirse -> yeniden onay döngüsü:
    // - status draft'a düşer
    // - revision artar
    // - yayın/paket meta temizlenir
    if (!isAdmin && (job.status === "published" || job.status === "pending")) {
      job.status = "draft";
      job.revision = Number(job.revision || 0) + 1;
      job.submittedAt = null;

      // Yayın meta temizle (yeniden onay/paket gerekiyor)
      job.publishedAt = null;
      job.placementKey = "";
      job.packageId = null;
      job.packageName = "";
      job.startAt = null;
      job.endAt = null;
    }

    if (body.title != null) job.title = String(body.title).trim();
    if (body.description != null) job.description = String(body.description);
    if (body.country != null) job.country = String(body.country).toUpperCase();
    if (body.location != null) job.location = body.location;
    if (body.criteria != null) job.criteria = body.criteria;

    await job.save();
    return res.json({ success: true, job });
  } catch (err) {
    return res.status(500).json({ success: false, message: "update failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Employer/Admin: "publish" endpoint'i korunuyor.
// - Employer çağırırsa: onaya gönder (pending)
// - Admin çağırırsa: onayla ve yayınla (published)
// POST /api/jobs/:id/publish
// ----------------------------------------------------------
router.post("/:id/publish", requireAuth, requireRoles("employer", "admin"), async (req, res) => {
  try {
    const id = req.params.id;

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ success: false, message: "not found" });

    const isOwner = String(job.employerUserId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "forbidden" });

    // Admin: direkt onay + publish
    if (isAdmin) {
      job.status = "published";
      job.publishedAt = job.publishedAt || new Date();
      job.approvedAt = new Date();
      job.approvedBy = req.user._id;
      job.approvedRevision = Number(job.revision || 0);
      job.rejectedAt = null;
      job.rejectedBy = null;
      job.adminNote = String(req.body?.adminNote || job.adminNote || "");
      await job.save();
      return res.json({ success: true, job });
    }

    // Employer: draft -> pending (onaya gönder)
    if (job.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: `cannot submit job in status=${job.status}`,
      });
    }

    job.status = "pending";
    job.submittedAt = new Date();

    // published metası burada set edilmez (admin onayında set edilir)
    await job.save();

    return res.json({ success: true, job });
  } catch (err) {
    return res.status(500).json({ success: false, message: "publish failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Admin: approve (pending -> published)
// POST /api/jobs/:id/approve
// body: { adminNote?: string }
// ----------------------------------------------------------
router.post("/:id/approve", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ success: false, message: "not found" });

    if (job.status !== "pending") {
      return res.status(400).json({ success: false, message: `not pending (status=${job.status})` });
    }

    job.status = "published";
    job.publishedAt = job.publishedAt || new Date();

    job.approvedAt = new Date();
    job.approvedBy = req.user._id;
    job.approvedRevision = Number(job.revision || 0);

    job.rejectedAt = null;
    job.rejectedBy = null;

    job.adminNote = String(req.body?.adminNote || job.adminNote || "");

    await job.save();
    return res.json({ success: true, job });
  } catch (err) {
    return res.status(500).json({ success: false, message: "approve failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Admin: reject (pending -> rejected)
// POST /api/jobs/:id/reject
// body: { adminNote?: string }
// ----------------------------------------------------------
router.post("/:id/reject", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ success: false, message: "not found" });

    if (job.status !== "pending") {
      return res.status(400).json({ success: false, message: `not pending (status=${job.status})` });
    }

    job.status = "rejected";
    job.rejectedAt = new Date();
    job.rejectedBy = req.user._id;
    job.adminNote = String(req.body?.adminNote || job.adminNote || "");

    await job.save();
    return res.json({ success: true, job });
  } catch (err) {
    return res.status(500).json({ success: false, message: "reject failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Employer/Admin: archive
// POST /api/jobs/:id/archive
// ----------------------------------------------------------
router.post("/:id/archive", requireAuth, requireRoles("employer", "admin"), async (req, res) => {
  try {
    const id = req.params.id;

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ success: false, message: "not found" });

    const isOwner = String(job.employerUserId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "forbidden" });

    job.status = "archived";
    await job.save();

    return res.json({ success: true, job });
  } catch (err) {
    return res.status(500).json({ success: false, message: "archive failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Employer/Admin: delete
// DELETE /api/jobs/:id
// ----------------------------------------------------------
router.delete("/:id", requireAuth, requireRoles("employer", "admin"), async (req, res) => {
  try {
    const id = req.params.id;

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ success: false, message: "not found" });

    const isOwner = String(job.employerUserId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "forbidden" });

    await Job.deleteOne({ _id: id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: "delete failed", error: err.message });
  }
});

module.exports = router;
