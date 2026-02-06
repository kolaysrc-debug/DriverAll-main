// PATH: DriverAll-main/drivercv-backend/routes/profile.js
// ----------------------------------------------------------
// Profile API (race-safe) - REVISED
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Profile = require("../models/Profile");
const requireAuth = require("../middleware/auth");

/**
 * MongoDB "Conflict" hatasını önleyen yardımcı fonksiyon.
 * $set içinde olan anahtarları defaults ($setOnInsert) içinden siler.
 */
const prepareUpsert = ($set, defaults) => {
  const $setOnInsert = { ...defaults };
  Object.keys($set).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call($setOnInsert, key)) {
      delete $setOnInsert[key];
    }
  });
  return $setOnInsert;
};

function normStr(v, def = "") {
  if (v === null || v === undefined) return def;
  return String(v).trim();
}

function normalizeCountryCode(input, fallback = "TR") {
  const raw = normStr(input, "");
  if (!raw) return fallback;
  const u = raw.toUpperCase();
  if (u === "ALL") return "ALL";
  if (u.length === 2) return u;

  const alias = {
    TURKEY: "TR", TURKIYE: "TR", "TÜRKİYE": "TR",
    "TÜRKİYE CUMHURİYETİ": "TR", "TURKIYE CUMHURIYETI": "TR", "TURKIYE CUMHURİYETİ": "TR",
  };
  return alias[u] || fallback;
}

function pickLocation(body, fallbackCountry = "TR") {
  const b = body || {};
  const loc = (b.location && typeof b.location === "object") ? b.location : {};
  const countryCode = normalizeCountryCode(b.country || loc.countryCode, fallbackCountry);

  const cityCode = normStr(loc.cityCode || loc.stateCode || "", "");
  const districtCode = normStr(loc.districtCode || "", "");
  const label = normStr(loc.label || "", "");

  return { countryCode, cityCode, districtCode, label };
}

// ----------------------------------------------------------
// GET /api/profile/me
// ----------------------------------------------------------
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Giriş gerekli." });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    const $set = {}; // GET'te update yapmıyoruz
    const defaults = {
      user: userId,
      role: user.role || "driver",
      fullName: user.name || "",
      phone: user.phone || "",
      country: user.country || "TR",
      city: user.city || "",
      district: "",
      location: {
        countryCode: user.country || "TR",
        cityCode: "",
        districtCode: "",
        label: "",
      },
      about: "",
      experienceYears: null,
      dynamicValues: {},
    };

    const $setOnInsert = prepareUpsert($set, defaults);

    let profile = await Profile.findOneAndUpdate(
      { user: userId },
      { $setOnInsert, $set },
      { new: true, upsert: true }
    ).lean();

    if (profile && user.role && profile.role !== user.role) {
      await Profile.updateOne({ user: userId }, { $set: { role: user.role } });
      profile = { ...profile, role: user.role };
    }

    return res.json({ success: true, profile });
  } catch (err) {
    console.error("Profil getirme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Profil getirme hatası.",
      error: err?.message || String(err),
    });
  }
});

// ----------------------------------------------------------
// PUT /api/profile/me
// ----------------------------------------------------------
router.put("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Giriş gerekli." });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    const body = req.body || {};
    const incomingRole = normStr(body.role || user.role || "driver", "driver");
    const incomingCountry = normalizeCountryCode(body.country || user.country || "TR", "TR");
    const location = pickLocation(body, incomingCountry);

    // TR validasyonları
    if (incomingCountry === "TR") {
      if (incomingRole === "driver") {
        if (!location.cityCode) return res.status(400).json({ success: false, message: "İl zorunludur." });
        if (!location.districtCode) return res.status(400).json({ success: false, message: "İlçe zorunludur." });
      }
      if (incomingRole === "employer" || incomingRole === "advertiser") {
        if (!location.cityCode) return res.status(400).json({ success: false, message: "İl zorunludur." });
      }
    }

    const $set = {};
    if (body.role != null) $set.role = incomingRole;
    if (body.fullName != null) $set.fullName = normStr(body.fullName);
    if (body.phone != null) $set.phone = normStr(body.phone);
    if (body.country != null) $set.country = incomingCountry;
    if (body.city != null) $set.city = normStr(body.city);
    if (body.district != null) $set.district = normStr(body.district);

    if (body.location != null) {
      $set.location = {
        countryCode: location.countryCode,
        cityCode: location.cityCode,
        districtCode: location.districtCode,
        label: location.label,
      };
      if (!$set.city && location.label) {
        $set.city = location.label.split("/")[0]?.trim() || $set.city || "";
      }
      if (!$set.district && location.label && location.label.includes("/")) {
        $set.district = location.label.split("/")[1]?.trim() || $set.district || "";
      }
    }

    if (body.about != null) $set.about = normStr(body.about);

    if (body.experienceYears === null || body.experienceYears === "" || body.experienceYears === undefined) {
      $set.experienceYears = null;
    } else {
      const n = Number(body.experienceYears);
      $set.experienceYears = Number.isFinite(n) ? n : null;
    }

    if (body.dynamicValues != null && typeof body.dynamicValues === "object") {
      $set.dynamicValues = body.dynamicValues;
    }

    // Default seed (Sadece insert anı için)
    const defaults = {
      user: userId,
      role: user.role || "driver",
      fullName: user.name || "",
      phone: user.phone || "",
      country: user.country || "TR",
      city: user.city || "",
      district: "",
      location: {
        countryCode: user.country || "TR",
        cityCode: "",
        districtCode: "",
        label: "",
      },
      about: "",
      experienceYears: null,
      dynamicValues: {},
    };

    // Çakışan alanları defaults'tan temizleyelim
    const $setOnInsert = prepareUpsert($set, defaults);

    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { $setOnInsert, $set },
      { new: true, upsert: true }
    ).lean();

    return res.json({ success: true, profile });
  } catch (err) {
    console.error("Profil kaydetme hatası:", err);
    return res.status(500).json({
      success: false,
      message: "Profil kaydetme hatası.",
      error: err?.message || String(err),
    });
  }
});

module.exports = router;