// PATH: DriverAll-main/drivercv-backend/routes/locations.js
// ----------------------------------------------------------
// Locations API
// GET /api/locations/list?country=TR&level=city&parentCode=TR-34&q=Kad
//
// Notlar:
// - TR için UI’de "city" çoğu zaman "il/province" demek oluyor.
//   Bu yüzden TR + level=city -> state olarak normalize ediyorum.
// - district (ilçe) için: level=district&parentCode=TR-34
// ----------------------------------------------------------

const express = require("express");
const router = express.Router();

const Location = require("../models/Location");
const geonamesService = require("../services/geonamesService");

function normalizeCountry(v) {
  return String(v || "TR").trim().toUpperCase();
}

function normalizeLevel(country, v) {
  let level = String(v || "city").trim().toLowerCase();

  // aliaslar
  if (level === "province" || level === "il") level = "state";
  if (level === "county" || level === "ilce" || level === "ilçe") level = "district";

  // TR'de "city" UI'da çoğunlukla "il" demek
  if (country === "TR" && level === "city") level = "state";

  // güvenlik
  if (!["country", "state", "city", "district"].includes(level)) level = "state";
  return level;
}

// ----------------------------------------------------------
// GET /api/locations/list
// ----------------------------------------------------------
router.get("/list", async (req, res) => {
  try {
    const country = normalizeCountry(req.query.country);
    const level = normalizeLevel(country, req.query.level);

    const parentCodeRaw = req.query.parentCode;
    const parentCode = parentCodeRaw ? String(parentCodeRaw).trim() : null;

    const qRaw = req.query.q;
    const q = qRaw ? String(qRaw).trim() : "";

    console.log(`Location request: country=${country}, level=${level}, parentCode=${parentCode}, q=${q}`);

    // Direkt GeoNames'den veri çek, hiç kaydetme
    try {
      let result = [];

      switch (level) {
        case "country":
          result = await geonamesService.getCountries();
          break;
        
        case "state":
          result = await geonamesService.getStates(country);
          break;
        
        case "district":
          const stateCode = parentCode || null;
          result = await geonamesService.getDistricts(country, stateCode);
          break;
        
        case "city":
          const cityStateCode = parentCode || null;
          result = await geonamesService.getCities(country, cityStateCode, q);
          break;
        
        default:
          if (q) {
            result = await geonamesService.searchLocations(q, country);
          } else {
            result = await geonamesService.getStates(country);
          }
          break;
      }

      return res.json({
        success: true,
        list: result,
        count: result.length,
        fromCache: false,
        source: "geonames"
      });

    } catch (geonamesError) {
      console.error("GeoNames error:", geonamesError.message);
      
      // GeoNames hata verirse, boş array dön
      return res.json({
        success: true,
        list: [],
        count: 0,
        fromCache: false,
        source: "none",
        error: geonamesError.message
      });
    }
  } catch (err) {
    console.error("locations list failed:", err);
    return res.status(500).json({
      success: false,
      message: "locations list failed",
      error: err?.message || String(err),
    });
  }
});

module.exports = router;
