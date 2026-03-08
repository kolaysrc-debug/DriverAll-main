const express = require("express");
const router = express.Router();

const InstructionTask = require("../models/InstructionTask");
const { requireAuth, requireRoles } = require("../middleware/auth");

function normalizeKey(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

router.get("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const { status, q, tag } = req.query;

    const filter = {};
    if (status) filter.status = String(status);
    if (tag) filter.tags = String(tag);
    if (q) {
      const s = String(q || "").trim();
      filter.$or = [
        { key: { $regex: s, $options: "i" } },
        { title: { $regex: s, $options: "i" } },
        { description: { $regex: s, $options: "i" } },
      ];
    }

    const tasks = await InstructionTask.find(filter)
      .sort({ priority: -1, updatedAt: -1 })
      .limit(500)
      .lean();

    return res.json({ success: true, tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: "tasks list failed", error: err.message });
  }
});

router.post("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const body = req.body || {};

    const title = String(body.title || "").trim();
    if (!title) return res.status(400).json({ success: false, message: "title required" });

    const key = normalizeKey(body.key || title);
    if (!key) return res.status(400).json({ success: false, message: "key required" });

    const payload = {
      key,
      title,
      description: String(body.description || ""),
      instruction: String(body.instruction || ""),
      status: body.status || "pending",
      priority: body.priority || "medium",
      tags: Array.isArray(body.tags) ? body.tags.map((x) => String(x || "").trim()).filter(Boolean) : [],
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      createdByUserId: req.user?._id || null,
      updatedByUserId: req.user?._id || null,
    };

    const existing = await InstructionTask.findOne({ key }).lean();
    if (existing) {
      return res.status(400).json({ success: false, message: "task key already exists" });
    }

    const task = await InstructionTask.create(payload);
    return res.status(201).json({ success: true, task });
  } catch (err) {
    return res.status(500).json({ success: false, message: "task create failed", error: err.message });
  }
});

router.put("/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};

    const task = await InstructionTask.findById(id);
    if (!task) return res.status(404).json({ success: false, message: "not found" });

    if (body.title != null) task.title = String(body.title || "").trim();
    if (body.description != null) task.description = String(body.description || "");
    if (body.instruction != null) task.instruction = String(body.instruction || "");
    if (body.status != null) task.status = String(body.status);
    if (body.priority != null) task.priority = String(body.priority);

    if (body.devDone != null) {
      const next = !!body.devDone;
      if (next !== !!task.devDone) {
        task.devDone = next;
        task.devDoneAt = next ? new Date() : null;
      }
    }

    if (body.adminTested != null) {
      const next = !!body.adminTested;
      if (next !== !!task.adminTested) {
        task.adminTested = next;
        task.adminTestedAt = next ? new Date() : null;
        if (!next) {
          task.adminResult = "";
          task.adminResultNote = "";
        }
      }
    }

    if (body.adminResult != null) {
      const next = String(body.adminResult || "");
      if (!["", "ok", "not_ok"].includes(next)) {
        return res.status(400).json({ success: false, message: "invalid adminResult" });
      }
      task.adminResult = next;
    }

    if (body.adminResultNote != null) task.adminResultNote = String(body.adminResultNote || "");

    if (body.tags != null) {
      task.tags = Array.isArray(body.tags)
        ? body.tags.map((x) => String(x || "").trim()).filter(Boolean)
        : [];
    }

    if (body.dueAt !== undefined) {
      task.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    }

    task.updatedByUserId = req.user?._id || null;

    // Ürün kuralı: done => admin test edildi VE sonucu ok olmalı
    if (String(task.status) === "done") {
      if (!task.adminTested || String(task.adminResult) !== "ok") {
        return res.status(400).json({
          success: false,
          message: "done için önce admin test (adminTested=true) ve sonuç (adminResult=ok) gerekir",
        });
      }
    }

    if (String(task.status) === "done" && !task.doneAt) task.doneAt = new Date();
    if (String(task.status) !== "done") task.doneAt = null;

    await task.save();
    return res.json({ success: true, task });
  } catch (err) {
    return res.status(500).json({ success: false, message: "task update failed", error: err.message });
  }
});

module.exports = router;
