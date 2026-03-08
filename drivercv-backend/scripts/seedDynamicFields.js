// PATH: DriverAll-main/drivercv-backend/scripts/seedDynamicFields.js
// ----------------------------------------------------------
// Dinamik Profil Alanları Başlangıç Verileri
// - Kişisel bilgiler
// - Role göre özel alanlar
// - Validasyon kuralları
// ----------------------------------------------------------

require("dotenv").config();
const mongoose = require("mongoose");
const DynamicField = require("../models/DynamicField");
const Role = require("../models/Role");

async function seedDynamicFields() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/driverall");
    console.log("MongoDB bağlantısı başarılı");

    // Mevcut alanları temizle (sistem alanları hariç)
    await DynamicField.deleteMany({ isSystem: { $ne: true } });
    console.log("Mevcut alanlar temizlendi");

    // Rolleri getir
    const roles = await Role.find({});
    const candidateRole = roles.find(r => r.name === "candidate");
    const businessRole = roles.find(r => r.name === "business");
    const adminRole = roles.find(r => r.name === "admin");

    if (!candidateRole || !businessRole || !adminRole) {
      throw new Error("Roller bulunamadı. Önce rolleri oluşturun.");
    }

    // Kişisel Bilgiler alanları
    const personalFields = [
      {
        key: "fullName",
        label: "Ad Soyad",
        description: "Adınız ve soyadınız",
        type: "text",
        category: "personal",
        section: "basic_info",
        roleVisibility: [
          {
            role: candidateRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: true,
            validation: {
              required: true,
              minLength: 3,
              maxLength: 100,
              pattern: "^[a-zA-ZğüşıöçĞÜŞİÖÇ\\s]+$"
            }
          },
          {
            role: businessRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: true,
            validation: {
              required: true,
              minLength: 3,
              maxLength: 100,
              pattern: "^[a-zA-ZğüşıöçĞÜŞİÖÇ\\s]+$"
            }
          },
          {
            role: adminRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: true,
            validation: {
              required: true,
              minLength: 3,
              maxLength: 100
            }
          }
        ],
        appearance: {
          width: "full",
          icon: "👤",
          placeholder: "Adınızı ve soyadınızı giriniz"
        },
        order: 1,
        isSystem: true
      },
      {
        key: "tcKimlikNo",
        label: "TC Kimlik No",
        description: "Türkiye Cumhuriyeti kimlik numaranız",
        type: "text",
        category: "personal",
        section: "basic_info",
        roleVisibility: [
          {
            role: candidateRole._id,
            isVisible: true,
            isRequired: false,
            isEditable: true,
            validation: {
              required: false,
              minLength: 11,
              maxLength: 11,
              pattern: "^[0-9]{11}$"
            }
          },
          {
            role: businessRole._id,
            isVisible: true,
            isRequired: false,
            isEditable: true,
            validation: {
              required: false,
              minLength: 11,
              maxLength: 11,
              pattern: "^[0-9]{11}$"
            }
          },
          {
            role: adminRole._id,
            isVisible: true,
            isRequired: false,
            isEditable: true,
            validation: {
              required: false,
              minLength: 11,
              maxLength: 11,
              pattern: "^[0-9]{11}$"
            }
          }
        ],
        appearance: {
          width: "half",
          icon: "🆔",
          placeholder: "11 haneli TC kimlik no"
        },
        order: 2
      },
      {
        key: "birthDate",
        label: "Doğum Tarihi",
        description: "Doğum tarihiniz",
        type: "date",
        category: "personal",
        section: "basic_info",
        roleVisibility: [
          {
            role: candidateRole._id,
            isVisible: true,
            isRequired: false,
            isEditable: true,
            validation: {
              required: false,
              max: new Date() // Gelecek tarih olamaz
            }
          },
          {
            role: businessRole._id,
            isVisible: true,
            isRequired: false,
            isEditable: true,
            validation: {
              required: false,
              max: new Date()
            }
          },
          {
            role: adminRole._id,
            isVisible: true,
            isRequired: false,
            isEditable: true,
            validation: {
              required: false,
              max: new Date()
            }
          }
        ],
        appearance: {
          width: "half",
          icon: "📅"
        },
        order: 3
      }
    ];

    // İletişim Bilgileri alanları
    const contactFields = [
      {
        key: "phone",
        label: "Telefon",
        description: "Cep telefonu numaranız",
        type: "phone",
        category: "contact",
        section: "basic_contact",
        roleVisibility: [
          {
            role: candidateRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: true,
            validation: {
              required: true,
              pattern: "^(\+90|0)?[0-9]{10}$"
            }
          },
          {
            role: businessRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: true,
            validation: {
              required: true,
              pattern: "^(\+90|0)?[0-9]{10}$"
            }
          },
          {
            role: adminRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: true,
            validation: {
              required: true,
              pattern: "^(\+90|0)?[0-9]{10}$"
            }
          }
        ],
        appearance: {
          width: "half",
          icon: "📱",
          placeholder: "05XX XXX XX XX"
        },
        order: 1,
        isSystem: true
      },
      {
        key: "email",
        label: "E-posta",
        description: "E-posta adresiniz",
        type: "email",
        category: "contact",
        section: "basic_contact",
        roleVisibility: [
          {
            role: candidateRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: false, // Kullanıcı adı ile aynı
            validation: {
              required: true,
              pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s]+$"
            }
          },
          {
            role: businessRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: false,
            validation: {
              required: true,
              pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s]+$"
            }
          },
          {
            role: adminRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: false,
            validation: {
              required: true,
              pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s]+$"
            }
          }
        ],
        appearance: {
          width: "half",
          icon: "✉️"
        },
        order: 2,
        isSystem: true
      },
      {
        key: "address",
        label: "Adres",
        description: "Adresiniz",
        type: "textarea",
        category: "contact",
        section: "location_info",
        roleVisibility: [
          {
            role: candidateRole._id,
            isVisible: true,
            isRequired: false,
            isEditable: true,
            validation: {
              required: false,
              maxLength: 500
            }
          },
          {
            role: businessRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: true,
            validation: {
              required: true,
              maxLength: 500
            }
          },
          {
            role: adminRole._id,
            isVisible: true,
            isRequired: false,
            isEditable: true,
            validation: {
              required: false,
              maxLength: 500
            }
          }
        ],
        appearance: {
          width: "full",
          icon: "📍",
          placeholder: "Adresinizi giriniz"
        },
        order: 3
      }
    ];

    // İşletme Bilgileri alanları (sadece business rolü için)
    const businessFields = [
      {
        key: "companyName",
        label: "Şirket Adı",
        description: "Resmi şirket adınız",
        type: "text",
        category: "business",
        section: "company_info",
        roleVisibility: [
          {
            role: businessRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: true,
            validation: {
              required: true,
              minLength: 3,
              maxLength: 200
            }
          }
        ],
        appearance: {
          width: "full",
          icon: "🏢",
          placeholder: "Şirket ünvanı"
        },
        order: 1,
        isSystem: true
      },
      {
        key: "taxNumber",
        label: "Vergi No",
        description: "Vergi numaranız",
        type: "text",
        category: "business",
        section: "company_info",
        roleVisibility: [
          {
            role: businessRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: true,
            validation: {
              required: true,
              minLength: 10,
              maxLength: 20
            }
          }
        ],
        appearance: {
          width: "half",
          icon: "🧾",
          placeholder: "Vergi numarası"
        },
        order: 2,
        isSystem: true
      },
      {
        key: "taxOffice",
        label: "Vergi Dairesi",
        description: "Vergi dairesi",
        type: "text",
        category: "business",
        section: "company_info",
        roleVisibility: [
          {
            role: businessRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: true,
            validation: {
              required: true,
              maxLength: 100
            }
          }
        ],
        appearance: {
          width: "half",
          icon: "🏛️",
          placeholder: "Vergi dairesi"
        },
        order: 3,
        isSystem: true
      },
      {
        key: "industry",
        label: "Sektör",
        description: "Faaliyet alanınız",
        type: "select",
        category: "business",
        section: "company_info",
        roleVisibility: [
          {
            role: businessRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: true,
            validation: {
              required: true,
              options: ["Taşımacılık", "İmalat", "Depolama", "Eğitim", "Hizmet", "Teknoloji", "Diğer"]
            }
          }
        ],
        appearance: {
          width: "full",
          icon: "🏭"
        },
        order: 4,
        isSystem: true
      },
      {
        key: "website",
        label: "Web Sitesi",
        description: "Şirket web sitesi",
        type: "url",
        category: "business",
        section: "company_info",
        roleVisibility: [
          {
            role: businessRole._id,
            isVisible: true,
            isRequired: false,
            isEditable: true,
            validation: {
              required: false,
              pattern: "^https?://.+"
            }
          }
        ],
        appearance: {
          width: "full",
          icon: "🌐",
          placeholder: "https://www.sirket.com"
        },
        order: 5
      }
    ];

    // Profesyonel Bilgiler alanları (aday için)
    const professionalFields = [
      {
        key: "experienceYears",
        label: "Tecrübe Yılı",
        description: "Toplam çalışma tecrübeniz",
        type: "number",
        category: "professional",
        section: "experience",
        roleVisibility: [
          {
            role: candidateRole._id,
            isVisible: true,
            isRequired: false,
            isEditable: true,
            validation: {
              required: false,
              min: 0,
              max: 50
            }
          }
        ],
        appearance: {
          width: "half",
          icon: "💼",
          placeholder: "Yıl"
        },
        order: 1
      },
      {
        key: "motivation",
        label: "Motivasyon Nedeni",
        description: "Bu rolü neden seçtiniz?",
        type: "textarea",
        category: "professional",
        section: "motivation",
        roleVisibility: [
          {
            role: candidateRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: true,
            validation: {
              required: true,
              minLength: 10,
              maxLength: 1000
            }
          }
        ],
        appearance: {
          width: "full",
          icon: "🎯",
          placeholder: "Motivasyonunuzu açıklayınız"
        },
        order: 2,
        isSystem: true
      },
      {
        key: "availability",
        label: "İşe Başlama Tarihi",
        description: "Ne zaman işe başlayabilirsiniz?",
        type: "date",
        category: "professional",
        section: "availability",
        roleVisibility: [
          {
            role: candidateRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: true,
            validation: {
              required: true,
              min: new Date() // Bugünden sonrası
            }
          }
        ],
        appearance: {
          width: "full",
          icon: "📅"
        },
        order: 3,
        isSystem: true
      }
    ];

    // Admin alanları
    const adminFields = [
      {
        key: "adminLevel",
        label: "Admin Seviyesi",
        description: "Admin yetki seviyeniz",
        type: "select",
        category: "admin",
        section: "admin_info",
        roleVisibility: [
          {
            role: adminRole._id,
            isVisible: true,
            isRequired: true,
            isEditable: true,
            validation: {
              required: true,
              options: ["Super", "Senior", "Junior"]
            }
          }
        ],
        appearance: {
          width: "full",
          icon: "👨‍💼"
        },
        order: 1,
        isSystem: true
      }
    ];

    // Tüm alanları birleştir
    const allFields = [
      ...personalFields,
      ...contactFields,
      ...businessFields,
      ...professionalFields,
      ...adminFields
    ];

    // Alanları oluştur
    for (const fieldData of allFields) {
      const field = new DynamicField(fieldData);
      await field.save();
    }

    console.log("✅ Dinamik alanlar başarıyla oluşturuldu");
    console.log(`📊 Toplam alan sayısı: ${await DynamicField.countDocuments()}`);
    
    // Kategori bazında istatistikler
    const categories = await DynamicField.distinct('category');
    console.log("\n📋 Kategori Bazında Alanlar:");
    for (const category of categories) {
      const count = await DynamicField.countDocuments({ category });
      console.log(`├── ${category}: ${count} alan`);
    }

  } catch (error) {
    console.error("❌ Alan oluşturma hatası:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB bağlantısı kapatıldı");
  }
}

// Script'i çalıştır
if (require.main === module) {
  seedDynamicFields();
}

module.exports = seedDynamicFields;
