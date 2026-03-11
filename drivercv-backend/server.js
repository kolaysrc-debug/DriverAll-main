// PATH: DriverAll-main/drivercv-backend/server.js
// BUILD_MARK: DA-FIX-2026-01-13

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const passport = require("./config/passport");

const app = express();

// Passport initialize
app.use(passport.initialize());

const FieldDefinition = require("./models/FieldDefinition");
const FieldGroup = require("./models/FieldGroup");
const DeletedDefaultField = require("./models/DeletedDefaultField");

// ----------------------------------------------------------
// MIDDLEWARE
// ----------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", require("./routes/driverApplications"));

// ----------------------------------------------------------
// DB readiness guard (Mongo kapalıysa 500 yerine 503 dön)
// ----------------------------------------------------------
app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) return next();
  if (req.path === "/api/health") return next();

  // 1 = connected
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "DB unavailable (MongoDB bağlantısı yok)",
      mongoReadyState: mongoose.connection.readyState,
    });
  }

  return next();
});

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
const authOtpRoutes = safeRequireAny(["./routes/authOtp"], "authOtp");
const authOAuthRoutes = safeRequireAny(["./routes/authOAuth"], "authOAuth");
const profileRoutes = safeRequireAny(["./routes/profile", "./routes/backend-routes-profile"], "profile");

const adminOtpConfigRoutes = safeRequireAny(["./routes/adminOtpConfig"], "adminOtpConfig");
const adminOtpCredentialsRoutes = safeRequireAny(
  ["./routes/adminOtpCredentials"],
  "adminOtpCredentials"
);

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

const adminBusinessPoliciesRoutes = safeRequireAny(
  ["./routes/adminBusinessPolicies", "./routes/backend-routes-adminBusinessPolicies"],
  "adminBusinessPolicies"
);

const companyProfilesRoutes = safeRequireAny(
  ["./routes/companyProfiles", "./routes/backend-routes-companyProfiles"],
  "companyProfiles"
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

const publicAdEventsRoutes = safeRequireAny(["./routes/publicAdEvents"], "publicAdEvents");

const publicRolesRoutes = safeRequireAny(["./routes/publicRoles"], "publicRoles");

const adminAdCampaignsRoutes = safeRequireAny(["./routes/adminAdCampaigns"], "adminAdCampaigns");

const adminPlacementsRoutes = safeRequireAny(["./routes/adminPlacements"], "adminPlacements");
const adminGeoGroupsRoutes = safeRequireAny(["./routes/adminGeoGroups"], "adminGeoGroups");

// Packages (new engine) + Orders
const adminPackagesRoutes = safeRequireAny(
  ["./routes/adminPackages", "./routes/backend-routes-adminPackages"],
  "adminPackages"
);
const packagesRoutes = safeRequireAny(
  ["./routes/packages", "./routes/backend-routes-packages"],
  "packages"
);
const ordersRoutes = safeRequireAny(
  ["./routes/orders", "./routes/backend-routes-orders"],
  "orders"
);
const adminOrdersRoutes = safeRequireAny(
  ["./routes/adminOrders", "./routes/backend-routes-adminOrders"],
  "adminOrders"
);

const paymentsRoutes = safeRequireAny(
  ["./routes/payments"],
  "payments"
);
const adminPaymentsRoutes = safeRequireAny(
  ["./routes/adminPayments"],
  "adminPayments"
);

// Job Requests (Employer -> Admin onayı)
const jobRequestsRoutes = safeRequireAny(
  ["./routes/jobRequests", "./routes/backend-routes-jobRequests"],
  "jobRequests"
);

// Profile Engine (Dynamic Schema)
const profileSchemaRoutes = safeRequireAny(["./routes/profileSchema"], "profileSchema");
const adminProfileRolesRoutes = safeRequireAny(["./routes/profileRoles"], "profileRoles");
const adminProfileSectionsRoutes = safeRequireAny(["./routes/profileSections"], "profileSections");
const adminProfileFieldsRoutes = safeRequireAny(["./routes/profileFields"], "profileFields");
const adminProfileOverridesRoutes = safeRequireAny(["./routes/profileOverrides"], "profileOverrides");

// Dynamic Profile System
const dynamicRolesRoutes = safeRequireAny(["./routes/dynamicRoles"], "dynamicRoles");
const dynamicProfilesRoutes = safeRequireAny(["./routes/dynamicProfiles"], "dynamicProfiles");

// Dynamic Fields and Industries
const dynamicFieldsRoutes = safeRequireAny(["./routes/dynamicFields"], "dynamicFields");
const industriesRoutes = safeRequireAny(["./routes/industries"], "industries");

// Criteria preview (JSON AST evaluate)
const adminCriteriaPreviewRoutes = safeRequireAny(
  ["./routes/adminCriteriaPreview"],
  "adminCriteriaPreview"
);

// Product instruction/task tracker (persistent)
const adminTasksRoutes = safeRequireAny(["./routes/adminTasks"], "adminTasks");

// Admin preview/simulate endpoints
const adminPreviewRoutes = safeRequireAny(["./routes/adminPreview"], "adminPreview");

// SubUser and Branch Models
const subUserRoutes = safeRequireAny(["./routes/subUsers"], "subUsers");
const branchRoutes = safeRequireAny(["./routes/branches"], "branches");

// Admin Users
const adminUsersRoutes = safeRequireAny(["./routes/adminUsers"], "adminUsers");

// SubUser auth + actions
const subAuthRoutes = safeRequireAny(["./routes/subAuth"], "subAuth");
const subActionsRoutes = safeRequireAny(["./routes/subActions"], "subActions");
const ownerSubActionsRoutes = safeRequireAny(["./routes/ownerSubActions"], "ownerSubActions");
const ownerSubUsersRoutes = safeRequireAny(["./routes/ownerSubUsers"], "ownerSubUsers");

// Approval System
const approvalRoutes = safeRequireAny(["./routes/approvals"], "approvals");

// Employer self-service branches
const employerBranchesRoutes = safeRequireAny(["./routes/branchesEmployer"], "employerBranches");

// Service Listings (Hizmet Veren)
const serviceListingsRoutes = safeRequireAny(["./routes/serviceListings"], "serviceListings");
const adminServiceCategoriesRoutes = safeRequireAny(["./routes/adminServiceCategories"], "adminServiceCategories");
const publicServiceCategoriesRoutes = safeRequireAny(["./routes/publicServiceCategories"], "publicServiceCategories");

// Uploads (avatar + document)
const uploadsRoutes = safeRequireAny(["./routes/uploads"], "uploads");

// ----------------------------------------------------------
// ROUTE MOUNT
// ----------------------------------------------------------
if (authRoutes) app.use("/api/auth", authRoutes);
if (authOtpRoutes) app.use("/api/auth/otp", authOtpRoutes);
if (authOAuthRoutes) app.use("/api/auth", authOAuthRoutes);
if (adminOtpConfigRoutes) app.use("/api/admin/otp-config", adminOtpConfigRoutes);
if (adminOtpCredentialsRoutes) app.use("/api/admin/otp-credentials", adminOtpCredentialsRoutes);
if (profileRoutes) app.use("/api/profile", profileRoutes);
if (profileSchemaRoutes) app.use("/api/profile", profileSchemaRoutes);
if (adminProfileRolesRoutes) app.use("/api/admin/profile-roles", adminProfileRolesRoutes);
if (adminProfileSectionsRoutes) app.use("/api/admin/profile-sections", adminProfileSectionsRoutes);
if (adminProfileFieldsRoutes) app.use("/api/admin/profile-fields", adminProfileFieldsRoutes);
if (adminProfileOverridesRoutes) app.use("/api/admin/profile-overrides", adminProfileOverridesRoutes);

// Dynamic Profile Routes
if (dynamicRolesRoutes) app.use("/api/admin/dynamic-roles", dynamicRolesRoutes);
if (dynamicProfilesRoutes) app.use("/api/profile/dynamic", dynamicProfilesRoutes);

// Dynamic Fields and Industries
if (dynamicFieldsRoutes) app.use("/api/admin/dynamic-fields", dynamicFieldsRoutes);
if (industriesRoutes) app.use("/api/admin/industries", industriesRoutes);

// Criteria preview
if (adminCriteriaPreviewRoutes) app.use("/api/admin/criteria-preview", adminCriteriaPreviewRoutes);

// Instruction/Task tracker
if (adminTasksRoutes) app.use("/api/admin/tasks", adminTasksRoutes);

// Public ad events (impression/click)
if (publicAdEventsRoutes) app.use("/api/public/ad-events", publicAdEventsRoutes);

// Public roles config
if (publicRolesRoutes) app.use("/api/public/roles", publicRolesRoutes);

// Preview/Simulate
if (adminPreviewRoutes) app.use("/api/admin/preview", adminPreviewRoutes);

// SubUser and Branch Routes
if (subUserRoutes) app.use("/api/admin/subusers", subUserRoutes);
if (branchRoutes) app.use("/api/admin/branches", branchRoutes);
if (employerBranchesRoutes) app.use("/api/branches", employerBranchesRoutes);

// Uploads (avatar + document)
if (uploadsRoutes) app.use("/api/uploads", uploadsRoutes);

// Admin Users
if (adminUsersRoutes) app.use("/api/admin/users", adminUsersRoutes);

// SubUser auth + actions
if (subAuthRoutes) app.use("/api/subauth", subAuthRoutes);
if (subActionsRoutes) app.use("/api/sub", subActionsRoutes);
if (ownerSubActionsRoutes) app.use("/api/owner/sub-actions", ownerSubActionsRoutes);
if (ownerSubUsersRoutes) app.use("/api/owner/subusers", ownerSubUsersRoutes);

// Approval System
if (approvalRoutes) app.use("/api/admin/approvals", approvalRoutes);

if (fieldDefRoutes) app.use("/api/admin/fields", fieldDefRoutes);
if (adminFieldGroupsRoutes) app.use("/api/admin/field-groups", adminFieldGroupsRoutes);

// Non-admin aliases (driver/employer UI compatibility)
if (fieldDefRoutes) app.use("/api/fields", fieldDefRoutes);
if (adminFieldGroupsRoutes) app.use("/api/field-groups", adminFieldGroupsRoutes);

if (driversRoutes) app.use("/api/drivers", driversRoutes);

if (cvRoutes) app.use("/api/cv", cvRoutes);
if (cvProfileRoutes) app.use("/api/cv-profile", cvProfileRoutes);

// Jobs
if (jobsRoutes) app.use("/api/jobs", jobsRoutes);

// Locations
if (locationsRoutes) app.use("/api/locations", locationsRoutes);

// Company Profile (Advertiser + Admin)
if (companyProfilesRoutes) app.use("/api/company-profile", companyProfilesRoutes);

// Applications
if (driverApplicationsRoutes) app.use("/api", driverApplicationsRoutes);

// Approvals
if (adminApprovalsRoutes) app.use("/api/admin/approvals", adminApprovalsRoutes);

// Business Policies
if (adminBusinessPoliciesRoutes) app.use("/api/admin/business-policies", adminBusinessPoliciesRoutes);

// Ad Packages (Admin + Public)
if (adminAdPackagesRoutes) app.use("/api/admin/ad-packages", adminAdPackagesRoutes);
if (publicAdPackagesRoutes) app.use("/api/public/ad-packages", publicAdPackagesRoutes);

// Ad Campaigns (Admin)
if (adminAdCampaignsRoutes) app.use("/api/admin/ad-campaigns", adminAdCampaignsRoutes);

// Ad Placements + Geo Groups (Admin)
if (adminPlacementsRoutes) app.use("/api/admin/placements", adminPlacementsRoutes);
if (adminGeoGroupsRoutes) app.use("/api/admin/geo-groups", adminGeoGroupsRoutes);

// Ad Requests
if (adRequestsRoutes) app.use("/api/ads/requests", adRequestsRoutes);
if (adRequestsRoutes) app.use("/api/ad-requests", adRequestsRoutes);

// Public Ad Campaigns (slot)
if (publicAdCampaignsRoutes) app.use("/api/public/ad-campaigns", publicAdCampaignsRoutes);

// Packages + Orders
if (adminPackagesRoutes) app.use("/api/admin/packages", adminPackagesRoutes);
if (packagesRoutes) app.use("/api/packages", packagesRoutes);
if (ordersRoutes) app.use("/api/orders", ordersRoutes);
if (adminOrdersRoutes) app.use("/api/admin/orders", adminOrdersRoutes);

// Payments
if (paymentsRoutes) app.use("/api/payments", paymentsRoutes);
if (adminPaymentsRoutes) app.use("/api/admin/payments", adminPaymentsRoutes);

// Job Requests
if (jobRequestsRoutes) app.use("/api/job-requests", jobRequestsRoutes);
if (usersRoutes) app.use("/api/users", usersRoutes);

// Service Listings + Categories
if (serviceListingsRoutes) app.use("/api/service-listings", serviceListingsRoutes);
if (adminServiceCategoriesRoutes) app.use("/api/admin/service-categories", adminServiceCategoriesRoutes);
if (publicServiceCategoriesRoutes) app.use("/api/public/service-categories", publicServiceCategoriesRoutes);

// ----------------------------------------------------------
// HEALTH CHECK
// ----------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "drivercv-backend",
    build: "DA-FIX-2026-01-13",
    time: new Date().toISOString(),
    mongo: {
      readyState: mongoose.connection.readyState,
      isConnected: mongoose.connection.readyState === 1,
      name: mongoose.connection?.name,
      host: mongoose.connection?.host,
      port: mongoose.connection?.port,
    },
  });
});

// ----------------------------------------------------------
// DB & SERVER
// ----------------------------------------------------------
const PORT = Number(process.env.PORT || 3001);
const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/driverall";

function connectWithRetry(attempt = 1) {
  return mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("MongoDB bağlantısı başarılı:", MONGO_URI);
      console.log(
        "MongoDB db/host:",
        mongoose.connection?.name,
        mongoose.connection?.host,
        mongoose.connection?.port
      );

      (async () => {
        try {
          const disableDefaultFields =
            String(process.env.DISABLE_DEFAULT_FIELDS || "").trim() === "1" ||
            String(process.env.DISABLE_DEFAULT_FIELDS || "").trim().toLowerCase() === "true";
          if (disableDefaultFields) return;

          if (!fieldDefRoutes || !fieldDefRoutes.DEFAULT_FIELDS) return;

          const defaults = Array.isArray(fieldDefRoutes.DEFAULT_FIELDS)
            ? fieldDefRoutes.DEFAULT_FIELDS
            : [];
          if (defaults.length === 0) return;

          let tombstonedKeys = new Set();
          try {
            if (DeletedDefaultField) {
              const deleted = await DeletedDefaultField.find({})
                .select({ key: 1 })
                .lean();
              tombstonedKeys = new Set(
                (deleted || [])
                  .map((x) => String(x?.key || "").trim())
                  .filter(Boolean)
              );
            }
          } catch (e) {
            console.warn("[bootstrap] DeletedDefaultField read failed:", e?.message || e);
          }

          const ops = defaults
            .map((f) => ({
              key: f?.key,
              label: f?.label,
              category: f?.category,
              country: f?.country,
              fieldType: f?.fieldType,
              uiType: f?.uiType,
              required: f?.required,
              active: f?.active,
              showInCv: f?.showInCv,
              showInJobFilter: f?.showInJobFilter,
              groupLabel: f?.groupLabel,
              coversKeys: f?.coversKeys,
              requiresKeys: f?.requiresKeys,
              hasExpiry: f?.hasExpiry,
              requiresIssueDate: f?.requiresIssueDate,
              expiryMode: f?.expiryMode,
              durationYearsFromIssue: f?.durationYearsFromIssue,
              validityYears: f?.validityYears,
              validityModel: f?.validityModel,
              notification: f?.notification,
              roles: f?.roles,
              engines: f?.engines,
              zones: f?.zones,
              meta: f?.meta,
            }))
            .filter((x) => x.key && x.label)
            .filter((x) => !tombstonedKeys.has(String(x.key || "").trim()))
            .map((doc) => ({
              updateOne: {
                filter: { key: doc.key },
                update: { $setOnInsert: doc },
                upsert: true,
              },
            }));

          if (ops.length === 0) return;

          await FieldDefinition.bulkWrite(ops, { ordered: false });
          console.log(`[bootstrap] Default FieldDefinitions upserted (missing-only): ${ops.length}`);

          try {
            const groups = await FieldGroup.find({
              domain: { $in: ["profile", "job"] },
              active: { $ne: false },
            })
              .select({ groupKey: 1, domain: 1 })
              .lean();

            const groupKeyToCategory = new Map(
              (groups || [])
                .map((g) => {
                  const gk = String(g?.groupKey || "").trim();
                  const d = String(g?.domain || "").trim().toLowerCase();
                  const cat = d === "job" ? "job" : d === "profile" ? "profile" : "";
                  return gk && cat ? [gk, cat] : null;
                })
                .filter(Boolean)
            );

            if (groupKeyToCategory.size > 0) {
              const updates = [];
              for (const [groupKey, category] of groupKeyToCategory.entries()) {
                updates.push({
                  updateMany: {
                    filter: {
                      groupKey,
                      category: { $ne: category },
                      active: { $ne: false },
                    },
                    update: { $set: { category } },
                  },
                });
              }
              if (updates.length > 0) {
                await FieldDefinition.bulkWrite(updates, { ordered: false });
              }
            }
          } catch (e) {
            console.warn("[bootstrap] FieldDefinition.category normalize failed:", e?.message || e);
          }

          // Migration: Süreli belgelere hasExpiry + expiryMode ekle (SRC, MYK, ADR, Psikoteknik)
          try {
            const expiryKeys = [
              "SRC1_TR", "SRC2_TR", "SRC3_TR", "SRC4_TR", "SRC5_TR",
              "HAS_MYK", "HAS_ADR", "HAS_PSYCHOTECHNIC",
            ];
            const migResult = await FieldDefinition.updateMany(
              {
                key: { $in: expiryKeys },
                $or: [
                  { hasExpiry: { $ne: true } },
                  { expiryMode: { $exists: false } },
                  { expiryMode: null },
                  { expiryMode: "none" },
                  { durationYearsFromIssue: { $exists: false } },
                  { durationYearsFromIssue: null },
                ],
              },
              {
                $set: {
                  hasExpiry: true,
                  requiresIssueDate: true,
                  expiryMode: "durationFromIssue",
                  durationYearsFromIssue: 5,
                },
              }
            );
            if (migResult.modifiedCount > 0) {
              console.log(`[bootstrap] hasExpiry migration: ${migResult.modifiedCount} fields updated`);
            }
          } catch (e) {
            console.warn("[bootstrap] hasExpiry migration failed:", e?.message || e);
          }

          // Extra self-heal for legacy/mistaken data: If a field is visible in CV,
          // it must not be categorized as a job-only field.
          try {
            await FieldDefinition.updateMany(
              {
                active: { $ne: false },
                category: "job",
                showInCv: true,
              },
              { $set: { category: "profile" } }
            );
          } catch (e) {
            console.warn(
              "[bootstrap] FieldDefinition.category self-heal (job->profile) failed:",
              e?.message || e
            );
          }

          const slugifyKey = (input) =>
            String(input || "")
              .trim()
              .toUpperCase()
              .replace(/\s+/g, "_")
              .replace(/[^A-Z0-9_]/g, "_")
              .replace(/_+/g, "_")
              .replace(/^_+|_+$/g, "");

          const allFields = await FieldDefinition.find({})
            .select({ _id: 1, key: 1 })
            .lean();

          for (const f of allFields) {
            const rawKey = String(f?.key || "");
            const nextKey = slugifyKey(rawKey);
            if (!nextKey) continue;
            if (nextKey === rawKey) continue;

            const existing = await FieldDefinition.findOne({ key: nextKey })
              .select({ _id: 1 })
              .lean();

            if (existing?._id) {
              await FieldDefinition.deleteOne({ _id: f._id });
              console.warn(
                `[bootstrap] Normalized-key collision: '${rawKey}' -> '${nextKey}'. Deleted duplicate ${String(
                  f._id
                )}.`
              );
            } else {
              await FieldDefinition.updateOne(
                { _id: f._id },
                { $set: { key: nextKey } }
              );
              console.warn(
                `[bootstrap] Normalized FieldDefinition key: '${rawKey}' -> '${nextKey}'.`
              );
            }
          }

          const dupKeys = await FieldDefinition.aggregate([
            { $group: { _id: "$key", ids: { $push: "$_id" }, count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } },
          ]);

          for (const d of dupKeys) {
            const key = String(d?._id || "").trim();
            if (!key) continue;

            const docs = await FieldDefinition.find({ key })
              .sort({ updatedAt: -1, createdAt: -1 })
              .select({ _id: 1 })
              .lean();

            const keepId = docs?.[0]?._id;
            if (!keepId) continue;

            const deactivateIds = docs
              .slice(1)
              .map((x) => x?._id)
              .filter(Boolean);

            if (deactivateIds.length > 0) {
              await FieldDefinition.deleteMany({ _id: { $in: deactivateIds } });
              console.warn(
                `[bootstrap] Duplicate FieldDefinition key detected: ${key}. Deleted ${deactivateIds.length} duplicates.`
              );
            }
          }

          try {
            await FieldDefinition.syncIndexes();
          } catch (e) {
            console.warn("[bootstrap] FieldDefinition syncIndexes failed:", e?.message || e);
          }
        } catch (e) {
          console.warn("[bootstrap] Default FieldDefinitions insert failed:", e?.message || e);
        }
      })();

      return true;
    })
    .catch((err) => {
      const delayMs = Math.min(30000, 1000 * Math.pow(2, Math.min(attempt, 5)));
      console.error(
        `MongoDB bağlantı hatası (attempt=${attempt}). ${err.message}. ${delayMs}ms sonra tekrar denenecek.`
      );
      setTimeout(() => connectWithRetry(attempt + 1), delayMs);
      return false;
    });
}

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend ${PORT} portunda çalışıyor`);
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`PORT kullanımda: ${PORT}. Başka bir process bu portu dinliyor.`);
    console.error("Çözüm: drivercv-backend içinde 'npm run dev:reset' çalıştır.");
    process.exit(1);
  }
  console.error("Server error:", err);
  process.exit(1);
});

connectWithRetry();

module.exports = app;
