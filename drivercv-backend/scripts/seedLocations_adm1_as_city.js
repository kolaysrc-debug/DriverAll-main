// PATH: DriverAll-main/drivercv-backend/scripts/seedLocations_adm1_as_city.js

require("dotenv").config();
const mongoose = require("mongoose");

const Location = require("../models/Location");

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function seedCountryADM1asCity(country) {
  const username = process.env.GEONAMES_USERNAME;
  if (!username) throw new Error("GEONAMES_USERNAME missing");

  const url =
    `https://secure.geonames.org/searchJSON?country=${country}` +
    `&featureCode=ADM1&maxRows=1000&username=${encodeURIComponent(username)}`;

  const data = await fetchJson(url);
  const items = Array.isArray(data.geonames) ? data.geonames : [];

  // ADM1 -> biz MVP’de "city" gibi yazacağız
  let upserts = 0;
  for (const g of items) {
    const code = String(g.adminCode1 || "").trim();
    const name = String(g.name || g.toponymName || "").trim();
    const geonameId = Number(g.geonameId || 0) || null;
    if (!code || !name) continue;

    await Location.updateOne(
      { country, level: "city", code },
      {
        $set: {
          country,
          level: "city",
          code,
          name,
          parentCode: null,
          active: true,
          sortOrder: 0,
          source: "geonames",
          geonameId,
        },
      },
      { upsert: true }
    );

    upserts++;
  }

  return { country, fetched: items.length, upserts };
}

async function main() {
  const countries = process.argv.slice(2).map((x) => String(x).toUpperCase());
  if (!countries.length) throw new Error("Usage: node scripts/seedLocations_adm1_as_city.js TR DE ...");

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("MongoDB connected:", mongoose.connection.name);

  for (const c of countries) {
    const r = await seedCountryADM1asCity(c);
    console.log("[OK]", r);
  }

  const total = await Location.countDocuments({});
  console.log("locations total =", total);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
