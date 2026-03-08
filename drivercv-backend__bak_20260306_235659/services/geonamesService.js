// PATH: DriverAll-main/drivercv-backend/services/geonamesService.js
// ----------------------------------------------------------
// GeoNames.org API Service - Türkiye lokasyon verileri için
// ----------------------------------------------------------

const axios = require("axios");

class GeoNamesService {
  constructor() {
    this.baseURL = "http://api.geonames.org";
    this.username = process.env.GEONAMES_USERNAME || "driverall";
    this.cache = new Map(); // Basit memory cache
    this.cacheTimeout = 5 * 60 * 1000; // 5 dakika
  }

  getCacheKey(method, params = {}) {
    return `${method}:${JSON.stringify(params)}`;
  }

  get(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.cacheTimeout) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async makeRequest(endpoint, params = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const requestParams = {
      ...params,
      username: this.username,
      type: "JSON"
    };

    try {
      const response = await axios.get(url, { params: requestParams });
      return response.data;
    } catch (error) {
      console.error(`GeoNames API error for ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Ülkeleri getir
  async getCountries() {
    const cacheKey = this.getCacheKey("getCountries");
    const cached = this.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.makeRequest("/countryInfoJSON");
      const countries = Array.isArray(data.geonames) ? data.geonames : [];
      
      const result = countries.map(country => ({
        code: country.isoAlpha2 || country.countryCode,
        name: country.countryName,
        nativeName: country.nativeName || country.countryName,
        active: true
      }));

      this.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("GeoNames countries error:", error.message);
      return [];
    }
  }

  // İller/eyaletleri getir
  async getStates(countryCode = "TR") {
    const cacheKey = this.getCacheKey("getStates", { countryCode });
    const cached = this.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.makeRequest("/childrenJSON", {
        geonameId: countryCode === "TR" ? "298795" : countryCode
      });
      
      const states = Array.isArray(data.geonames) ? data.geonames : [];
      
      const result = states.map(state => ({
        code: `${countryCode}-${state.geonameId}`,
        name: state.name,
        asciiName: state.asciiName || state.name,
        country: countryCode,
        active: true
      }));

      this.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("GeoNames states error:", error.message);
      return [];
    }
  }

  // İlçeleri getir
  async getDistricts(countryCode = "TR", stateCode = null) {
    if (!stateCode) return [];

    const cacheKey = this.getCacheKey("getDistricts", { countryCode, stateCode });
    const cached = this.get(cacheKey);
    if (cached) return cached;

    try {
      // stateCode'dan geonameId çıkar (TR-298795 -> 298795)
      const geonameId = stateCode.split("-")[1];
      if (!geonameId) return [];

      const data = await this.makeRequest("/childrenJSON", {
        geonameId: geonameId,
        featureCode: "ADM2" // İlçeler için
      });
      
      const districts = Array.isArray(data.geonames) ? data.geonames : [];
      
      const result = districts.map(district => ({
        code: `${stateCode}-${district.geonameId}`,
        name: district.name,
        asciiName: district.asciiName || district.name,
        stateCode: stateCode,
        stateName: district.adminName1 || "",
        country: countryCode,
        active: true
      }));

      this.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("GeoNames districts error:", error.message);
      return [];
    }
  }

  // Şehirleri getir (genel arama için)
  async getCities(countryCode = "TR", stateCode = null, query = "") {
    const cacheKey = this.getCacheKey("getCities", { countryCode, stateCode, query });
    const cached = this.get(cacheKey);
    if (cached) return cached;

    try {
      const params = {
        country: countryCode,
        featureClass: "P", // Populated places
        maxRows: 100
      };

      if (stateCode) {
        // stateCode'dan geonameId çıkar
        const geonameId = stateCode.split("-")[1];
        if (geonameId) {
          params.adminCode1 = geonameId;
        }
      }

      if (query) {
        params.name_startsWith = query;
      }

      const data = await this.makeRequest("/searchJSON", params);
      const cities = Array.isArray(data.geonames) ? data.geonames : [];
      
      const result = cities.map(city => ({
        code: `${countryCode}-${city.geonameId}`,
        name: city.name,
        asciiName: city.asciiName || city.name,
        stateCode: stateCode || `${countryCode}-${city.adminCode1}`,
        stateName: city.adminName1 || "",
        country: countryCode,
        active: true
      }));

      this.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("GeoNames cities error:", error.message);
      return [];
    }
  }

  // Lokasyon arama
  async searchLocations(query = "", countryCode = "TR") {
    if (!query.trim()) return [];

    const cacheKey = this.getCacheKey("searchLocations", { query, countryCode });
    const cached = this.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.makeRequest("/searchJSON", {
        name_startsWith: query,
        country: countryCode,
        featureClass: "P",
        maxRows: 50
      });
      
      const locations = Array.isArray(data.geonames) ? data.geonames : [];
      
      const result = locations.map(location => ({
        code: `${countryCode}-${location.geonameId}`,
        name: location.name,
        asciiName: location.asciiName || location.name,
        stateCode: location.adminCode1 ? `${countryCode}-${location.adminCode1}` : "",
        stateName: location.adminName1 || "",
        country: countryCode,
        active: true
      }));

      this.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("GeoNames search error:", error.message);
      return [];
    }
  }
}

module.exports = new GeoNamesService();
