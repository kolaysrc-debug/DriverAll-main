// PATH: DriverAll-main/create-sample-data.js
// ----------------------------------------------------------
// Örnek veri oluşturma script'i
// - İlanlar
// - Lokasyonlar
// - Kullanıcılar
// ----------------------------------------------------------

const mongoose = require("mongoose");
require("dotenv").config();

// Models
const Job = require("./models/Job");
const Location = require("./models/Location");
const User = require("./models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/driverall";

async function createSampleData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB bağlantısı başarılı");

    // Önce employer kullanıcısı oluştur
    console.log("Employer kullanıcısı oluşturuluyor...");
    const employerUser = await User.findOneAndUpdate(
      { email: "employer@driverall.com" },
      {
        name: "Test Şirketi",
        email: "employer@driverall.com",
        passwordHash: "$2b$10$rOzJqQjQjQjQjQjQjQjQO", // password123
        role: "employer",
        isActive: true,
        isApproved: true,
        companyName: "Test Nakliyat",
        companyLegalName: "Test Nakliyat A.Ş.",
        country: "TR",
        city: "İstanbul",
        cityCode: "TR-34",
      },
      { upsert: true, new: true }
    );

    console.log("Employer kullanıcısı oluşturuldu:", employerUser._id);

    // Örnek lokasyonlar
    const locations = [
      {
        country: "TR",
        level: "state",
        code: "TR-34",
        name: "İstanbul",
        active: true,
      },
      {
        country: "TR",
        level: "state", 
        code: "TR-06",
        name: "Ankara",
        active: true,
      },
      {
        country: "TR",
        level: "state",
        code: "TR-35",
        name: "İzmir",
        active: true,
      },
      {
        country: "TR",
        level: "district",
        code: "TR-34-01",
        name: "Adalar",
        parentCode: "TR-34",
        active: true,
      },
      {
        country: "TR",
        level: "district",
        code: "TR-34-02",
        name: "Bakırköy",
        parentCode: "TR-34",
        active: true,
      },
      {
        country: "TR",
        level: "district",
        code: "TR-06-01",
        name: "Altındağ",
        parentCode: "TR-06",
        active: true,
      },
    ];

    // Örnek ilanlar
    const jobs = [
      {
        title: "Şehir İçi Nakliye Sürücüsü",
        description: "İstanbul içinde paket teslimatı yapacak deneyimli sürücü arıyoruz. SRC 2 belgesi zorunludur.",
        country: "TR",
        location: {
          countryCode: "TR",
          cityCode: "TR-34",
          districtCode: "TR-34-02",
          label: "İstanbul / Bakırköy"
        },
        criteria: {
          experienceMin: 2,
          experienceMax: 10,
          requiredSkills: ["SRC 2", "Ehliyet", "Psikoteknik"],
          locationRestrictions: ["İstanbul"]
        },
        status: "published",
        revision: 0,
        approvedRevision: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Uzun Yol Kamyon Sürücüsü",
        description: "Ankara - İstanbul arası mal taşımacılığı yapacak C sınıfı ehliyetli sürücü arıyoruz.",
        country: "TR",
        location: {
          countryCode: "TR",
          cityCode: "TR-06",
          districtCode: "TR-06-01",
          label: "Ankara / Altındağ"
        },
        criteria: {
          experienceMin: 5,
          experienceMax: 20,
          requiredSkills: ["C Ehliyet", "SRC 4", "Uzun Yol Deneyimi"],
          locationRestrictions: ["Ankara", "İstanbul"]
        },
        status: "published",
        revision: 0,
        approvedRevision: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Dağıtım Araç Sürücüsü",
        description: "İzmir merkezli dağıtım firması için E sınıfı ehliyetli sürücü arıyoruz.",
        country: "TR",
        location: {
          countryCode: "TR",
          cityCode: "TR-35",
          districtCode: null,
          label: "İzmir"
        },
        criteria: {
          experienceMin: 1,
          experienceMax: 8,
          requiredSkills: ["E Ehliyet", "İletişim"],
          locationRestrictions: ["İzmir"]
        },
        status: "published",
        revision: 0,
        approvedRevision: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Mevcut verileri temizle
    console.log("Mevcut veriler temizleniyor...");
    await Location.deleteMany({});
    await Job.deleteMany({});

    // Lokasyonları ekle
    console.log("Lokasyonlar ekleniyor...");
    await Location.insertMany(locations);
    console.log(`${locations.length} lokasyon eklendi`);

    // İlanları ekle
    console.log("İlanlar ekleniyor...");
    const jobsWithEmployer = jobs.map(job => ({
      ...job,
      employerUserId: employerUser._id
    }));
    
    await Job.insertMany(jobsWithEmployer);
    console.log(`${jobs.length} ilan eklendi`);

    console.log("Örnek veriler başarıyla oluşturuldu!");
    
  } catch (error) {
    console.error("Hata:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB bağlantısı kapatıldı");
  }
}

createSampleData();
