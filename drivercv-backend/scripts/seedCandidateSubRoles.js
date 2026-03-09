// PATH: DriverAll-main/drivercv-backend/scripts/seedCandidateSubRoles.js
// ----------------------------------------------------------
// Candidate SubRoles Seed Script
// Sürücü alt rollerini (driver, courier, forklift, shuttle) oluşturur
// ----------------------------------------------------------

require("dotenv").config();
const mongoose = require("mongoose");
const Role = require("../models/Role");

async function seedCandidateSubRoles() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/driverall");
    console.log("✅ MongoDB bağlantısı başarılı");

    // Candidate subRoles tanımları
    const subRoles = [
      {
        name: "driver",
        displayName: "Sürücü",
        description: "Profesyonel sürücü",
        category: "candidate",
        level: 1,
        isActive: true,
        icon: "🚗",
        color: "#3b82f6",
        sortOrder: 1,
      },
      {
        name: "courier",
        displayName: "Kurye",
        description: "Kurye hizmeti",
        category: "candidate",
        level: 1,
        isActive: true,
        icon: "📦",
        color: "#10b981",
        sortOrder: 2,
      },
      {
        name: "forklift",
        displayName: "Forklift Operatörü",
        description: "İş makinası operatörü",
        category: "candidate",
        level: 1,
        isActive: true,
        icon: "🏗️",
        color: "#f59e0b",
        sortOrder: 3,
      },
      {
        name: "shuttle",
        displayName: "Servis Şoförü",
        description: "Servis ve personel taşıma",
        category: "candidate",
        level: 1,
        isActive: true,
        icon: "🚌",
        color: "#8b5cf6",
        sortOrder: 4,
      },
    ];

    // Mevcut candidate subRoles'leri sil
    await Role.deleteMany({ category: "candidate", level: { $gt: 0 } });
    console.log("🗑️  Mevcut candidate subRoles temizlendi");

    // Yeni subRoles'leri ekle
    const created = await Role.insertMany(subRoles);
    console.log(`✅ ${created.length} candidate subRole oluşturuldu`);

    // Oluşturulan rolleri listele
    console.log("\n📋 Oluşturulan Candidate SubRoles:");
    created.forEach(role => {
      console.log(`  ${role.icon} ${role.displayName} (${role.name})`);
    });

    console.log("\n✅ Seed işlemi tamamlandı");

  } catch (error) {
    console.error("❌ Hata:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB bağlantısı kapatıldı");
  }
}

// Script'i çalıştır
if (require.main === module) {
  seedCandidateSubRoles();
}

module.exports = seedCandidateSubRoles;
