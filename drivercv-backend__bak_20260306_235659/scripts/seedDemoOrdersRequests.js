// PATH: drivercv-backend/scripts/seedDemoOrdersRequests.js
// ----------------------------------------------------------
// Dev helper: seed demo PackageOrders + pending AdRequest/JobRequest
// - Does NOT delete existing data
// Usage:
//   MONGO_URI="mongodb://127.0.0.1:27017/driverall_dev" node scripts/seedDemoOrdersRequests.js
// ----------------------------------------------------------

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Package = require("../models/Package");
const PackageOrder = require("../models/PackageOrder");
const AdRequest = require("../models/AdRequest");
const Job = require("../models/Job");
const JobRequest = require("../models/JobRequest");

function env(name, def) {
  const v = process.env[name];
  return v == null || String(v).trim() === "" ? def : v;
}

async function upsertUser({ email, password, role, name }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) throw new Error("email required");

  let u = await User.findOne({ email: normalizedEmail });
  if (u) return u;

  const hashed = await bcrypt.hash(String(password || ""), 10);
  u = await User.create({
    name: String(name || role || "User").trim() || "User",
    email: normalizedEmail,
    passwordHash: hashed,
    role,
    isActive: true,
    isApproved: true,
    phone: role === "employer" ? "05000000001" : role === "advertiser" ? "05000000002" : "05000000003",
  });
  return u;
}

function uniqCode(prefix) {
  return `${prefix}_${Date.now().toString(36).toUpperCase()}`;
}

async function ensurePackage({ type, name, credits, rules }) {
  const code = uniqCode(type);
  const doc = await Package.create({
    type,
    name,
    code,
    description: "Demo package (seed)",
    country: "TR",
    currency: "TRY",
    price: 0,
    credits: {
      jobCount: Number(credits?.jobCount || 0),
      adCount: Number(credits?.adCount || 0),
      jobPostCount: Number(credits?.jobPostCount || 0),
      cvViewCount: Number(credits?.cvViewCount || 0),
      cvSaveCount: Number(credits?.cvSaveCount || 0),
    },
    rules: {
      allowedPlacements: Array.isArray(rules?.allowedPlacements) ? rules.allowedPlacements : [],
      maxDurationDaysByPlacement: rules?.maxDurationDaysByPlacement || {},
      requiresApproval: true,
      listingDays: Number(rules?.listingDays || 0),
      homeDays: Number(rules?.homeDays || 0),
    },
    active: true,
    deletedAt: null,
  });
  return doc;
}

async function createPaidActiveOrder({ buyerUserId, pkg }) {
  const snap = pkg.toObject();
  const o = await PackageOrder.create({
    buyerUserId,
    packageId: pkg._id,
    packageSnapshot: snap,
    paymentStatus: "paid",
    orderStatus: "active",
    paidAt: new Date(),
    expiresAt: null,
    creditsRemaining: {
      jobCount: Number(pkg?.credits?.jobCount || 0),
      adCount: Number(pkg?.credits?.adCount || 0),
      jobPostCount: Number(pkg?.credits?.jobPostCount || 0),
      cvViewCount: Number(pkg?.credits?.cvViewCount || 0),
      cvSaveCount: Number(pkg?.credits?.cvSaveCount || 0),
    },
    adminNote: "demo seed order",
    updatedByAdminId: null,
  });
  return o;
}

async function main() {
  const MONGO_URI = env("MONGODB_URI", env("MONGO_URI", "mongodb://127.0.0.1:27017/driverall"));

  const advertiserEmail = env("DEMO_ADVERTISER_EMAIL", "advertiser-demo@driverall.com");
  const advertiserPassword = env("DEMO_ADVERTISER_PASSWORD", "demo12345");

  const employerEmail = env("DEMO_EMPLOYER_EMAIL", "employer-demo@driverall.com");
  const employerPassword = env("DEMO_EMPLOYER_PASSWORD", "demo12345");

  await mongoose.connect(MONGO_URI);
  console.log("[seedDemoOrdersRequests] Connected:", MONGO_URI);
  console.log("[seedDemoOrdersRequests] DB:", mongoose.connection.name);

  const advertiser = await upsertUser({
    email: advertiserEmail,
    password: advertiserPassword,
    role: "advertiser",
    name: "Demo Advertiser",
  });

  const employer = await upsertUser({
    email: employerEmail,
    password: employerPassword,
    role: "employer",
    name: "Demo Employer",
  });

  const adPkg = await ensurePackage({
    type: "AD",
    name: "DEMO AD PACKAGE",
    credits: { adCount: 2 },
    rules: {
      allowedPlacements: ["HOME_TOP", "HOME_RIGHT", "DASHBOARD_RIGHT"],
      maxDurationDaysByPlacement: { HOME_TOP: 3, HOME_RIGHT: 3, DASHBOARD_RIGHT: 3 },
    },
  });

  const jobPkg = await ensurePackage({
    type: "JOB",
    name: "DEMO JOB PACKAGE",
    credits: { jobPostCount: 2 },
    rules: {
      allowedPlacements: ["HOME_TOP", "HOME_RIGHT", "DASHBOARD_RIGHT"],
      maxDurationDaysByPlacement: { HOME_TOP: 7, HOME_RIGHT: 7, DASHBOARD_RIGHT: 7 },
      listingDays: 14,
      homeDays: 3,
    },
  });

  const adOrder = await createPaidActiveOrder({ buyerUserId: advertiser._id, pkg: adPkg });
  const jobOrder = await createPaidActiveOrder({ buyerUserId: employer._id, pkg: jobPkg });

  const adRequest = await AdRequest.create({
    advertiserUserId: advertiser._id,
    packageId: null,
    packageName: String(adPkg.name || ""),
    packageOrderId: adOrder._id,
    packageSnapshot: adPkg.toObject(),
    countryTargets: ["TR"],
    geoLevel: "country",
    geoTargets: [],
    placementKey: "HOME_TOP",
    requestedDays: 3,
    title: "Demo Reklam",
    creativeUrl: "https://placehold.co/1200x400?text=DriverAll+Demo+Ad",
    clickUrl: "https://example.com/",
    status: "pending",
  });

  const job = await Job.create({
    employerUserId: employer._id,
    branchId: null,
    branchSnapshot: {
      _id: null,
      code: "",
      displayName: "",
      locationLabel: "",
    },
    country: "TR",
    location: {
      countryCode: "TR",
      cityCode: "34",
      districtCode: "3401",
      label: "İstanbul / Adalar",
    },
    title: "Demo İlan (Pending Approval)",
    description: "Demo job for approval smoke test",
    criteria: {},
    status: "draft",
    revision: 0,
    approvedRevision: 0,
    submittedAt: null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    adminNote: "",
    publishedAt: null,
    placementKey: "",
    packageId: null,
    packageOrderId: null,
    packageName: "",
    startAt: null,
    endAt: null,
  });

  const jobRequest = await JobRequest.create({
    employerUserId: employer._id,
    jobId: job._id,
    jobTitle: String(job.title || ""),
    packageOrderId: jobOrder._id,
    packageName: String(jobPkg.name || ""),
    packageSnapshot: jobPkg.toObject(),
    placementKey: "HOME_RIGHT",
    requestedDays: 7,
    countryTargets: ["TR"],
    geoLevel: "country",
    note: "demo request",
    status: "pending",
  });

  console.log("\n[seedDemoOrdersRequests] Created:");
  console.log("advertiserUserId:", String(advertiser._id));
  console.log("employerUserId:", String(employer._id));
  console.log("adPackageId:", String(adPkg._id));
  console.log("jobPackageId:", String(jobPkg._id));
  console.log("adOrderId:", String(adOrder._id));
  console.log("jobOrderId:", String(jobOrder._id));
  console.log("adRequestId:", String(adRequest._id));
  console.log("jobId:", String(job._id));
  console.log("jobRequestId:", String(jobRequest._id));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("[seedDemoOrdersRequests] Error:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
