// PATH: DriverAll-main/drivercv-backend/routes/publicAdCampaigns.js

const express = require("express");
const router = express.Router();

const AdCampaign = require("../models/AdCampaign");
const AdPlacement = require("../models/AdPlacement");
const GeoGroup = require("../models/GeoGroup");

function up(v, d = "") {
  return String(v ?? d).trim().toUpperCase();
}

function nowInRange(c, now) {
  const s = c?.startAt ? new Date(c.startAt) : null;
  const e = c?.endAt ? new Date(c.endAt) : null;
  if (s && now < s) return false;
  if (e && now >= e) return false;
  return true;
}

function matchCountry(campaign, cc) {
  const list = Array.isArray(campaign?.countryTargets) ? campaign.countryTargets : ["ALL"];
  const norm = list.map((x) => up(x)).filter(Boolean);
  if (norm.includes("ALL")) return true;
  return norm.includes(cc);
}

// ✅ aday lokasyonu: beyan > ip
function resolveViewerGeo(req) {
  const districtCode = String(req.query.districtCode || "").trim();
  const provinceCode = String(req.query.provinceCode || "").trim();

  const ipDistrictCode = String(req.query.ipDistrictCode || "").trim();
  const ipProvinceCode = String(req.query.ipProvinceCode || "").trim();

  return {
    districtCode: districtCode || ipDistrictCode || "",
    provinceCode: provinceCode || ipProvinceCode || "",
  };
}

function geoPriority(campaign, viewerGeo) {
  const level = String(campaign?.geoLevel || "country").trim();
  const targets = Array.isArray(campaign?.geoTargets) ? campaign.geoTargets.map(String) : [];

  // country her zaman en düşük öncelik
  if (!level || level === "country") return 1;

  if (level === "province") {
    if (!targets.length) return 2;
    return viewerGeo?.provinceCode && targets.includes(viewerGeo.provinceCode) ? 2 : 0;
  }

  if (level === "district") {
    if (!targets.length) return 3;
    return viewerGeo?.districtCode && targets.includes(viewerGeo.districtCode) ? 3 : 0;
  }

  // geoGroup => ilçe hassasiyetinde kabul edelim
  if (level === "geoGroup") return 3;

  return 1;
}

async function matchGeo(campaign, viewerGeo, cc) {
  const level = String(campaign?.geoLevel || "country").trim();
  const targets = Array.isArray(campaign?.geoTargets) ? campaign.geoTargets.map(String) : [];

  if (!level || level === "country") return true;

  if (level === "province") {
    if (!targets.length) return true;
    return viewerGeo.provinceCode && targets.includes(viewerGeo.provinceCode);
  }

  if (level === "district") {
    if (!targets.length) return true;
    return viewerGeo.districtCode && targets.includes(viewerGeo.districtCode);
  }

  if (level === "geoGroup") {
    const groupKey = targets[0] ? String(targets[0]).trim().toUpperCase() : "";
    if (!groupKey) return false;

    const g = await GeoGroup.findOne({ country: cc, groupKey, active: true }).lean();
    if (!g) return false;

    const members = Array.isArray(g.members) ? g.members.map(String) : [];
    // üyeler provinceCode veya districtCode olabilir
    if (viewerGeo.districtCode && members.includes(viewerGeo.districtCode)) return true;
    if (viewerGeo.provinceCode && members.includes(viewerGeo.provinceCode)) return true;
    return false;
  }

  return true;
}

// GET /api/public/ad-campaigns/slot?country=TR&placement=HOME_TOP&provinceCode=TR-34&districtCode=TR-34-TUZLA
router.get("/slot", async (req, res) => {
  try {
    const cc = up(req.query.country, "TR") || "TR";
    const placementKey = String(req.query.placement || "").trim();
    if (!placementKey) return res.status(400).json({ success: false, message: "placement required" });

    const viewerGeo = resolveViewerGeo(req);
    const now = new Date();

    // placement opsiyonel: yoksa defaults ile devam ederiz
    const placement = await AdPlacement.findOne({ key: placementKey, active: true }).lean();

    const raw = await AdCampaign.find({
      status: "running",
      placements: placementKey,
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(200)
      .lean();

    // filtre
    const filtered = [];
    for (const c of raw) {
      if (!nowInRange(c, now)) continue;
      if (!matchCountry(c, cc)) continue;
      const okGeo = await matchGeo(c, viewerGeo, cc);
      if (!okGeo) continue;
      const pr = geoPriority(c, viewerGeo);
      if (!pr) continue;
      filtered.push({ c, pr });
    }

    // öncelik: ilçe > il > ülke, sonra güncellik
    filtered.sort((a, b) => {
      if ((b.pr || 0) !== (a.pr || 0)) return (b.pr || 0) - (a.pr || 0);
      const bu = b.c?.updatedAt ? new Date(b.c.updatedAt).getTime() : 0;
      const au = a.c?.updatedAt ? new Date(a.c.updatedAt).getTime() : 0;
      if (bu !== au) return bu - au;
      const bc = b.c?.createdAt ? new Date(b.c.createdAt).getTime() : 0;
      const ac = a.c?.createdAt ? new Date(a.c.createdAt).getTime() : 0;
      return bc - ac;
    });

    const ordered = filtered.map((x) => x.c);

    const maxItems = Number(placement?.carouselMaxItems || 10);
    const speedMs = Number(placement?.carouselSpeedMs || 15000);
    const carousel = ordered.slice(0, maxItems);

    return res.json({
      success: true,
      placement: placementKey,
      country: cc,
      viewerGeo,
      fixed: null,
      carousel: carousel.map((c) => ({
        _id: c._id,
        title: c.title || "",
        clickUrl: c.clickUrl || "",
        creatives: c.creatives || [],
        startAt: c.startAt || null,
        endAt: c.endAt || null,
      })),
      rules: {
        fixedEnabled: false,
        carouselEnabled: true,
        carouselIntervalMs: speedMs,
        carouselMaxItems: maxItems,
        carouselMaxMergeUnits: Number(placement?.carouselMaxMergeUnits || 2),
      },
    });
  } catch (err) {
    console.error("public ad slot failed:", err);
    return res.status(500).json({ success: false, message: "public ad slot failed", error: err.message });
  }
});

module.exports = router;
