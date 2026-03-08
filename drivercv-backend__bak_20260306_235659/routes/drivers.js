// DriverAll-main/drivercv-backend/routes/drivers.js

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Cv = require("../models/Cv"); // CV modelini de dahil ettik

const { requireAuth, requireRoles } = require("../middleware/auth");

router.use(requireAuth, requireRoles("admin"));

// ----------------------------------------------------------
// Tüm kullanıcıları + CV özetlerini listele
// GET /api/drivers
// ----------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    // Kullanıcıları al
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select("-passwordHash");

    const userIds = users.map((u) => u._id);

    // Bu kullanıcıların CV'lerini toplu al
    const cvs = await Cv.find({ userId: { $in: userIds } }).sort({
      updatedAt: -1,
      createdAt: -1,
    });

    // Her kullanıcı için *en güncel* CV'yi map'le
    const cvMap = {};
    cvs.forEach((cvDoc) => {
      const uid = cvDoc.userId.toString();
      if (!cvMap[uid]) {
        cvMap[uid] = cvDoc;
      }
    });

    // Kullanıcıları, cvInfo ile zenginleştir
    const enriched = users.map((u) => {
      const obj = u.toObject();
      const cvDoc = cvMap[u._id.toString()];

      if (cvDoc) {
        const values = cvDoc.values || {};
        // Dolu alan sayısı (boş string, boş array, null vs. hariç)
        const filledKeysCount = Object.keys(values).filter((k) => {
          const v = values[k];
          if (v === null || v === undefined) return false;
          if (Array.isArray(v)) return v.length > 0;
          if (typeof v === "string") return v.trim() !== "";
          return true;
        }).length;

        obj.cvInfo = {
          hasCv: true,
          updatedAt: cvDoc.updatedAt || cvDoc.createdAt,
          filledKeysCount,
        };
      } else {
        obj.cvInfo = {
          hasCv: false,
          updatedAt: null,
          filledKeysCount: 0,
        };
      }

      return obj;
    });

    res.json({ users: enriched });
  } catch (err) {
    console.error("GET /api/drivers error:", err);
    res.status(500).json({
      message: "Kullanıcı listesi alınırken bir hata oluştu.",
    });
  }
});

// ----------------------------------------------------------
// Kullanıcı güncelle (isim, email, rol, aktiflik, onay, not)
// PUT /api/drivers/:id
// ----------------------------------------------------------
router.put("/:id", async (req, res) => {
  try {
    const allowed = [
      "name",
      "email",
      "role",
      "isActive",
      "isApproved",
      "notes",
      "activityAreas",
      "providerLimits",
    ];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    res.json({ user });
  } catch (err) {
    console.error("PUT /api/drivers/:id error:", err);
    res.status(500).json({
      message: "Kullanıcı güncellenirken bir hata oluştu.",
    });
  }
});

// ----------------------------------------------------------
// Kullanıcı sil
// DELETE /api/drivers/:id
// ----------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const existing = await User.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    await existing.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/drivers/:id error:", err);
    res.status(500).json({
      message: "Kullanıcı silinirken bir hata oluştu.",
    });
  }
});

module.exports = router;
