// PATH: DriverAll-main/drivercv-backend/scripts/seedLocations_geonames.js
// ----------------------------------------------------------
// GeoNames seed (cities500/cities15000 üzerinden)
// Kullanım:
//   node scripts/seedLocations_geonames.js TR
//   node scripts/seedLocations_geonames.js TR DE NL FI NO ES IT HU
//
// Gerekli ENV:
//   MONGO_URI=...
//   GEONAMES_USERNAME=...   (geonames.org hesabı username)
// ----------------------------------------------------------

require("dotenv").config();

const https = require("https");
const mongoose = require("mongoose");

const Location = require("../models/Location");

const MONGO_URI = process.env.MONGO_URI || "mongodb://mongodb:27017/driverall";
const USERNAME = process.env.GEONAMES_USERNAME;

if (!USERNAME) {
  console.error("GEONAMES_USERNAME yok. .env içine ekleyin.");
  process.exit(1);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("JSON parse failed"));
          }
        });
      })
      .on("error", reject);
  });
}

function code(country, admin1, name) {
  // stable code: TR-34-ISTANBUL gibi
  const safe = String(name || "")
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/Ş/g, "S")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  const a = admin1 ? String(admin1).toUpperCase() : "NA";
  return `${country}-${a}-${safe}`;
}

async function seedCountry(country) {
  const cc = String(country).toUpperCase();

  // 1) Admin1 (state/region) listesi
  // GeoNames admin divisions:
  // http://api.geonames.org/searchJSON?country=TR&featureCode=ADM1&maxRows=1000&username=...
  const adm1Url = `https://secure.geonames.org/searchJSON?country=${cc}&featureCode=ADM1&maxRows=1000&username=${USERNAME}`;
  const adm1 = await fetchJson(adm1Url);
  const states = (adm1.geonames || []).map((x) => ({
    country: cc,
    level: "state",
    code: `${cc}-${x.adminCode1}`,
    parentCode: null,
    name: x.name,
    sortOrder: 0,
    active: true,
  }));

  // upsert states
  for (const s of states) {
    await Location.updateOne(
      { country: s.country, level: s.level, code: s.code },
      { $set: s },
      { upsert: true }
    );
  }

  // 2) Cities: cities15000 (daha az, hızlı) -> sonra isterseniz cities500’e geçeriz
  // http://api.geonames.org/searchJSON?country=TR&featureClass=P&maxRows=1000&startRow=0&username=...
  // featureClass=P => populated place
  let startRow = 0;
  const pageSize = 1000;

  while (true) {
    const url = `https://secure.geonames.org/searchJSON?country=${cc}&featureClass=P&maxRows=${pageSize}&startRow=${startRow}&username=${USERNAME}`;
    const j = await fetchJson(url);
    const items = j.geonames || [];
    if (items.length === 0) break;

    for (const x of items) {
      // adminCode1 => state
      const parentCode = x.adminCode1 ? `${cc}-${x.adminCode1}` : null;
      const city = {
        country: cc,
        level: "city",
        code: code(cc, x.adminCode1, x.name),
        parentCode,
        name: x.name,
        sortOrder: 0,
        active: true,
      };

      await Location.updateOne(
        { country: city.country, level: city.level, code: city.code },
        { $set: city },
        { upsert: true }
      );
    }

    startRow += pageSize;
    // GeoNames rate limit için küçük nefes
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`[OK] Seed tamam: ${cc} (states + cities)`);
}

async function main() {
  const countries = process.argv.slice(2);
  if (!countries.length) {
    console.error("Kullanım: node scripts/seedLocations_geonames.js TR DE ...");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected.");

  for (const c of countries) {
    await seedCountry(c);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
