// PATH: drivercv-backend/routes/adminCommitLogs.js
// ----------------------------------------------------------
// Admin Commit Logs CRUD
// Base: /api/admin/commit-logs
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const CommitLog = require("../models/CommitLog");
const { requireAuth, requireRoles } = require("../middleware/auth");

// LIST (en yeniden eskiye)
router.get("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const items = await CommitLog.find().sort({ committedAt: -1 }).limit(limit).lean();
    res.json({ success: true, logs: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET ONE
router.get("/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const doc = await CommitLog.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, message: "Bulunamadı" });
    res.json({ success: true, log: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE
router.post("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.hash) return res.status(400).json({ success: false, message: "hash required" });
    if (!b.message) return res.status(400).json({ success: false, message: "message required" });

    const doc = await CommitLog.create({
      hash: String(b.hash).trim(),
      message: String(b.message).trim(),
      committedAt: b.committedAt ? new Date(b.committedAt) : new Date(),
      summary: String(b.summary || "").trim(),
      filesChanged: Number(b.filesChanged) || 0,
      insertions: Number(b.insertions) || 0,
      deletions: Number(b.deletions) || 0,
      tags: Array.isArray(b.tags) ? b.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      notes: String(b.notes || "").trim(),
      buildStatus: ["unknown", "pass", "fail"].includes(b.buildStatus) ? b.buildStatus : "unknown",
      tsStatus: ["unknown", "pass", "fail"].includes(b.tsStatus) ? b.tsStatus : "unknown",
      author: String(b.author || "Cascade AI").trim(),
      adminReviewed: b.adminReviewed === true,
      adminNote: String(b.adminNote || "").trim(),
    });
    res.status(201).json({ success: true, log: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE
router.put("/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const doc = await CommitLog.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Bulunamadı" });

    const b = req.body || {};
    const allowed = [
      "hash", "message", "committedAt", "summary", "filesChanged",
      "insertions", "deletions", "tags", "notes", "buildStatus",
      "tsStatus", "author", "adminReviewed", "adminNote",
    ];
    for (const k of allowed) {
      if (b[k] !== undefined) {
        if (k === "committedAt") {
          doc[k] = new Date(b[k]);
        } else {
          doc[k] = b[k];
        }
      }
    }
    await doc.save();
    res.json({ success: true, log: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE
router.delete("/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const doc = await CommitLog.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Bulunamadı" });
    res.json({ success: true, message: "Silindi" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
