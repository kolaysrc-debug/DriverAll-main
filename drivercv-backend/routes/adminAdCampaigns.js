const express = require("express");
const router = express.Router();

const AdCampaign = require("../models/AdCampaign");
const { requireAuth, requireRoles } = require("../middleware/auth");

function up(v, fallback = "") {
  const s = String(v || "").trim().toUpperCase();
  return s || fallback;
}

function normStr(v, def = "") {
  const s = String(v ?? def).trim();
  return s;
}

function normDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
}

function normalizeStringArray(input, { upper = false } = {}) {
  if (!Array.isArray(input)) return [];
  const out = input
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .map((x) => (upper ? x.toUpperCase() : x));
  return Array.from(new Set(out));
}

// ----------------------------------------------------------
// LIST
// GET /api/admin/ad-campaigns?status=running&placement=HOME_RIGHT
// ----------------------------------------------------------
router.get("/", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const status = normStr(req.query.status || "");
    const placement = normStr(req.query.placement || "").toUpperCase();
    const ownerId = normStr(req.query.ownerId || "");

    const q = {};
    if (status) q.status = status;
    if (placement) q.placements = placement;
    if (ownerId) q.ownerId = ownerId;

    const list = await AdCampaign.find(q).sort({ updatedAt: -1, createdAt: -1 }).limit(300).lean();
    return res.json({ success: true, list });
  } catch (err) {
    return res.status(500).json({ success: false, message: "list failed", error: err.message });
  }
});

// ----------------------------------------------------------
// SEED (test)
// POST /api/admin/ad-campaigns/seed
// body: { count?: number, placements?: string[], countryTargets?: string[], geoLevel?: string, geoTargets?: string[], days?: number }
// ----------------------------------------------------------
router.post("/seed", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const b = req.body || {};

    const countRaw = Number(b.count ?? 20);
    const count = Number.isFinite(countRaw) ? Math.max(1, Math.min(200, Math.floor(countRaw))) : 20;

    const placements =
      b.placements != null
        ? normalizeStringArray(b.placements, { upper: true })
        : ["HOME_RIGHT", "DASHBOARD_RIGHT"];

    const countryTargets =
      b.countryTargets != null
        ? normalizeStringArray(b.countryTargets, { upper: true })
        : ["TR"];

    const geoLevel = normStr(b.geoLevel || "country");
    if (!["country", "province", "district", "geoGroup"].includes(geoLevel)) {
      return res.status(400).json({ success: false, message: "geoLevel invalid" });
    }

    const geoTargets =
      b.geoTargets != null ? normalizeStringArray(b.geoTargets, { upper: true }) : [];

    const daysRaw = Number(b.days ?? 30);
    const days = Number.isFinite(daysRaw) ? Math.max(1, Math.min(365, Math.floor(daysRaw))) : 30;

    const now = new Date();
    const endAt = addDays(now, days);

    const docs = [];
    for (let i = 0; i < count; i++) {
      const n = i + 1;
      docs.push({
        ownerId: req.user._id,
        countryTargets: countryTargets.length ? countryTargets : ["ALL"],
        geoLevel,
        geoTargets,
        placements,
        title: `Test Kampanya #${n}`,
        clickUrl: `https://example.com/?ad=${n}`,
        creatives: [
          {
            kind: "image",
            url: `https://placehold.co/1200x400?text=Ad+${encodeURIComponent(String(n))}`,
            alt: `Ad ${n}`,
          },
        ],
        status: "running",
        startAt: now,
        endAt,
      });
    }

    const created = await AdCampaign.insertMany(docs, { ordered: false });
    return res.json({ success: true, count: created.length, ids: created.map((x) => x._id) });
  } catch (err) {
    return res.status(500).json({ success: false, message: "seed failed", error: err.message });
  }
});

// ----------------------------------------------------------
// UPDATE
// PUT /api/admin/ad-campaigns/:id
// body: { placements: ["HOME_RIGHT"], status: "running", startAt, endAt, countryTargets, geoLevel, geoTargets }
// ----------------------------------------------------------
router.put("/:id", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};

    const doc = await AdCampaign.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "not found" });

    if (body.title != null) doc.title = normStr(body.title, doc.title);
    if (body.clickUrl != null) doc.clickUrl = normStr(body.clickUrl, doc.clickUrl);

    if (body.status != null) {
      const st = normStr(body.status, doc.status);
      if (!["running", "paused", "ended"].includes(st)) {
        return res.status(400).json({ success: false, message: "status invalid" });
      }
      doc.status = st;
    }

    if (body.startAt !== undefined) {
      doc.startAt = body.startAt ? normDateOrNull(body.startAt) : null;
    }
    if (body.endAt !== undefined) {
      doc.endAt = body.endAt ? normDateOrNull(body.endAt) : null;
    }

    if (body.countryTargets != null) {
      doc.countryTargets = normalizeStringArray(body.countryTargets, { upper: true });
      if (!doc.countryTargets.length) doc.countryTargets = ["ALL"];
    }

    if (body.geoLevel != null) {
      const gl = normStr(body.geoLevel, doc.geoLevel);
      if (!["country", "province", "district", "geoGroup"].includes(gl)) {
        return res.status(400).json({ success: false, message: "geoLevel invalid" });
      }
      doc.geoLevel = gl;
    }

    if (body.geoTargets != null) {
      doc.geoTargets = normalizeStringArray(body.geoTargets, { upper: true });
    }

    if (body.placements != null) {
      doc.placements = normalizeStringArray(body.placements, { upper: true });
    }

    // tolerans: tek placement string geldiyse
    if (body.placement != null && doc.placements.length === 0) {
      const pk = up(body.placement);
      if (pk) doc.placements = [pk];
    }

    await doc.save();
    return res.json({ success: true, campaign: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "update failed", error: err.message });
  }
});

module.exports = router;
