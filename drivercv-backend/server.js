// PATH: DriverAll-main/drivercv-backend/server.js
// BUILD_MARK: DA-FIX-2026-01-13

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// ----------------------------------------------------------
// MIDDLEWARE
// ----------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use("/api", require("./routes/driverApplications"));

// ----------------------------------------------------------
// SAFE REQUIRE (birden fazla olası dosya adını dener)
// ----------------------------------------------------------
function safeRequireAny(paths, label) {
  const arr = Array.isArray(paths) ? paths : [paths];
  for (const p of arr) {
    try {
      return require(p);
    } catch (err) {
      // bir sonraki alternatifi dene
    }
  }
  console.warn(`[WARN] Route yüklenemedi: ${label}. Denenenler: ${arr.join(", ")}`);
  return null;
}

// ----------------------------------------------------------
// ROUTES
// ----------------------------------------------------------
const authRoutes = safeRequireAny(["./routes/auth", "./routes/backend-routes-auth"], "auth");
const profileRoutes = safeRequireAny(["./routes/profile", "./routes/backend-routes-profile"], "profile");

const fieldDefRoutes = safeRequireAny(
  ["./routes/fieldDefinitions", "./routes/backend-routes-fieldDefinitions"],
  "fieldDefinitions"
);

const driversRoutes = safeRequireAny(["./routes/drivers", "./routes/backend-routes-drivers"], "drivers");
const adminFieldGroupsRoutes = safeRequireAny(
  ["./routes/adminFieldGroups", "./routes/backend-routes-adminFieldGroups"],
  "adminFieldGroups"
);

const usersRoutes = safeRequireAny(
  ["./routes/users", "./routes/backend-routes-users"],
  "users"
);

const cvRoutes = safeRequireAny(["./routes/cv", "./routes/backend-routes-cv"], "cv");
const cvProfileRoutes = safeRequireAny(
  ["./routes/cvProfile", "./routes/backend-routes-cvProfile"],
  "cvProfile"
);

const driverApplicationsRoutes = safeRequireAny(
  ["./routes/driverApplications", "./routes/backend-routes-driverApplications"],
  "driverApplications"
);

const adminApprovalsRoutes = safeRequireAny(
  ["./routes/adminApprovals", "./routes/backend-routes-adminApprovals"],
  "adminApprovals"
);

// Jobs + Locations
const jobsRoutes = safeRequireAny(["./routes/jobs", "./routes/backend-routes-jobs"], "jobs");
const locationsRoutes = safeRequireAny(["./routes/locations", "./routes/backend-routes-locations"], "locations");

// Ads / Packages / Campaigns
const adminAdPackagesRoutes = safeRequireAny(
  ["./routes/adminAdPackages", "./routes/backend-routes-adminAdPackages", "./routes/adPackages"],
  "adminAdPackages"
);
const publicAdPackagesRoutes = safeRequireAny(
  ["./routes/publicAdPackages", "./routes/backend-routes-publicAdPackages"],
  "publicAdPackages"
);
const adRequestsRoutes = safeRequireAny(
  ["./routes/adRequests", "./routes/backend-routes-adRequests"],
  "adRequests"
);
const publicAdCampaignsRoutes = safeRequireAny(
  ["./routes/publicAdCampaigns", "./routes/backend-routes-publicAdCampaigns"],
  "publicAdCampaigns"
);

// Job packages
const adminJobPackagesRoutes = safeRequireAny(
  ["./routes/adminJobPackages", "./routes/backend-routes-adminJobPackages"],
  "adminJobPackages"
);
const publicJobPackagesRoutes = safeRequireAny(
  ["./routes/publicJobPackages", "./routes/backend-routes-publicJobPackages"],
  "publicJobPackages"
);

// Job Requests (Employer -> Admin onayı)
const jobRequestsRoutes = safeRequireAny(
  ["./routes/jobRequests", "./routes/backend-routes-jobRequests"],
  "jobRequests"
);

// Profile Engine (Dynamic Schema)
const profileSchemaRoutes = safeRequireAny("./routes/profileSchema");
const adminProfileRolesRoutes = safeRequireAny("./routes/profileRoles");
const adminProfileSectionsRoutes = safeRequireAny("./routes/profileSections");
const adminProfileFieldsRoutes = safeRequireAny("./routes/profileFields");
const adminProfileOverridesRoutes = safeRequireAny("./routes/profileOverrides");

// ----------------------------------------------------------
// ROUTE MOUNT
// ----------------------------------------------------------
if (authRoutes) app.use("/api/auth", authRoutes);
if (profileRoutes) app.use("/api/profile", profileRoutes);
if (profileSchemaRoutes) app.use("/api/profile", profileSchemaRoutes);
if (adminProfileRolesRoutes) app.use("/api/admin/profile-roles", adminProfileRolesRoutes);
if (adminProfileSectionsRoutes) app.use("/api/admin/profile-sections", adminProfileSectionsRoutes);
if (adminProfileFieldsRoutes) app.use("/api/admin/profile-fields", adminProfileFieldsRoutes);
if (adminProfileOverridesRoutes) app.use("/api/admin/profile-overrides", adminProfileOverridesRoutes);

if (fieldDefRoutes) app.use("/api/admin/fields", fieldDefRoutes);
if (adminFieldGroupsRoutes) app.use("/api/admin/field-groups", adminFieldGroupsRoutes);

if (driversRoutes) app.use("/api/drivers", driversRoutes);

if (cvRoutes) app.use("/api/cv", cvRoutes);
if (cvProfileRoutes) app.use("/api/cv-profile", cvProfileRoutes);

// Jobs
if (jobsRoutes) app.use("/api/jobs", jobsRoutes);

// Locations
if (locationsRoutes) app.use("/api/locations", locationsRoutes);

// Applications
if (driverApplicationsRoutes) app.use("/api", driverApplicationsRoutes);

// Approvals
if (adminApprovalsRoutes) app.use("/api/admin/approvals", adminApprovalsRoutes);

// Ad Packages (Admin + Public)
if (adminAdPackagesRoutes) app.use("/api/admin/ad-packages", adminAdPackagesRoutes);
if (publicAdPackagesRoutes) app.use("/api/public/ad-packages", publicAdPackagesRoutes);

// Ad Requests
if (adRequestsRoutes) app.use("/api/ads/requests", adRequestsRoutes);

// Public Ad Campaigns (slot)
if (publicAdCampaignsRoutes) app.use("/api/public/ad-campaigns", publicAdCampaignsRoutes);

// Job Packages (Admin + Public)
if (adminJobPackagesRoutes) app.use("/api/admin/job-packages", adminJobPackagesRoutes);
if (publicJobPackagesRoutes) app.use("/api/public/job-packages", publicJobPackagesRoutes);

// Job Requests
if (jobRequestsRoutes) app.use("/api/job-requests", jobRequestsRoutes);
if (usersRoutes) app.use("/api/users", usersRoutes);

// ----------------------------------------------------------
// HEALTH CHECK
// ----------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "drivercv-backend", build: "DA-FIX-2026-01-13", time: new Date().toISOString() });
});

// ----------------------------------------------------------
// DB & SERVER
// ----------------------------------------------------------
const PORT = Number(process.env.PORT || 3001);
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongodb:27017/driverall";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB bağlantısı başarılı:", MONGO_URI);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Backend ${PORT} portunda çalışıyor`);
    });
  })
  .catch((err) => {
    console.error("MongoDB bağlantı hatası:", err.message);
    process.exit(1);
  });

module.exports = app;
