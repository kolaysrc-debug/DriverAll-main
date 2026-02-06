// PATH: DriverAll-main/drivercv-backend/routes/ads.js
// ----------------------------------------------------------
// Ads API
// - Public list:      GET    /api/ads
// - Public read:      GET    /api/ads/:id (published ise)
// - Advertiser mine:  GET    /api/ads/mine
// - Advertiser create:POST   /api/ads
// - Advertiser update:PUT    /api/ads/:id
// - Advertiser submit:POST   /api/ads/:id/publish   (draft -> pending)
// - Advertiser archive:POST  /api/ads/:id/archive
// - Advertiser delete:DELETE /api/ads/:id
//
// Admin:
// - Admin pending:    GET    /api/ads/pending
// - Admin approve:    POST   /api/ads/:id/approve
// - Admin reject:     POST   /api/ads/:id/reject
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const Ad = require("../models/Ad");
const { requireAuth, requireRoles, extractToken } = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev-driverall-secret";

// ----------------------------------------------------------
// Admin: pending ads (onay bekleyen)
// GET /api/ads/pending
// ----------------------------------------------------------
router.get("/pending", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const ads = await Ad.find({ status: "pending" })
      .sort({ submittedAt: -1, createdAt: -1 })
      .limit(300)
      .lean();
    return res.json({ success: true, ads });
  } catch (err) {
    return res.status(500).json({ success: false, message: "pending failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Advertiser/Admin: mine
// GET /api/ads/mine
// ----------------------------------------------------------
router.get("/mine", requireAuth, requireRoles("advertiser", "admin"), async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const query = isAdmin ? {} : { advertiserUserId: req.user._id };
    const ads = await Ad.find(query).sort({ createdAt: -1 }).limit(200).lean();
    return res.json({ success: true, ads });
  } catch (err) {
    return res.status(500).json({ success: false, message: "mine failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Public: list published ads
// GET /api/ads?country=TR
// ----------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const country = String(req.query.country || "").toUpperCase().trim();

    const query = { status: "published" };
    if (country) {
      query.$or = [{ countryTargets: "ALL" }, { countryTargets: country }];
    }

    const ads = await Ad.find(query).sort({ createdAt: -1 }).limit(50).lean();
    return res.json({ success: true, ads });
  } catch (err) {
    return res.status(500).json({ success: false, message: "list failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Public/Owner: read
// GET /api/ads/:id
// ----------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const ad = await Ad.findById(id).lean();
    if (!ad) return res.status(404).json({ success: false, message: "not found" });

    if (ad.status === "published") return res.json({ success: true, ad });

    const token = extractToken(req);
    if (!token) return res.status(401).json({ success: false, message: "login required for draft/archived ad" });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "invalid token" });
    }

    const user = await User.findById(payload.userId).lean();
    if (!user) return res.status(401).json({ success: false, message: "user not found" });

    if (String(user.role) === "admin") return res.json({ success: true, ad });

    if (String(user.role) === "advertiser" && String(ad.advertiserUserId) === String(user._id)) {
      return res.json({ success: true, ad });
    }

    return res.status(403).json({ success: false, message: "forbidden" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "read failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Advertiser/Admin: create (draft)
// POST /api/ads
// ----------------------------------------------------------
router.post("/", requireAuth, requireRoles("advertiser", "admin"), async (req, res) => {
  try {
    const body = req.body || {};
    const title = String(body.title || "").trim();
    if (!title) return res.status(400).json({ success: false, message: "title required" });

    const doc = await Ad.create({
      advertiserUserId: req.user._id,
      title,
      description: String(body.description || ""),
      imageUrl: String(body.imageUrl || ""),
      targetUrl: String(body.targetUrl || ""),
      countryTargets: Array.isArray(body.countryTargets) && body.countryTargets.length ? body.countryTargets : ["ALL"],
      status: "draft",
      revision: 0,
      approvedRevision: 0,
    });

    return res.json({ success: true, ad: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "create failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Advertiser/Admin: update
// PUT /api/ads/:id
// ----------------------------------------------------------
router.put("/:id", requireAuth, requireRoles("advertiser", "admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};

    const ad = await Ad.findById(id);
    if (!ad) return res.status(404).json({ success: false, message: "not found" });

    const isOwner = String(ad.advertiserUserId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "forbidden" });

    // Reklamveren published/pending reklamı değiştirirse -> draft + revizyon + yayın metası temiz
    if (!isAdmin && (ad.status === "published" || ad.status === "pending")) {
      ad.status = "draft";
      ad.revision = Number(ad.revision || 0) + 1;
      ad.submittedAt = null;

      ad.publishedAt = null;
      ad.placementKey = "";
      ad.packageId = null;
      ad.packageName = "";
      ad.startAt = null;
      ad.endAt = null;
    }

    if (body.title != null) ad.title = String(body.title).trim();
    if (body.description != null) ad.description = String(body.description);
    if (body.imageUrl != null) ad.imageUrl = String(body.imageUrl);
    if (body.targetUrl != null) ad.targetUrl = String(body.targetUrl);
    if (body.countryTargets != null) ad.countryTargets = Array.isArray(body.countryTargets) ? body.countryTargets : ["ALL"];

    await ad.save();
    return res.json({ success: true, ad });
  } catch (err) {
    return res.status(500).json({ success: false, message: "update failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Advertiser submit: draft -> pending
// POST /api/ads/:id/publish
// ----------------------------------------------------------
router.post("/:id/publish", requireAuth, requireRoles("advertiser", "admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const ad = await Ad.findById(id);
    if (!ad) return res.status(404).json({ success: false, message: "not found" });

    const isOwner = String(ad.advertiserUserId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "forbidden" });

    // Admin publish burada kullanılmasın; admin approve ad-requests üzerinden ya da /approve ile yapsın
    if (isAdmin) {
      return res.status(400).json({ success: false, message: "use /approve for admin" });
    }

    if (ad.status !== "draft") {
      return res.status(400).json({ success: false, message: `cannot submit ad in status=${ad.status}` });
    }

    ad.status = "pending";
    ad.submittedAt = new Date();
    await ad.save();

    return res.json({ success: true, ad });
  } catch (err) {
    return res.status(500).json({ success: false, message: "publish failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Admin: approve pending ad (pending -> published)
// POST /api/ads/:id/approve
// ----------------------------------------------------------
router.post("/:id/approve", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const ad = await Ad.findById(id);
    if (!ad) return res.status(404).json({ success: false, message: "not found" });
    if (ad.status !== "pending") return res.status(400).json({ success: false, message: `not pending (status=${ad.status})` });

    ad.status = "published";
    ad.publishedAt = ad.publishedAt || new Date();
    ad.approvedAt = new Date();
    ad.approvedBy = req.user._id;
    ad.approvedRevision = Number(ad.revision || 0);

    ad.rejectedAt = null;
    ad.rejectedBy = null;
    ad.adminNote = String(req.body?.adminNote || ad.adminNote || "");

    await ad.save();
    return res.json({ success: true, ad });
  } catch (err) {
    return res.status(500).json({ success: false, message: "approve failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Admin: reject pending ad (pending -> rejected)
// POST /api/ads/:id/reject
// ----------------------------------------------------------
router.post("/:id/reject", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const ad = await Ad.findById(id);
    if (!ad) return res.status(404).json({ success: false, message: "not found" });
    if (ad.status !== "pending") return res.status(400).json({ success: false, message: `not pending (status=${ad.status})` });

    ad.status = "rejected";
    ad.rejectedAt = new Date();
    ad.rejectedBy = req.user._id;
    ad.adminNote = String(req.body?.adminNote || ad.adminNote || "");

    await ad.save();
    return res.json({ success: true, ad });
  } catch (err) {
    return res.status(500).json({ success: false, message: "reject failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Advertiser/Admin: archive
// POST /api/ads/:id/archive
// ----------------------------------------------------------
router.post("/:id/archive", requireAuth, requireRoles("advertiser", "admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const ad = await Ad.findById(id);
    if (!ad) return res.status(404).json({ success: false, message: "not found" });

    const isOwner = String(ad.advertiserUserId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "forbidden" });

    ad.status = "archived";
    await ad.save();
    return res.json({ success: true, ad });
  } catch (err) {
    return res.status(500).json({ success: false, message: "archive failed", error: err.message });
  }
});

// ----------------------------------------------------------
// Advertiser/Admin: delete
// DELETE /api/ads/:id
// ----------------------------------------------------------
router.delete("/:id", requireAuth, requireRoles("advertiser", "admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const ad = await Ad.findById(id);
    if (!ad) return res.status(404).json({ success: false, message: "not found" });

    const isOwner = String(ad.advertiserUserId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "forbidden" });

    await Ad.deleteOne({ _id: id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: "delete failed", error: err.message });
  }
});

module.exports = router;
