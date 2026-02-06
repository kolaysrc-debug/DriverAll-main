// PATH: DriverAll-main/drivercv-backend/routes/adRequests.js
// BUILD_MARK: DA-FIX-2026-01-13
// ----------------------------------------------------------
// Reklam Talep Akışı
// - Advertiser/Employer: create + mine
// - Admin: list + approve/reject
// Approve -> AdCampaign create (running)
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const AdRequest = require("../models/AdRequest");
const AdCampaign = require("../models/AdCampaign");
const AdPackage = require("../models/AdPackage");

const CompanyProfile = require("../models/CompanyProfile");
const BusinessPolicy = require("../models/BusinessPolicy");
const GeoGroup = require("../models/GeoGroup");

const { requireAuth, requireRoles } = require("../middleware/auth");

function up(v, fallback = "") {
  const s = String(v || "").trim().toUpperCase();
  return s || fallback;
}

function toUpperList(arr, fallback = ["ALL"]) {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  const out = arr.map((x) => up(x)).filter(Boolean);
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
// Optional: GET "/" (yanlışlıkla GET atılırsa 404 yerine açıklama döner)
// GET /api/ads/requests
// ----------------------------------------------------------
router.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message:
      "Ads Requests endpoint. Use POST /api/ads/requests, GET /api/ads/requests/mine, GET /api/ads/requests/admin/list.",
  });
});

// ----------------------------------------------------------
// Hedefleme hesaplayıcı (kısıtlı/serbest)
// ----------------------------------------------------------
async function resolveTargeting({ userId, country, requestedGeoLevel, requestedGeoTargets }) {
  const cc = up(country, "TR");

  const company = await CompanyProfile.findOne({ ownerUserId: userId }).lean();
  const businessType = company?.businessType || "OTHER";

  const policy =
    (await BusinessPolicy.findOne({ country: cc, businessType, active: true }).lean()) ||
    (await BusinessPolicy.findOne({ country: "TR", businessType, active: true }).lean()) ||
    null;

  // default: serbest
  const restricted = policy?.restricted === true;

  // Eğer kısıtlıysa: policy.requiredGeoLevel’e göre kilitle
  if (restricted) {
    const level = String(policy?.requiredGeoLevel || "district");

    if (level === "district") {
      const d = Array.isArray(company?.districtCodes) ? company.districtCodes : [];
      if (!d.length) {
        return { ok: false, message: "Firma ilçe bilgisi yok. (districtCodes empty)" };
      }
      return { ok: true, geoLevel: "district", geoTargets: d };
    }

    if (level === "province") {
      const p = String(company?.provinceCode || "");
      if (!p) return { ok: false, message: "Firma il bilgisi yok. (provinceCode empty)" };
      return { ok: true, geoLevel: "province", geoTargets: [p] };
    }

    // country kilidi
    return { ok: true, geoLevel: "country", geoTargets: [cc] };
  }

  // Serbest ise: request’i kabul et ama validasyon yap
  const geoLevel = String(requestedGeoLevel || "country").trim();
  const geoTargets = Array.isArray(requestedGeoTargets)
    ? requestedGeoTargets.map((x) => String(x).trim()).filter(Boolean)
    : [];

  if (geoLevel === "geoGroup") {
    const groupKey = geoTargets[0] ? String(geoTargets[0]).trim().toUpperCase() : "";
    if (!groupKey) return { ok: false, message: "geoGroup key required" };

    const g = await GeoGroup.findOne({ country: cc, groupKey, active: true }).lean();
    if (!g) return { ok: false, message: "geoGroup not found" };
    return { ok: true, geoLevel: "geoGroup", geoTargets: [groupKey] };
  }

  if (geoLevel === "district" || geoLevel === "province" || geoLevel === "country") {
    // boşsa country fallback
    if (geoLevel !== "country" && geoTargets.length === 0) {
      return { ok: false, message: "geoTargets required for province/district" };
    }
    return { ok: true, geoLevel, geoTargets: geoTargets.length ? geoTargets : [cc] };
  }

  // bilinmeyen -> country
  return { ok: true, geoLevel: "country", geoTargets: [cc] };
}

// ----------------------------------------------------------
// Advertiser/Employer: create request (pending)
// POST /api/ads/requests
// ----------------------------------------------------------
router.post("/", requireAuth, requireRoles("advertiser", "employer", "admin"), async (req, res) => {
  try {
    const body = req.body || {};

    const packageId = String(body.packageId || "").trim();
    if (!packageId) return res.status(400).json({ success: false, message: "packageId required" });

    const placementKey = String(body.placementKey || "").trim();
    if (!placementKey) return res.status(400).json({ success: false, message: "placementKey required" });

    const requestedDays = Number(body.requestedDays || 0) || 3;
    if (requestedDays < 1) return res.status(400).json({ success: false, message: "requestedDays invalid" });

    const pkg = await AdPackage.findById(packageId).lean();
    if (!pkg) return res.status(404).json({ success: false, message: "package not found" });
    if (pkg.active === false) return res.status(400).json({ success: false, message: "package is inactive" });

    const pList = Array.isArray(pkg.placements) ? pkg.placements : [];
    const found = pList.find((p) => String(p?.key || "") === placementKey);
    if (!found) return res.status(400).json({ success: false, message: "placement not allowed for this package" });

    const maxDays = Number(found?.maxDays || 0) || 9999;
    if (requestedDays > maxDays) {
      return res.status(400).json({ success: false, message: `requestedDays exceeds maxDays (${maxDays})` });
    }

    const title = String(body.title || "").trim();
    const clickUrl = String(body.clickUrl || "").trim();
    const creativeUrl = String(body.creativeUrl || "").trim();
    if (!creativeUrl) return res.status(400).json({ success: false, message: "creativeUrl required" });

    // ✅ hedefleme: kısıtlı/serbest
    const countryTargets = toUpperList(body.countryTargets, ["ALL"]);
    const reqCountry = up(countryTargets[0], "TR"); // basit: ilk ülke
    const resolved = await resolveTargeting({
      userId: req.user._id,
      country: reqCountry,
      requestedGeoLevel: body.geoLevel,
      requestedGeoTargets: body.geoTargets,
    });
    if (!resolved.ok) return res.status(400).json({ success: false, message: resolved.message });

    const doc = await AdRequest.create({
      advertiserUserId: req.user._id,
      packageId: pkg._id,
      packageName: String(pkg.name || ""),

      countryTargets,
      geoLevel: resolved.geoLevel,
      geoTargets: resolved.geoTargets,

      placementKey,
      requestedDays,

      title,
      clickUrl,
      creativeUrl,
      creativeAlt: String(body.creativeAlt || ""),

      status: "pending",
    });

    return res.json({ success: true, adRequest: doc });
  } catch (err) {
    console.error("ad request create failed:", err);
    return res.status(500).json({ success: false, message: "ad request create failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Advertiser/Employer: my requests
// GET /api/ads/requests/mine
// ----------------------------------------------------------
router.get("/mine", requireAuth, requireRoles("advertiser", "employer", "admin"), async (req, res) => {
  try {
    const list = await AdRequest.find({ advertiserUserId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return res.json({ success: true, list });
  } catch (err) {
    return res.status(500).json({ success: false, message: "mine failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Admin: list by status
// GET /api/ads/requests/admin/list?status=pending
// ----------------------------------------------------------
router.get("/admin/list", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const status = String(req.query.status || "pending").trim();
    const q = {};
    if (status) q.status = status;

    const list = await AdRequest.find(q).sort({ createdAt: -1 }).limit(300).lean();
    return res.json({ success: true, list });
  } catch (err) {
    return res.status(500).json({ success: false, message: "admin list failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Admin: approve -> creates AdCampaign (running)
// POST /api/ads/requests/:id/approve
// ----------------------------------------------------------
router.post("/:id/approve", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;

    const doc = await AdRequest.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "not found" });
    if (doc.status !== "pending") return res.status(400).json({ success: false, message: "not pending" });

    const startAt = parseDateOrNull(req.body?.startAt) || new Date();
    const endAt = addDays(startAt, doc.requestedDays || 3);

    const campaign = await AdCampaign.create({
      ownerId: doc.advertiserUserId,
      countryTargets: Array.isArray(doc.countryTargets) && doc.countryTargets.length ? doc.countryTargets : ["ALL"],

      // ✅ hedefleme taşınır
      geoLevel: doc.geoLevel || "country",
      geoTargets: Array.isArray(doc.geoTargets) ? doc.geoTargets : [],

      placements: [doc.placementKey],
      title: doc.title || doc.packageName || "",
      clickUrl: doc.clickUrl || "",
      creatives: [{ kind: "image", url: doc.creativeUrl, alt: doc.creativeAlt || doc.title || "" }],

      status: "running",
      rejectionReason: "",
      startAt,
      endAt,
    });

    doc.status = "approved";
    doc.startAt = startAt;
    doc.endAt = endAt;
    doc.approvedBy = req.user._id;
    doc.approvedAt = new Date();
    doc.campaignId = campaign._id;
    doc.adminNote = String(req.body?.adminNote || "");
    await doc.save();

    return res.json({ success: true, adRequest: doc, campaign });
  } catch (err) {
    console.error("approve failed:", err);
    return res.status(500).json({ success: false, message: "approve failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Admin: reject
// POST /api/ads/requests/:id/reject
// ----------------------------------------------------------
router.post("/:id/reject", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;

    const doc = await AdRequest.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "not found" });
    if (doc.status !== "pending") return res.status(400).json({ success: false, message: "not pending" });

    doc.status = "rejected";
    doc.adminNote = String(req.body?.adminNote || "");
    await doc.save();

    return res.json({ success: true, adRequest: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "reject failed", error: err.message });
  }
});

module.exports = router;
