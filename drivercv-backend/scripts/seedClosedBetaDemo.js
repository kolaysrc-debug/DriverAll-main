const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../models/User");
const Branch = require("../models/Branch");
const Job = require("../models/Job");
const Package = require("../models/Package");
const geonamesService = require("../services/geonamesService");

function env(name, fallback = "") {
  return String(process.env[name] || fallback);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function uniqCode(prefix, idx) {
  const n = String(idx + 1).padStart(2, "0");
  return `${prefix}_${n}_${Date.now().toString().slice(-6)}`.toUpperCase();
}

function trNorm(input) {
  return String(input || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i");
}

function buildDemoCriteria(i) {
  const sets = [
    { EHL_C: true, EHL_CE: true, SRC3_TR: true, SRC4_TR: true, PSIKO_TR: true },
    { EHL_D: true, SRC1_TR: true, SRC2_TR: true, PSIKO_TR: true },
    { EHL_B: true, SRC4_TR: true, ODY_TR: true, PSIKO_TR: true },
    { EHL_C: true, SRC4_TR: true, U2_TR: true, PSIKO_TR: true },
    { EHL_B: true },
  ];

  const base = sets[i % sets.length];
  return { ...base, DEMO: true };
}

async function upsertEmployer({ email, password, name, phone }) {
  const em = String(email).toLowerCase().trim();
  const ph = String(phone).trim().replace(/\s+/g, "");

  let user = await User.findOne({ email: em });
  if (user) return user;

  const passwordHash = await bcrypt.hash(password, 10);
  user = await User.create({
    name,
    email: em,
    phone: ph,
    passwordHash,
    role: "employer",
    isActive: true,
    isApproved: true,
    companyName: "Demo Lojistik",
    companyLegalName: "Demo Lojistik A.Ş.",
    companyPhone: ph,
    companyCountry: "TR",
    companyCityCode: "34",
    companyDistrictCode: "3401",
    companyAddressLine: "Demo Mah. Demo Cad. No:1",
  });

  return user;
}

async function ensureBranch(employerUserId) {
  const existing = await Branch.findOne({ parentUser: employerUserId }).sort({ createdAt: 1 });
  if (existing) return existing;

  const b = await Branch.create({
    parentUser: employerUserId,
    name: "Merkez Şube",
    code: `DEMO${Date.now().toString().slice(-6)}`,
    displayName: "Merkez Şube",
    description: "Demo şube",
    location: {
      countryCode: "TR",
      stateCode: "34",
      stateName: "İstanbul",
      districtCode: "3401",
      districtName: "Adalar",
      fullAddress: "Demo Mah. Demo Cad. No:1",
    },
    contact: {
      phone: "05000000000",
      email: "demo@driverall.com",
    },
    status: {
      isActive: true,
      isApproved: true,
      isMainBranch: true,
    },
    metadata: {
      source: "business",
    },
  });

  return b;
}

async function seedPackages({ count }) {
  const existingCount = await Package.countDocuments({ deletedAt: null });
  if (existingCount >= count) {
    console.log(`Packages already seeded (existing=${existingCount}).`);
    return;
  }

  const tiers = [
    { baseName: "JOB START", price: 0, jobPostCount: 1, listingDays: 7, homeDays: 0 },
    { baseName: "JOB BASIC", price: 490, jobPostCount: 3, listingDays: 14, homeDays: 1 },
    { baseName: "JOB PLUS", price: 990, jobPostCount: 7, listingDays: 21, homeDays: 3 },
    { baseName: "JOB PRO", price: 1990, jobPostCount: 15, listingDays: 30, homeDays: 7 },
    { baseName: "JOB ULTRA", price: 3990, jobPostCount: 30, listingDays: 45, homeDays: 14 },
  ];

  const toCreate = [];
  for (let i = 0; i < count; i++) {
    const t = pick(tiers);
    const code = uniqCode(`JOB_${t.baseName.replace(/\s+/g, "_")}_TR`, i);
    toCreate.push({
      type: "JOB",
      name: `${t.baseName} #${i + 1}`,
      code,
      description: "Kapalı beta demo paketi",
      country: "TR",
      currency: "TRY",
      price: Number(t.price),
      credits: {
        jobCount: 0,
        adCount: 0,
        jobPostCount: Number(t.jobPostCount),
        cvViewCount: 0,
        cvSaveCount: 0,
      },
      rules: {
        allowedPlacements: [],
        maxDurationDaysByPlacement: {},
        requiresApproval: true,
        listingDays: Number(t.listingDays),
        homeDays: Number(t.homeDays),
      },
      active: true,
      deletedAt: null,
    });
  }

  await Package.insertMany(toCreate, { ordered: false });
  console.log(`Seeded packages: ${toCreate.length}`);
}

async function seedPublishedJobs({ employer, branch, count }) {
  const resetJobs = String(process.env.RESET_DEMO_JOBS || "").trim().toLowerCase() === "true";
  if (resetJobs) {
    const del = await Job.deleteMany({ employerUserId: employer._id });
    console.log(`RESET_DEMO_JOBS=true -> deleted employer jobs: ${del.deletedCount || 0}`);
  } else {
    const existing = await Job.countDocuments({ employerUserId: employer._id });
    if (existing >= count) {
      console.log(`Jobs already seeded for employer (existing=${existing}).`);
      return;
    }
  }

  const titles = [
    "Uluslararası TIR Şoförü",
    "Şehirlerarası Kamyon Şoförü",
    "Dağıtım Şoförü",
    "Forklift Operatörü",
    "Servis Şoförü",
    "Kurye",
    "Otobüs Kaptanı",
    "Minibüs Şoförü",
  ];

  // TR için il kodları: locations API Geonames'den TR-xxxx formatında geliyor.
  // Seed data da aynı kodları kullanmalı ki UI'da seçilen filtre ile eşleşsin.
  const desiredCities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Adana"];
  let states = [];
  try {
    states = await geonamesService.getStates("TR");
  } catch {
    states = [];
  }

  const stateByName = new Map();
  for (const s of states || []) {
    const name = String(s?.name || "").trim();
    const code = String(s?.code || "").trim();
    if (!name || !code) continue;
    stateByName.set(trNorm(name), { name, code });
  }

  const cityPool = desiredCities
    .map((name) => {
      const hit = stateByName.get(trNorm(name));
      return hit ? hit : null;
    })
    .filter(Boolean);

  const created = [];
  for (let i = 0; i < count; i++) {
    const title = pick(titles);
    const city = cityPool.length ? pick(cityPool) : { name: "İstanbul", code: "34" };

    let districtCode = "";
    let districtName = "";
    try {
      const d = await geonamesService.getDistricts("TR", String(city.code || ""));
      if (Array.isArray(d) && d.length > 0) {
        const picked = pick(d);
        districtCode = String(picked?.code || "").trim();
        districtName = String(picked?.name || "").trim();
      }
    } catch {
      // no-op
    }

    const locLabel = districtName ? `${city.name} / ${districtName}` : String(city.name || "Türkiye");
    created.push({
      employerUserId: employer._id,
      branchId: branch._id,
      branchSnapshot: {
        _id: branch._id,
        code: String(branch.code || ""),
        displayName: String(branch.displayName || branch.name || ""),
        locationLabel: locLabel,
      },
      country: "TR",
      location: {
        countryCode: "TR",
        cityCode: String(city.code || "").trim(),
        districtCode: districtCode,
        label: locLabel,
      },
      title: `${title} (${i + 1})`,
      description: "Kapalı beta demo ilanı",
      criteria: buildDemoCriteria(i),
      status: "published",
      revision: 0,
      approvedRevision: 0,
      submittedAt: new Date(),
      approvedAt: new Date(),
      approvedBy: null,
      publishedAt: new Date(),
      placementKey: "",
      packageId: null,
      packageOrderId: null,
      packageName: "",
      startAt: null,
      endAt: null,
    });
  }

  await Job.insertMany(created, { ordered: false });
  console.log(`Seeded published jobs: ${created.length}`);
}

async function main() {
  const mongo = env("MONGO_URI", "mongodb://127.0.0.1:27017/driverall");
  const packagesCount = Number(env("DEMO_PACKAGES", "50")) || 50;
  const jobsCount = Number(env("DEMO_JOBS", "18")) || 18;

  const employerEmail = env("DEMO_EMPLOYER_EMAIL", "employer-demo@driverall.com");
  const employerPassword = env("DEMO_EMPLOYER_PASSWORD", "demo12345");
  const employerPhone = env("DEMO_EMPLOYER_PHONE", "05000000000");

  await mongoose.connect(mongo);
  console.log("Mongo connected:", mongo);

  await seedPackages({ count: packagesCount });

  const employer = await upsertEmployer({
    email: employerEmail,
    password: employerPassword,
    name: "Demo Employer",
    phone: employerPhone,
  });

  const branch = await ensureBranch(employer._id);
  await seedPublishedJobs({ employer, branch, count: jobsCount });

  console.log("\nDemo employer:");
  console.log("EMAIL:", employerEmail);
  console.log("PASSWORD:", employerPassword);
  console.log("PHONE:", employerPhone);

  await mongoose.connection.close();
}

main().catch((err) => {
  console.error("seedClosedBetaDemo failed:", err);
  process.exitCode = 1;
});
