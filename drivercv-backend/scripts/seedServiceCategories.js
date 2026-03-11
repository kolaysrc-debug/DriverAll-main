// PATH: drivercv-backend/scripts/seedServiceCategories.js
// ----------------------------------------------------------
// Varsayılan hizmet kategorilerini oluşturur.
// node scripts/seedServiceCategories.js
// ----------------------------------------------------------

require("dotenv").config();
const mongoose = require("mongoose");
const ServiceCategory = require("../models/ServiceCategory");

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/driverall";

const defaults = [
  {
    key: "ehliyet_kursu",
    label: "Ehliyet Kursu",
    description: "B, C, CE, D, DE sınıfı ehliyet eğitimi",
    icon: "🚗",
    relatedGroupKeys: ["EHL_TR"],
    relatedCriteriaKeys: ["EHL_B", "EHL_C", "EHL_CE", "EHL_D", "EHL_DE", "EHL_D1", "EHL_A", "EHL_A1", "EHL_A2"],
    sortOrder: 1,
    country: "TR",
  },
  {
    key: "src_egitimi",
    label: "SRC Eğitimi",
    description: "SRC1-5 mesleki yeterlilik belge eğitimleri",
    icon: "📋",
    relatedGroupKeys: ["SRC_TR"],
    relatedCriteriaKeys: ["SRC1_TR", "SRC2_TR", "SRC3_TR", "SRC4_TR", "SRC5_TR"],
    sortOrder: 2,
    country: "TR",
  },
  {
    key: "adr_egitimi",
    label: "ADR Eğitimi",
    description: "ADR tehlikeli madde taşımacılığı belgesi",
    icon: "⚠️",
    relatedGroupKeys: [],
    relatedCriteriaKeys: ["HAS_ADR"],
    sortOrder: 3,
    country: "TR",
  },
  {
    key: "psikoteknik",
    label: "Psikoteknik",
    description: "Psikoteknik test merkezi",
    icon: "🧠",
    relatedGroupKeys: [],
    relatedCriteriaKeys: ["HAS_PSYCHOTECHNIC", "PSIKO_TR"],
    sortOrder: 4,
    country: "TR",
  },
  {
    key: "myk_belgelendirme",
    label: "MYK Belgelendirme",
    description: "MYK mesleki yeterlilik belgesi",
    icon: "🏅",
    relatedGroupKeys: [],
    relatedCriteriaKeys: ["HAS_MYK"],
    sortOrder: 5,
    country: "TR",
  },
  {
    key: "direksiyon_dersi",
    label: "Direksiyon Dersi",
    description: "Özel direksiyon dersi / pratik eğitim",
    icon: "🎯",
    relatedGroupKeys: ["EHL_TR"],
    relatedCriteriaKeys: [],
    sortOrder: 6,
    country: "TR",
  },
  {
    key: "ody_egitimi",
    label: "ODY Eğitimi",
    description: "Oda yeterlilik belgesi eğitimi",
    icon: "📑",
    relatedGroupKeys: ["SRC_TR"],
    relatedCriteriaKeys: ["ODY_TR"],
    sortOrder: 7,
    country: "TR",
  },
  {
    key: "u2_egitimi",
    label: "U2 Eğitimi",
    description: "U2 ticari taşıt kullanma belgesi",
    icon: "🚛",
    relatedGroupKeys: [],
    relatedCriteriaKeys: ["U2_TR"],
    sortOrder: 8,
    country: "TR",
  },
  {
    key: "diger",
    label: "Diğer",
    description: "Yukarıdaki kategorilere uymayan hizmetler",
    icon: "📦",
    relatedGroupKeys: [],
    relatedCriteriaKeys: [],
    sortOrder: 99,
    country: "ALL",
  },
];

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("[seedServiceCategories] Connected:", MONGO_URI);

  let created = 0;
  let updated = 0;

  for (const cat of defaults) {
    const existing = await ServiceCategory.findOne({ key: cat.key });
    if (existing) {
      // Sadece yeni alanları güncelle, mevcut olanları bozma
      existing.label = cat.label;
      existing.description = cat.description;
      existing.icon = cat.icon;
      existing.relatedGroupKeys = cat.relatedGroupKeys;
      existing.relatedCriteriaKeys = cat.relatedCriteriaKeys;
      existing.sortOrder = cat.sortOrder;
      existing.country = cat.country;
      await existing.save();
      updated++;
    } else {
      await ServiceCategory.create({ ...cat, active: true });
      created++;
    }
  }

  console.log(`[seedServiceCategories] Done. Created: ${created}, Updated: ${updated}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[seedServiceCategories] Error:", err);
  process.exit(1);
});
