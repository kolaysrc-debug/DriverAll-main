// PATH: DriverAll-main/drivercv-backend/routes/adminDashboard.js
// ----------------------------------------------------------
// Admin Dashboard Summary Stats
// GET /api/admin/dashboard/stats
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Job = require("../models/Job");
const PackageOrder = require("../models/PackageOrder");
const PaymentTransaction = require("../models/PaymentTransaction");
const { requireAuth, requireRoles } = require("../middleware/auth");

// GET /api/admin/dashboard/stats
router.get("/stats", requireAuth, requireRoles("admin"), async (req, res) => {
  try {
    const [
      totalUsers,
      driverCount,
      employerCount,
      advertiserCount,
      totalJobs,
      publishedJobs,
      pendingPayments,
      activeOrders,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "driver" }),
      User.countDocuments({ role: { $in: ["employer", "company"] } }),
      User.countDocuments({ role: "advertiser" }),
      Job.countDocuments({}),
      Job.countDocuments({ status: "published" }),
      PaymentTransaction.countDocuments({ status: "pending" }),
      PackageOrder.countDocuments({ orderStatus: "active" }),
    ]);

    // Son 7 günde kayıt olan kullanıcılar
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    // Son 5 kayıt
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role createdAt")
      .lean();

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, drivers: driverCount, employers: employerCount, advertisers: advertiserCount, newThisWeek: newUsersThisWeek },
        jobs: { total: totalJobs, published: publishedJobs },
        payments: { pending: pendingPayments },
        orders: { active: activeOrders },
        recentUsers,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "dashboard stats failed", error: err.message });
  }
});

module.exports = router;
