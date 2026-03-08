// PATH: DriverAll-main/drivercv-backend/scripts/seedIndustries.js
// ----------------------------------------------------------
// Sektör Başlangıç Verileri
// - Temel sektörler
// - Sektöre özel alanlar
// - Şube yapıları
// ----------------------------------------------------------

require("dotenv").config();
const mongoose = require("mongoose");
const Industry = require("../models/Industry");

async function seedIndustries() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/driverall");
    console.log("MongoDB bağlantısı başarılı");

    // Mevcut sektörleri temizle (sistem sektörleri hariç)
    await Industry.deleteMany({ isSystem: { $ne: true } });
    console.log("Mevcut sektörler temizlendi");

    // Sektör verileri
    const industries = [
      {
        name: "Nakliye",
        displayName: "Nakliye Taşımacılığı",
        description: "Yük ve yolcu taşımacılığı hizmetleri",
        code: "TRANSPORT",
        category: "transport",
        icon: "🚚",
        color: "#3b82f6",
        customFields: [
          {
            key: "fleetSize",
            label: "Filo Büyüklüğü",
            type: "number",
            required: false,
            validation: { min: 1, max: 1000 },
            order: 1
          },
          {
            key: "transportType",
            label: "Taşıma Tipi",
            type: "multiselect",
            required: true,
            validation: {
              options: ["Karayolu", "Denizyolu", "Havayolu", "Demiryolu", "Kombine"]
            },
            order: 2
          },
          {
            key: "licensePlate",
            label: "Plaka Aralığı",
            type: "text",
            required: false,
            order: 3
          }
        ],
        branchStructure: {
          allowsMultipleBranches: true,
          requiresMainBranch: true,
          branchTypes: [
            {
              type: "headquarter",
              name: "Merkez",
              description: "Ana şirket merkezi",
              isRequired: true,
              maxCount: 1
            },
            {
              type: "branch",
              name: "Şube",
              description: "Taşıma şubesi",
              isRequired: false,
              maxCount: 50
            },
            {
              type: "depot",
              name: "Depo",
              description: "Yük depolama tesisi",
              isRequired: false,
              maxCount: 20
            }
          ]
        },
        requirements: {
          licenses: [
            {
              name: "K1 Yetki Belgesi",
              description: "Karayolu taşıma yetki belgesi",
              isRequired: true,
              expiryRequired: true
            },
            {
              name: "L1 Yetki Belgesi",
              description: "Uluslararası taşıma yetki belgesi",
              isRequired: false,
              expiryRequired: true
            }
          ],
          certifications: [],
          permits: [
            {
              name: "İşletme Ruhsatı",
              description: "Belediye işletme ruhsatı",
              isRequired: true,
              expiryRequired: true
            }
          ]
        },
        services: [
          { name: "Yük Taşımacılığı", description: "Malzeme taşıma hizmetleri", order: 1 },
          { name: "Yolcu Taşımacılığı", description: "Yolcu taşıma hizmetleri", order: 2 },
          { name: "Depolama", description: "Malzeme depolama hizmetleri", order: 3 },
          { name: "Lojistik Danışmanlık", description: "Lojistik danışmanlık hizmetleri", order: 4 }
        ],
        isSystem: true
      },
      {
        name: "Fabrika",
        displayName: "Fabrika ve İmalat",
        description: "Üretim ve imalat faaliyetleri",
        code: "MANUFACTURING",
        category: "manufacturing",
        icon: "🏭",
        color: "#f59e0b",
        customFields: [
          {
            key: "productionType",
            label: "Üretim Tipi",
            type: "select",
            required: true,
            validation: {
              options: ["Büyük Seri", "Küçük Seri", "Siparişe Özel", "Prototip"]
            },
            order: 1
          },
          {
            key: "employeeCount",
            label: "Çalışan Sayısı",
            type: "number",
            required: true,
            validation: { min: 1, max: 10000 },
            order: 2
          },
          {
            key: "productionCapacity",
            label: "Üretim Kapasitesi",
            type: "text",
            required: false,
            order: 3
          }
        ],
        branchStructure: {
          allowsMultipleBranches: true,
          requiresMainBranch: true,
          branchTypes: [
            {
              type: "headquarter",
              name: "Merkez Fabrika",
              description: "Ana üretim tesisi",
              isRequired: true,
              maxCount: 1
            },
            {
              type: "branch",
              name: "Şube Fabrika",
              description: "Diğer üretim tesisleri",
              isRequired: false,
              maxCount: 10
            },
            {
              type: "office",
              name: "Satış Ofisi",
              description: "Satış ve pazarlama ofisi",
              isRequired: false,
              maxCount: 20
            }
          ]
        },
        requirements: {
          licenses: [
            {
              name: "İmalat Ruhsatı",
              description: "Sanayi imalat ruhsatı",
              isRequired: true,
              expiryRequired: true
            }
          ],
          certifications: [
            {
              name: "ISO 9001",
              description: "Kalite yönetim sistemi",
              isRequired: false,
              expiryRequired: true
            },
            {
              name: "ISO 14001",
              description: "Çevre yönetim sistemi",
              isRequired: false,
              expiryRequired: true
            }
          ],
          permits: [
            {
              name: "Çevre İzni",
              description: "Çevre düzenleme izni",
              isRequired: true,
              expiryRequired: true
            }
          ]
        },
        services: [
          { name: "Üretim", description: "Ana üretim faaliyetleri", order: 1 },
          { name: "Montaj", description: "Ürün montaj hizmetleri", order: 2 },
          { name: "Kalite Kontrol", description: "Ürün kalite kontrol", order: 3 },
          { name: "Ar-Ge", description: "Ar-ge faaliyetleri", order: 4 }
        ],
        isSystem: true
      },
      {
        name: "Depolama",
        displayName: "Depolama ve Lojistik",
        description: "Depolama ve lojistik hizmetleri",
        code: "STORAGE",
        category: "storage",
        icon: "📦",
        color: "#10b981",
        customFields: [
          {
            key: "storageType",
            label: "Depolama Tipi",
            type: "multiselect",
            required: true,
            validation: {
              options: ["Açık Alan", "Kapalı Alan", "Soğuk Hava Deposu", "Tehlikeli Madde", "Gıda Deposu"]
            },
            order: 1
          },
          {
            key: "storageCapacity",
            label: "Depolama Kapasitesi (m²)",
            type: "number",
            required: true,
            validation: { min: 100, max: 100000 },
            order: 2
          },
          {
            key: "forkliftCount",
            label: "Forklift Sayısı",
            type: "number",
            required: false,
            validation: { min: 0, max: 100 },
            order: 3
          }
        ],
        branchStructure: {
          allowsMultipleBranches: true,
          requiresMainBranch: true,
          branchTypes: [
            {
              type: "headquarter",
              name: "Merkez Depo",
              description: "Ana depolama tesisi",
              isRequired: true,
              maxCount: 1
            },
            {
              type: "branch",
              name: "Şube Depo",
              description: "Diğer depolama tesisleri",
              isRequired: false,
              maxCount: 50
            },
            {
              type: "office",
              name: "Ofis",
              description: "Yönetim ofisi",
              isRequired: false,
              maxCount: 10
            }
          ]
        },
        requirements: {
          licenses: [
            {
              name: "Depolama Ruhsatı",
              description: "Depolama faaliyet ruhsatı",
              isRequired: true,
              expiryRequired: true
            }
          ],
          certifications: [
            {
              name: "ISO 45001",
              description: "İş sağlığı ve güvenliği",
              isRequired: false,
              expiryRequired: true
            }
          ],
          permits: [
            {
              name: "Yangın Önleme",
              description: "Yangın önleme izni",
              isRequired: true,
              expiryRequired: true
            }
          ]
        },
        services: [
          { name: "Depolama", description: "Malzeme depolama", order: 1 },
          { name: "Dağıtım", description: "Malzeme dağıtım", order: 2 },
          { name: "Stok Yönetimi", description: "Stok takip ve yönetimi", order: 3 },
          { name: "Cross-Docking", description: "Cross-docking hizmetleri", order: 4 }
        ],
        isSystem: true
      },
      {
        name: "Eğitim",
        displayName: "Eğitim Kurumları",
        description: "Sürücü ve personel eğitimi",
        code: "EDUCATION",
        category: "education",
        icon: "🎓",
        color: "#8b5cf6",
        customFields: [
          {
            key: "educationType",
            label: "Eğitim Tipi",
            type: "multiselect",
            required: true,
            validation: {
              options: ["SRC Eğitimi", "Psikoteknik", "İleri Sürüş", "Ehliyet Kursu", "Mesleki Eğitim"]
            },
            order: 1
          },
          {
            key: "capacity",
            label: "Kapasite (Kişi/Ay)",
            type: "number",
            required: true,
            validation: { min: 10, max: 1000 },
            order: 2
          },
          {
            key: "instructorCount",
            label: "Eğitmen Sayısı",
            type: "number",
            required: true,
            validation: { min: 1, max: 100 },
            order: 3
          }
        ],
        branchStructure: {
          allowsMultipleBranches: true,
          requiresMainBranch: true,
          branchTypes: [
            {
              type: "headquarter",
              name: "Merkez",
              description: "Ana eğitim merkezi",
              isRequired: true,
              maxCount: 1
            },
            {
              type: "branch",
              name: "Şube",
              description: "Diğer eğitim merkezleri",
              isRequired: false,
              maxCount: 20
            }
          ]
        },
        requirements: {
          licenses: [
            {
              name: "MEB Onayı",
              description: "Milli Eğitim Bakanlığı onayı",
              isRequired: true,
              expiryRequired: true
            }
          ],
          certifications: [
            {
              name: "Uzmanlık Belgesi",
              description: "Eğitmen uzmanlık belgesi",
              isRequired: false,
              expiryRequired: true
            }
          ],
          permits: [
            {
              name: "İşletme Ruhsatı",
              description: "Belediye işletme ruhsatı",
              isRequired: true,
              expiryRequired: true
            }
          ]
        },
        services: [
          { name: "SRC Eğitimi", description: "SRC belgesi eğitimi", order: 1 },
          { name: "Psikoteknik", description: "Psikoteknik değerlendirme", order: 2 },
          { name: "İleri Sürüş", description: "İleri sürüş teknikleri", order: 3 },
          { name: "Mesleki Eğitim", description: "Mesleki gelişim eğitimi", order: 4 }
        ],
        isSystem: true
      },
      {
        name: "Psikoteknik",
        displayName: "Psikoteknik Merkezleri",
        description: "Psikoteknik değerlendirme hizmetleri",
        code: "PSYCHOTECHNIC",
        category: "education",
        icon: "🧠",
        color: "#a855f7",
        customFields: [
          {
            key: "certificationNumber",
            label: "Sertifika Numarası",
            type: "text",
            required: true,
            order: 1
          },
          {
            key: "testTypes",
            label: "Test Tipleri",
            type: "multiselect",
            required: true,
            validation: {
              options: ["Reaksiyon", "Gözlem", "Konsantrasyon", "Hafıza", "Mantık", "Algı"]
            },
            order: 2
          },
          {
            key: "dailyCapacity",
            label: "Günlük Kapasite",
            type: "number",
            required: true,
            validation: { min: 10, max: 500 },
            order: 3
          }
        ],
        branchStructure: {
          allowsMultipleBranches: true,
          requiresMainBranch: true,
          branchTypes: [
            {
              type: "headquarter",
              name: "Merkez",
              description: "Ana psikoteknik merkezi",
              isRequired: true,
              maxCount: 1
            },
            {
              type: "branch",
              name: "Şube",
              description: "Diğer psikoteknik merkezleri",
              isRequired: false,
              maxCount: 10
            }
          ]
        },
        requirements: {
          licenses: [
            {
              name: "Psikoteknik Sertifikası",
              description: "Psikoteknik merkez sertifikası",
              isRequired: true,
              expiryRequired: true
            }
          ],
          certifications: [],
          permits: [
            {
              name: "Sağlık Bakanlığı İzni",
              description: "Sağlık bakanlığı izni",
              isRequired: true,
              expiryRequired: true
            }
          ]
        },
        services: [
          { name: "Sürücü Psikotekniği", description: "Sürücü değerlendirmesi", order: 1 },
          { name: "Personel Psikotekniği", description: "Personel değerlendirmesi", order: 2 },
          { name: "Ekip Değerlendirmesi", description: "Ekip psikotekniği", order: 3 },
          { name: "Raporlama", description: "Detaylı raporlama", order: 4 }
        ],
        isSystem: true
      },
      {
        name: "Diğer",
        displayName: "Diğer Sektörler",
        description: "Diğer hizmet ve ticari faaliyetler",
        code: "OTHER",
        category: "other",
        icon: "🏪",
        color: "#6b7280",
        customFields: [
          {
            key: "businessDescription",
            label: "İş Tanımı",
            type: "textarea",
            required: true,
            validation: { maxLength: 1000 },
            order: 1
          },
          {
            key: "employeeCount",
            label: "Çalışan Sayısı",
            type: "number",
            required: false,
            validation: { min: 1, max: 1000 },
            order: 2
          }
        ],
        branchStructure: {
          allowsMultipleBranches: true,
          requiresMainBranch: true,
          branchTypes: [
            {
              type: "headquarter",
              name: "Merkez",
              description: "Ana iş merkezi",
              isRequired: true,
              maxCount: 1
            },
            {
              type: "branch",
              name: "Şube",
              description: "Diğer iş birimleri",
              isRequired: false,
              maxCount: 50
            }
          ]
        },
        requirements: {
          licenses: [],
          certifications: [],
          permits: [
            {
              name: "İşletme Ruhsatı",
              description: "Belediye işletme ruhsatı",
              isRequired: true,
              expiryRequired: true
            }
          ]
        },
        services: [
          { name: "Danışmanlık", description: "Profesyonel danışmanlık", order: 1 },
          { name: "Destek Hizmetleri", description: "Çeşitli destek hizmetleri", order: 2 }
        ],
        isSystem: true
      }
    ];

    // Sektörleri oluştur
    for (const industryData of industries) {
      const industry = new Industry(industryData);
      await industry.save();
    }

    console.log("✅ Sektörler başarıyla oluşturuldu");
    console.log(`📊 Toplam sektör sayısı: ${await Industry.countDocuments()}`);
    
    // Kategori bazında istatistikler
    const categories = await Industry.distinct('category');
    console.log("\n📋 Kategori Bazında Sektörler:");
    for (const category of categories) {
      const count = await Industry.countDocuments({ category });
      console.log(`├── ${category}: ${count} sektör`);
    }

  } catch (error) {
    console.error("❌ Sektör oluşturma hatası:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB bağlantısı kapatıldı");
  }
}

// Script'i çalıştır
if (require.main === module) {
  seedIndustries();
}

module.exports = seedIndustries;
