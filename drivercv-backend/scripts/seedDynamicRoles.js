// PATH: DriverAll-main/drivercv-backend/scripts/seedDynamicRoles.js
// ----------------------------------------------------------
// Dinamik Rol Sistemi Başlangıç Verileri
// - Hiyerarşik rol yapısı
// - Kriter ve yetki tanımlamaları
// ----------------------------------------------------------

require("dotenv").config();
const mongoose = require("mongoose");
const Role = require("../models/Role");

async function seedRoles() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/driverall");
    console.log("MongoDB bağlantısı başarılı");

    // Mevcut rolleri temizle (sistem rolleri hariç)
    await Role.deleteMany({ isSystem: { $ne: true } });
    console.log("Mevcut roller temizlendi");

    // Ana roller oluştur
    const candidateRole = await Role.create({
      name: "candidate",
      displayName: "Aday",
      description: "Sürücü adayı rolü - alt kullanıcı açamaz",
      category: "candidate",
      level: 0,
      isSystem: true,
      icon: "👤",
      color: "#8b5cf6",
      sortOrder: 1,
      criteria: [
        {
          key: "motivation",
          label: "Motivasyon Nedeni",
          type: "textarea",
          required: true,
          order: 1
        },
        {
          key: "availability",
          label: "İşe Başlama Tarihi",
          type: "date",
          required: true,
          order: 2
        }
      ],
      profileFields: [
        {
          key: "fullName",
          label: "Ad Soyad",
          type: "text",
          required: true,
          section: "personal",
          order: 1
        },
        {
          key: "phone",
          label: "Telefon",
          type: "phone",
          required: true,
          section: "contact",
          order: 2
        },
        {
          key: "about",
          label: "Hakkında",
          type: "textarea",
          required: false,
          section: "personal",
          order: 3
        }
      ],
      permissions: [
        {
          module: "profile",
          actions: [
            { action: "read", allowed: true },
            { action: "update", allowed: true }
          ]
        },
        {
          module: "jobs",
          actions: [
            { action: "read", allowed: true },
            { action: "create", allowed: true, conditions: { ownOnly: true } }
          ]
        }
      ]
    });

    const businessRole = await Role.create({
      name: "business",
      displayName: "İşletme Temsilcisi",
      description: "İşletme temsilcisi - şube ve alt kullanıcı oluşturabilir",
      category: "business",
      level: 0,
      isSystem: true,
      icon: "🏢",
      color: "#10b981",
      sortOrder: 2,
      criteria: [
        {
          key: "companyName",
          label: "Şirket Adı",
          type: "text",
          required: true,
          order: 1
        },
        {
          key: "taxNumber",
          label: "Vergi Numarası",
          type: "text",
          required: true,
          order: 2
        },
        {
          key: "businessType",
          label: "İşletme Tipi",
          type: "select",
          required: true,
          validation: {
            options: ["Nakliyat", "Lojistik", "Eğitim", "Psikoteknik", "Diğer"]
          },
          order: 3
        }
      ],
      profileFields: [
        {
          key: "companyName",
          label: "Şirket Adı",
          type: "text",
          required: true,
          section: "business",
          order: 1
        },
        {
          key: "taxNumber",
          label: "Vergi Numarası",
          type: "text",
          required: true,
          section: "business",
          order: 2
        },
        {
          key: "phone",
          label: "Telefon",
          type: "phone",
          required: true,
          section: "contact",
          order: 3
        },
        {
          key: "website",
          label: "Web Sitesi",
          type: "text",
          required: false,
          section: "business",
          order: 4
        }
      ],
      permissions: [
        {
          module: "profile",
          actions: [
            { action: "read", allowed: true },
            { action: "update", allowed: true }
          ]
        },
        {
          module: "branches",
          actions: [
            { action: "create", allowed: true },
            { action: "read", allowed: true },
            { action: "update", allowed: true, conditions: { ownOnly: true } },
            { action: "delete", allowed: true, conditions: { ownOnly: true } }
          ]
        },
        {
          module: "subusers",
          actions: [
            { action: "create", allowed: true },
            { action: "read", allowed: true },
            { action: "update", allowed: true, conditions: { ownOnly: true } },
            { action: "delete", allowed: true, conditions: { ownOnly: true } }
          ]
        },
        {
          module: "jobs",
          actions: [
            { action: "read", allowed: true },
            { action: "create", allowed: true },
            { action: "update", allowed: true, conditions: { ownOnly: true } },
            { action: "delete", allowed: true, conditions: { ownOnly: true } }
          ]
        },
        {
          module: "ads",
          actions: [
            { action: "read", allowed: true },
            { action: "create", allowed: true },
            { action: "update", allowed: true, conditions: { ownOnly: true } },
            { action: "delete", allowed: true, conditions: { ownOnly: true } }
          ]
        }
      ]
    });

    const adminRole = await Role.create({
      name: "admin",
      displayName: "Admin",
      description: "Sistem yöneticisi - tüm yetkilere sahip",
      category: "admin",
      level: 0,
      isSystem: true,
      icon: "👨‍💼",
      color: "#ef4444",
      sortOrder: 3,
      criteria: [
        {
          key: "adminLevel",
          label: "Admin Seviyesi",
          type: "select",
          required: true,
          validation: {
            options: ["Super", "Senior", "Junior"]
          },
          order: 1
        }
      ],
      profileFields: [
        {
          key: "adminLevel",
          label: "Admin Seviyesi",
          type: "select",
          required: true,
          validation: {
            options: ["Super", "Senior", "Junior"]
          },
          section: "admin",
          order: 1
        }
      ],
      permissions: [
        {
          module: "all",
          actions: [
            { action: "create", allowed: true },
            { action: "read", allowed: true },
            { action: "update", allowed: true },
            { action: "delete", allowed: true }
          ]
        },
        {
          module: "branches",
          actions: [
            { action: "approve", allowed: true },
            { action: "reject", allowed: true },
            { action: "activate", allowed: true },
            { action: "deactivate", allowed: true }
          ]
        },
        {
          module: "subusers",
          actions: [
            { action: "approve", allowed: true },
            { action: "reject", allowed: true },
            { action: "activate", allowed: true },
            { action: "deactivate", allowed: true }
          ]
        }
      ]
    });

    console.log("✅ Dinamik rol sistemi başarıyla oluşturuldu");
    console.log(`📊 Toplam rol sayısı: ${await Role.countDocuments()}`);
    
    // Rol ağacını göster
    const roleTree = await Role.getRoleTree();
    console.log("\n🌳 Rol Hiyerarşisi:");
    roleTree.forEach(role => {
      console.log(`├── ${role.icon} ${role.displayName} (${role.name})`);
      console.log(`│   └── 📋 ${role.description}`);
    });

  } catch (error) {
    console.error("❌ Rol oluşturma hatası:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB bağlantısı kapatıldı");
  }
}

// Script'i çalıştır
if (require.main === module) {
  seedRoles();
}

module.exports = seedRoles;
