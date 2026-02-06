/**
 * Seed Turkey districts (ADM2) from GeoNames.
 * Existing states must exist in DB with:
 *   country=TR, level=state, code like "TR-68"
 *
 * Run inside backend container:
 *   docker exec -e GEONAMES_USERNAME=driverall -it driverall-backend node scripts/seedLocations_geonames_adm2_TR.js TR
 */

const mongoose = require("mongoose");

function mustEnv(name) {
  const v = String(process.env[name] || "").trim();
  if (!v) throw new Error(`${name} yok. Komutu GEONAMES_USERNAME ile çalıştırın.`);
  return v;
}

function pickMongoUri() {
  return (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    "mongodb://driverall-mongo:27017/driverall"
  );
}

function loadLocationModel() {
  const candidates = [
    "../models/Location",
    "../models/location",
    "../models/Locations",
    "../models/locations",
  ];
  for (const p of candidates) {
    try {
      return require(p);
    } catch (_) {}
  }
  throw new Error("Location modeli bulunamadı. ../models/Location yok gibi.");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// TR-68 -> "68"
function adminCode1FromStateCode(stateCode) {
  const parts = String(stateCode || "").split("-");
  return parts.length >= 2 ? parts[1] : "";
}

async function geonamesSearch({ username, country, adminCode1, featureCode, startRow }) {
  const params = new URLSearchParams();
  params.set("username", username);
  params.set("type", "json");
  params.set("country", country);
  params.set("featureCode", featureCode);
  params.set("adminCode1", adminCode1);
  params.set("maxRows", "1000");
  params.set("startRow", String(startRow || 0));

  const url = `http://api.geonames.org/searchJSON?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GeoNames HTTP ${res.status}`);
  return res.json();
}

async function fetchAllAdm2ForState({ username, country, adminCode1 }) {
  let startRow = 0;
  const all = [];

  for (let i = 0; i < 50; i++) {
    const data = await geonamesSearch({
      username,
      country,
      adminCode1,
      featureCode: "ADM2",
      startRow,
    });

    const list = Array.isArray(data?.geonames) ? data.geonames : [];
    all.push(...list);

    if (list.length < 1000) break;
    startRow += 1000;

    await sleep(350);
  }

  return all;
}

async function main() {
  const country = String(process.argv[2] || "TR").toUpperCase();
  if (country !== "TR") {
    throw new Error("Bu script sadece TR için tasarlandı. TR ile çalıştırın.");
  }

  const username = mustEnv("GEONAMES_USERNAME");
  const mongoUri = pickMongoUri();
  const Location = loadLocationModel();

  console.log("[i] Mongo connecting:", mongoUri.replace(/\/\/.*@/, "//***@"));
  await mongoose.connect(mongoUri);
  console.log("[OK] Mongo connected.");

  const states = await Location.find({ country: "TR", level: "state", active: { $ne: false } })
    .sort({ code: 1 })
    .lean();

  if (!states.length) throw new Error("TR state kaydı bulunamadı. Önce state seed çalışmalı.");

  console.log(`[i] TR state count: ${states.length}`);

  let totalUpserts = 0;

  for (const st of states) {
    const stateCode = String(st.code || "").trim(); // TR-68
    const adminCode1 = adminCode1FromStateCode(stateCode); // 68
    if (!adminCode1) {
      console.log(`[skip] adminCode1 çıkarılamadı: ${stateCode}`);
      continue;
    }

    console.log(`\n[i] Fetch ADM2 for ${stateCode} (adminCode1=${adminCode1}) ...`);
    let raw;
    try {
      raw = await fetchAllAdm2ForState({ username, country: "TR", adminCode1 });
    } catch (e) {
      console.log(`[warn] ${stateCode} fetch failed: ${e.message}`);
      continue;
    }

    const adm2 = raw.filter((x) => String(x?.fcode || "").toUpperCase() === "ADM2");
    console.log(`[i] ${stateCode} ADM2 count: ${adm2.length}`);

    let upserts = 0;

    for (const g of adm2) {
      const geonameId = Number(g?.geonameId || 0) || null;
      const name = String(g?.name || g?.toponymName || "").trim();
      const adminCode2 = String(g?.adminCode2 || "").trim();

      const suffix = adminCode2 || String(geonameId || "").trim();
      if (!suffix || !name) continue;

      const code = `${stateCode}-${suffix}`; // TR-68-<adm2>

      await Location.updateOne(
        { country: "TR", level: "district", code },
        {
          $set: {
            country: "TR",
            level: "district",
            code,
            name,
            parentCode: stateCode, // TR-68
            active: true,
            source: "geonames",
            geonameId,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date(), sortOrder: 0 },
        },
        { upsert: true }
      );

      upserts++;
      totalUpserts++;

      if (upserts % 150 === 0) await sleep(200);
    }

    console.log(`[OK] ${stateCode} upserted districts: ${upserts}`);
    await sleep(350);
  }

  console.log(`\n[OK] Seed tamam: TR districts upserted = ${totalUpserts}`);
  await mongoose.disconnect();
  console.log("[OK] Done.");
}

main().catch((err) => {
  console.error("[FATAL]", err?.message || err);
  process.exit(1);
});
