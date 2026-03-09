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

    // Mevcut rolleri kontrol et ve sadece eksik olanları ekle
    const created = [];
    for (const subRole of subRoles) {
      const existing = await Role.findOne({ name: subRole.name });
      if (!existing) {
        const newRole = await Role.create(subRole);
        created.push(newRole);
        console.log(`✅ Eklendi: ${subRole.icon} ${subRole.displayName} (${subRole.name})`);
      } else {
        console.log(`⏭️  Zaten var: ${subRole.displayName} (${subRole.name})`);
      }
    }
    
    console.log(`\n✅ ${created.length} yeni candidate subRole oluşturuldu`);

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
