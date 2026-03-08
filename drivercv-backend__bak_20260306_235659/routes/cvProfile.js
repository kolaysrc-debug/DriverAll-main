// DriverAll-main/drivercv-backend/routes/cvProfile.js

const express = require("express");
const router = express.Router();

const DriverCvProfile = require("../models/DriverCvProfile");
const FieldDefinition = require("../models/FieldDefinition");
const auth = require("../middleware/auth"); // <<< sende profile.js'de de böyle

// ----------------------------------------------------------
// Yardımcılar
// ----------------------------------------------------------

// CV profili getir / yoksa oluştur
async function getOrCreateProfile(userId) {
  let profile = await DriverCvProfile.findOne({ user: userId });
  if (!profile) {
    profile = new DriverCvProfile({
      user: userId,
      country: "TR",
      criteria: {},
    });
    await profile.save();
  }
  return profile;
}

// auth middleware'i bizim projede req.userId dolduruyor
function getUserIdFromReq(req) {
  if (req.userId) return req.userId;

  if (req.user && (req.user.id || req.user._id)) {
    return req.user.id || req.user._id;
  }

  if (req.currentUser && (req.currentUser.id || req.currentUser._id)) {
    return req.currentUser.id || req.currentUser._id;
  }

  if (req.session) {
    if (req.session.userId) return req.session.userId;
    if (req.session.user && (req.session.user.id || req.session.user._id)) {
      return req.session.user.id || req.session.user._id;
    }
  }

  return null;
}

// criteria alanını her durumda sade JS objeye çevir
function criteriaToPlain(criteria) {
  try {
    if (!criteria) return {};

    // Mongoose Map veya normal Map ise
    if (criteria instanceof Map) {
      return Object.fromEntries(criteria);
    }

    // Bazı durumlarda Mongoose internal obje gelebilir
    if (typeof criteria.toObject === "function") {
      const obj = criteria.toObject();
      if (obj && typeof obj === "object") return obj;
    }

    if (typeof criteria === "object") {
      return { ...criteria };
    }

    return {};
  } catch (e) {
    console.error("criteriaToPlain error:", e);
    return {};
  }
}

// Gelen criteria'yı profile.criteria'ya uygula
function applyCriteria(profile, newCriteria) {
  if (!newCriteria || typeof newCriteria !== "object") return;

  // Mongoose Map kullanıyorsak
  if (profile.criteria instanceof Map) {
    for (const [key, val] of Object.entries(newCriteria)) {
      const shouldDelete =
        val === null ||
        val === undefined ||
        (typeof val === "string" && val.trim() === "");

      if (shouldDelete) {
        profile.criteria.delete(key);
      } else {
        profile.criteria.set(key, val);
      }
    }
    return;
  }

  // Normal JS obje ise
  let base =
    profile.criteria && typeof profile.criteria === "object"
      ? { ...profile.criteria }
      : {};

  for (const [key, val] of Object.entries(newCriteria)) {
    const shouldDelete =
      val === null ||
      val === undefined ||
      (typeof val === "string" && val.trim() === "");

    if (shouldDelete) {
      delete base[key];
    } else {
      base[key] = val;
    }
  }

  profile.criteria = base;
}

// ----------------------------------------------------------
// GET /api/cv-profile/me
// ----------------------------------------------------------
router.get("/me", auth, async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Oturum bulunamadı." });
    }

    const profile = await getOrCreateProfile(userId);

    const fields = await FieldDefinition.find({
      showInCv: true,
      active: true,
    }).sort({ category: 1, groupKey: 1, label: 1 });

    return res.json({
      profile: {
        id: profile._id,
        country: profile.country || "TR",
        fullName: profile.fullName || "",
        city: profile.city || "",
        phone: profile.phone || "",
        birthYear:
          typeof profile.birthYear === "number" ? profile.birthYear : null,
        experienceYears:
          typeof profile.experienceYears === "number"
            ? profile.experienceYears
            : null,
        criteria: criteriaToPlain(profile.criteria),
      },
      fields,
    });
  } catch (err) {
    console.error("GET /api/cv-profile/me error:", err);
    return res
      .status(500)
      .json({ message: "CV profili alınırken bir hata oluştu." });
  }
});

// ----------------------------------------------------------
// PUT /api/cv-profile/me
// ----------------------------------------------------------
router.put("/me", auth, async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Oturum bulunamadı." });
    }

    const profile = await getOrCreateProfile(userId);

    const {
      country,
      fullName,
      city,
      phone,
      birthYear,
      experienceYears,
      criteria,
    } = req.body || {};

    if (typeof country === "string") profile.country = country;
    if (typeof fullName === "string") profile.fullName = fullName;
    if (typeof city === "string") profile.city = city;
    if (typeof phone === "string") profile.phone = phone;

    if (birthYear !== undefined) {
      profile.birthYear =
        birthYear === null || birthYear === ""
          ? null
          : Number.parseInt(birthYear, 10);
    }

    if (experienceYears !== undefined) {
      profile.experienceYears =
        experienceYears === null || experienceYears === ""
          ? null
          : Number.parseInt(experienceYears, 10);
    }

    if (criteria && typeof criteria === "object") {
      applyCriteria(profile, criteria);
    }

    await profile.save();

    return res.json({
      profile: {
        id: profile._id,
        country: profile.country || "TR",
        fullName: profile.fullName || "",
        city: profile.city || "",
        phone: profile.phone || "",
        birthYear:
          typeof profile.birthYear === "number" ? profile.birthYear : null,
        experienceYears:
          typeof profile.experienceYears === "number"
            ? profile.experienceYears
            : null,
        criteria: criteriaToPlain(profile.criteria),
      },
    });
  } catch (err) {
    console.error("PUT /api/cv-profile/me error:", err);
    return res
      .status(500)
      .json({ message: "CV profili güncellenirken bir hata oluştu." });
  }
});

module.exports = router;
