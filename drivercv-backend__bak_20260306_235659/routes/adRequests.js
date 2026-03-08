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
const PackageOrder = require("../models/PackageOrder");

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

  const overrideEnabled = company?.adTargetingOverride?.enabled === true;
  if (overrideEnabled) {
    const oLevel = String(company?.adTargetingOverride?.geoLevel || "").trim();
    const oTargets = Array.isArray(company?.adTargetingOverride?.geoTargets)
      ? company.adTargetingOverride.geoTargets.map((x) => String(x).trim()).filter(Boolean)
      : [];

    if (oLevel === "geoGroup") {
      const groupKey = oTargets[0] ? String(oTargets[0]).trim().toUpperCase() : "";
      if (!groupKey) return { ok: false, message: "Firma override geoGroup key boş" };
      const g = await GeoGroup.findOne({ country: cc, groupKey, active: true }).lean();
      if (!g) return { ok: false, message: "Firma override geoGroup bulunamadı" };
      return { ok: true, mode: "override", geoLevel: "geoGroup", geoTargets: [groupKey] };
    }

    if (oLevel === "district" || oLevel === "province" || oLevel === "country") {
      if (oLevel !== "country" && oTargets.length === 0) {
        return { ok: false, message: "Firma override geoTargets required" };
      }
      return { ok: true, mode: "override", geoLevel: oLevel, geoTargets: oTargets.length ? oTargets : [cc] };
    }

    return { ok: false, message: "Firma override geoLevel invalid" };
  }

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
      return { ok: true, mode: "policy", geoLevel: "district", geoTargets: d };
    }

    if (level === "province") {
      const p = String(company?.provinceCode || "");
      if (!p) return { ok: false, message: "Firma il bilgisi yok. (provinceCode empty)" };
      return { ok: true, mode: "policy", geoLevel: "province", geoTargets: [p] };
    }

    // country kilidi
    return { ok: true, mode: "policy", geoLevel: "country", geoTargets: [cc] };
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
    return { ok: true, mode: "free", geoLevel: "geoGroup", geoTargets: [groupKey] };
  }

  if (geoLevel === "district" || geoLevel === "province" || geoLevel === "country") {
    // boşsa country fallback
    if (geoLevel !== "country" && geoTargets.length === 0) {
      return { ok: false, message: "geoTargets required for province/district" };
    }
    return { ok: true, mode: "free", geoLevel, geoTargets: geoTargets.length ? geoTargets : [cc] };
  }

  // bilinmeyen -> country
  return { ok: true, mode: "free", geoLevel: "country", geoTargets: [cc] };
}

router.get(
  "/targeting-preview",
  requireAuth,
  requireRoles("advertiser", "employer", "admin"),
  async (req, res) => {
    try {
      const country = up(req.query.country, "TR");
      const requestedGeoLevel = String(req.query.geoLevel || "").trim();
      const rawTargets = String(req.query.geoTargets || "");
      const requestedGeoTargets = rawTargets
        ? rawTargets
            .split(",")
            .map((x) => String(x).trim())
            .filter(Boolean)
        : [];

      const resolved = await resolveTargeting({
        userId: req.user._id,
        country,
        requestedGeoLevel,
        requestedGeoTargets,
      });
      if (!resolved.ok) return res.status(400).json({ success: false, message: resolved.message });

      return res.json({
        success: true,
        mode: resolved.mode || "free",
        geoLevel: resolved.geoLevel,
        geoTargets: resolved.geoTargets,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "preview failed", error: err.message });
    }
  }
);

// ----------------------------------------------------------
// Advertiser/Employer: create request (pending)
// POST /api/ads/requests
// ----------------------------------------------------------
router.post("/", requireAuth, requireRoles("advertiser", "employer", "admin"), async (req, res) => {
  try {
    const body = req.body || {};

    const placementKey = String(body.placementKey || "").trim();
    if (!placementKey) return res.status(400).json({ success: false, message: "placementKey required" });

    const requestedDays = Number(body.requestedDays || 0) || 3;
    if (requestedDays < 1) return res.status(400).json({ success: false, message: "requestedDays invalid" });

    // ----------------------------------------------------------
    // Unified engine support:
    // - If packageOrderId is present -> validate PackageOrder + rules
    // - Else fallback to legacy AdPackage
    // ----------------------------------------------------------
    const packageOrderId = String(body.packageOrderId || "").trim();
    const packageId = String(body.packageId || "").trim();

    let resolvedPackageName = "";
    let resolvedPackageSnapshot = {};
    let resolvedPackageId = null;
    let resolvedPlacementMaxDays = 9999;

    if (packageOrderId) {
      const order = await PackageOrder.findById(packageOrderId).lean();
      if (!order) return res.status(404).json({ success: false, message: "order not found" });
      if (String(order.buyerUserId) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: "order not yours" });
      }

      // NOTE: ödeme kontrolünü burada zorunlu yapmıyoruz (UX). Admin approve aşamasında kesin kontrol edeceğiz.
      // Ama expired/cancelled ise hiç kabul etmeyelim.
      if (order.orderStatus === "cancelled" || order.orderStatus === "expired") {
        return res.status(400).json({ success: false, message: `order is ${order.orderStatus}` });
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
          .json({ success: false, message: "placement not allowed for this order", placementKey, allowedPlacements });
      }

      const maxMap = snapRules.maxDurationDaysByPlacement || {};
      const maxDays = Number(maxMap?.[placementKey] || 0) || 9999;
      if (requestedDays > maxDays) {
        return res
          .status(400)
          .json({ success: false, message: `requestedDays exceeds maxDays (${maxDays})` });
      }

      resolvedPackageName = String(snap?.name || "");
      resolvedPackageSnapshot = snap;
      resolvedPlacementMaxDays = maxDays;
    } else {
      if (!packageId) return res.status(400).json({ success: false, message: "packageId or packageOrderId required" });

      const pkg = await AdPackage.findById(packageId).lean();
      if (!pkg) return res.status(404).json({ success: false, message: "package not found" });
      if (pkg.active === false) return res.status(400).json({ success: false, message: "package is inactive" });

      const defaultPlacements = [
        { key: "HOME_TOP", label: "Ana Sayfa Üst", maxDays: 3 },
        { key: "HOME_RIGHT", label: "Ana Sayfa Sağ", maxDays: 3 },
        { key: "DASHBOARD_RIGHT", label: "Panel Sağ", maxDays: 3 },
      ];

      const pList =
        Array.isArray(pkg.placements) && pkg.placements.length > 0
          ? pkg.placements
          : defaultPlacements;
      const found = pList.find((p) => String(p?.key || "") === placementKey);
      if (!found) {
        return res.status(400).json({
          success: false,
          message: "placement not allowed for this package",
          placementKey,
          allowedPlacements: pList.map((p) => String(p?.key || "")).filter(Boolean),
        });
      }

      const maxDays = Number(found?.maxDays || 0) || 9999;
      if (requestedDays > maxDays) {
        return res.status(400).json({ success: false, message: `requestedDays exceeds maxDays (${maxDays})` });
      }

      resolvedPackageId = pkg._id;
      resolvedPackageName = String(pkg.name || "");
      resolvedPlacementMaxDays = maxDays;
    }

    const title = String(body.title || "").trim();
    const clickUrl = String(body.clickUrl || body.targetUrl || "").trim();
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
      packageId: resolvedPackageId,
      packageName: resolvedPackageName,
      packageOrderId: packageOrderId || null,
      packageSnapshot: resolvedPackageSnapshot,

      countryTargets,
      geoLevel: resolved.geoLevel,
      geoTargets: resolved.geoTargets,

      placementKey,
      requestedDays,

      title,
      clickUrl,
      creativeUrl,
      creativeAlt: String(body.creativeAlt || ""),
      note: String(body.note || ""),

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

    const AdCampaign = require("../models/AdCampaign");

    const nextList = await Promise.all(
      (list || []).map(async (r) => {
        if (!r) return r;

        const status = String(r.status || "pending");
        const hasCampaignId = Boolean(r.campaignId);
        if (status !== "approved" || hasCampaignId) return r;

        const placementKey = String(r.placementKey || "").trim();
        const startAt = r.startAt ? new Date(r.startAt) : null;
        if (!placementKey || !startAt) return r;

        const c = await AdCampaign.findOne({
          ownerId: r.advertiserUserId,
          status: "running",
          placements: placementKey,
          startAt,
        })
          .sort({ createdAt: -1 })
          .lean();

        if (!c?._id) return r;
        return { ...r, campaignId: c._id };
      })
    );

    return res.json({ success: true, list: nextList });
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

    // ----------------------------------------------------------
    // Unified engine: validate + consume PackageOrder credit
    // ----------------------------------------------------------
    let order = null;
    if (doc.packageOrderId) {
      order = await PackageOrder.findById(doc.packageOrderId);
      if (!order) return res.status(404).json({ success: false, message: "order not found" });

      if (order.paymentStatus !== "paid" || order.orderStatus !== "active") {
        return res.status(400).json({ success: false, message: "order is not active" });
      }
      if (order.expiresAt && new Date(order.expiresAt).getTime() <= Date.now()) {
        order.orderStatus = "expired";
        await order.save();
        return res.status(400).json({ success: false, message: "order expired" });
      }

      const remaining = Number(order?.creditsRemaining?.adCount || 0);
      if (remaining <= 0) {
        order.orderStatus = "exhausted";
        await order.save();
        return res.status(400).json({ success: false, message: "ad credits exhausted" });
      }
    }

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

    if (order) {
      const remaining = Number(order?.creditsRemaining?.adCount || 0);
      order.creditsRemaining.adCount = remaining - 1;
      if (order.creditsRemaining.adCount <= 0) {
        order.orderStatus = "exhausted";
      }
      order.updatedByAdminId = req.user?._id || null;
      await order.save();
    }

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
