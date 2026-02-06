// DriverAll-main/drivercv-backend/routes/adminUsers.js

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev-driverall-secret";

// ----------------------------------------------------------
// Ortak middleware: sadece admin erişsin
// ----------------------------------------------------------
function adminOnly(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Yetkilendirme gerekli (token yok)." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Bu işleme sadece admin kullanıcılar erişebilir." });
    }

    req.user = payload;
    next();
  } catch (err) {
    console.error("adminOnly error:", err);
    return res
      .status(401)
      .json({ message: "Geçersiz veya süresi dolmuş oturum (token)." });
  }
}

// Tüm alt rotalara admin kontrolü uygula
router.use(adminOnly);

// ----------------------------------------------------------
// 1) Tüm kullanıcıları listele
// GET /api/admin/users
// ----------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    res.status(500).json({ message: "Kullanıcı listesi alınamadı." });
  }
});

// ----------------------------------------------------------
// 2) Kullanıcı aktif/pasif yap
// PUT /api/admin/users/:id/toggle-active
// ----------------------------------------------------------
router.put("/:id/toggle-active", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    if (user.role === "admin") {
      return res
        .status(400)
        .json({ message: "Admin kullanıcı pasifleştirilemez." });
    }

    user.isActive = user.isActive === false ? true : !user.isActive;
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    console.error("PUT /api/admin/users/:id/toggle-active error:", err);
    res.status(500).json({ message: "Aktif/pasif işlemi başarısız." });
  }
});

// ----------------------------------------------------------
// 3) Kullanıcı onay durumunu değiştir
// PUT /api/admin/users/:id/toggle-approve
// ----------------------------------------------------------
router.put("/:id/toggle-approve", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    user.isApproved = !user.isApproved;
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    console.error("PUT /api/admin/users/:id/toggle-approve error:", err);
    res.status(500).json({ message: "Onay işlemi başarısız." });
  }
});

// ----------------------------------------------------------
// 4) Kullanıcı sil (admin hariç)
// DELETE /api/admin/users/:id
// ----------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    if (user.role === "admin") {
      return res
        .status(400)
        .json({ message: "Admin kullanıcı silinemez." });
    }

    await user.deleteOne();

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/users/:id error:", err);
    res.status(500).json({ message: "Kullanıcı silinemedi." });
  }
});

module.exports = router;
// PATH: DriverAll-main/drivercv-backend/routes/adminUsers.js
// ----------------------------------------------------------
// Admin user yönetimi: pending onaylar
// ----------------------------------------------------------

const { requireAuth, requireRoles } = require("../middleware/auth");

// Pending kullanıcılar (role filtreli)
router.get("/pending", requireAuth, requireRoles("admin"), async (req, res) => {
  const role = String(req.query.role || "").trim(); // advertiser / employer vb.
  const q = { approvalStatus: "pending" };
  if (role) q.role = role;

  const users = await User.find(q)
    .select("_id email role approvalStatus companyName phone country createdAt")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, users });
});

// Onayla / reddet
router.patch(
  "/:id/approval",
  requireAuth,
  requireRoles("admin"),
  async (req, res) => {
    const id = req.params.id;
    const next = String(req.body.approvalStatus || "").trim(); // approved|rejected|pending

    if (!["approved", "rejected", "pending"].includes(next)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid approvalStatus" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { approvalStatus: next },
      { new: true }
    )
      .select("_id email role approvalStatus")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  }
);

module.exports = router;
