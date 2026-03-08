// PATH: DriverAll-main/drivercv-backend/create-more-data.js
// ----------------------------------------------------------
// Daha fazla örnek veri oluşturma
// - 50+ ilan
// - Paketler
// - Kullanıcılar
// ----------------------------------------------------------

const mongoose = require("mongoose");
require("dotenv").config();

const Job = require("./models/Job");
const Location = require("./models/Location");
const User = require("./models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/driverall";

async function createMoreData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB bağlantısı başarılı");

    // Daha fazla lokasyon
    const moreLocations = [
      { country: "TR", level: "state", code: "TR-16", name: "Bursa", active: true },
      { country: "TR", level: "state", code: "TR-21", name: "Edirne", active: true },
      { country: "TR", level: "state", code: "TR-41", name: "Kocaeli", active: true },
      { country: "TR", level: "state", code: "TR-54", name: "Sakarya", active: true },
      { country: "TR", level: "state", code: "TR-58", name: "Tekirdağ", active: true },
      { country: "TR", level: "state", code: "TR-61", name: "Trabzon", active: true },
      { country: "TR", level: "state", code: "TR-10", name: "Balıkesir", active: true },
    ];

    // Daha fazla employer
    const employers = [
      {
        name: "Hızlı Lojistik",
        email: "hizli@lojistik.com",
        passwordHash: "$2b$10$rOzJqQjQjQjQjQjQjQjO",
        role: "employer",
        isActive: true,
        isApproved: true,
        companyName: "Hızlı Lojistik A.Ş.",
        companyLegalName: "Hızlı Lojistik Taşımacılık A.Ş.",
        country: "TR",
        city: "Bursa",
        cityCode: "TR-16",
      },
      {
        name: "Ege Nakliyat",
        email: "ege@nakliyat.com",
        passwordHash: "$2b$10$rOzJqQjQjQjQjQjQjQjO",
        role: "employer",
        isActive: true,
        isApproved: true,
        companyName: "Ege Nakliyat",
        companyLegalName: "Ege Nakliyat Ltd. Şti.",
        country: "TR",
        city: "İzmir",
        cityCode: "TR-35",
      },
      {
        name: "Marmara Taşımacılık",
        email: "marmara@tasimacilik.com",
        passwordHash: "$2b$10$rOzJqQjQjQjQjQjQjQjO",
        role: "employer",
        isActive: true,
        isApproved: true,
        companyName: "Marmara Taşımacılık",
        companyLegalName: "Marmara Taşımacılık San. Tic. Ltd. Şti.",
        country: "TR",
        city: "Kocaeli",
        cityCode: "TR-41",
      },
    ];

    // Daha fazla sürücü
    const drivers = [
      {
        name: "Ahmet Yılmaz",
        email: "ahmet.yilmaz@driver.com",
        passwordHash: "$2b$10$rOzJqQjQjQjQjQjQjQjO",
        role: "driver",
        isActive: true,
        isApproved: true,
        phone: "+905321234567",
        country: "TR",
        city: "İstanbul",
        cityCode: "TR-34",
      },
      {
        name: "Mehmet Kaya",
        email: "mehmet.kaya@driver.com",
        passwordHash: "$2b$10$rOzJqQjQjQjQjQjQjQjO",
        role: "driver",
        isActive: true,
        isApproved: true,
        phone: "+905337654321",
        country: "TR",
        city: "Ankara",
        cityCode: "TR-06",
      },
      {
        name: "Ali Demir",
        email: "ali.demir@driver.com",
        passwordHash: "$2b$10$rOzJqQjQjQjQjQjQjQjO",
        role: "driver",
        isActive: true,
        isApproved: true,
        phone: "+905421112233",
        country: "TR",
        city: "İzmir",
        cityCode: "TR-35",
      },
    ];

    // Daha fazla ilan
    const jobTitles = [
      "Şehir İçi Dağıtım Sürücüsü",
      "Uzun Yol Tır Sürücüsü",
      "Kamyon Şoförü",
      "Pickup Sürücüsü",
      "Panelvan Sürücüsü",
      "Lojistik Personeli",
      "Depo Taşıma Sürücüsü",
      "Part-Time Sürücü",
      "Gece Vardiyası Sürücüsü",
      "Hafta Sonu Sürücüsü",
    ];

    const jobDescriptions = [
      "Deneyimli sürücü arıyoruz. SRC belgesi zorunludur.",
      "Şehirler arası mal taşımacılığı yapacak ekip arkadaşı arıyoruz.",
      "Dağıtım ağı için sürücü ihtiyacımız var.",
      "Firmamız bünyesinde çalışacak sürücü alınacaktır.",
      "Yoğun iş temposuna ayak uydurabilecek sürücü arıyoruz.",
    ];

    const cities = ["TR-34", "TR-06", "TR-35", "TR-16", "TR-41", "TR-21"];
    const cityNames = ["İstanbul", "Ankara", "İzmir", "Bursa", "Kocaeli", "Edirne"];

    // Employer'ları oluştur
    console.log("Employer'lar oluşturuluyor...");
    const createdEmployers = [];
    for (const employer of employers) {
      const created = await User.findOneAndUpdate(
        { email: employer.email },
        employer,
        { upsert: true, new: true }
      );
      createdEmployers.push(created);
      console.log(`- ${employer.companyName} oluşturuldu`);
    }

    // Sürücüleri oluştur
    console.log("Sürücüler oluşturuluyor...");
    for (const driver of drivers) {
      await User.findOneAndUpdate(
        { email: driver.email },
        driver,
        { upsert: true, new: true }
      );
      console.log(`- ${driver.name} oluşturuldu`);
    }

    // Lokasyonları ekle
    console.log("Daha fazla lokasyon ekleniyor...");
    await Location.insertMany(moreLocations);
    console.log(`${moreLocations.length} yeni lokasyon eklendi`);

    // 50+ ilan oluştur
    console.log("50+ ilan oluşturuluyor...");
    const moreJobs = [];
    for (let i = 0; i < 50; i++) {
      const randomEmployer = createdEmployers[Math.floor(Math.random() * createdEmployers.length)];
      const randomCityIndex = Math.floor(Math.random() * cities.length);
      
      const job = {
        title: jobTitles[Math.floor(Math.random() * jobTitles.length)],
        description: jobDescriptions[Math.floor(Math.random() * jobDescriptions.length)],
        country: "TR",
        location: {
          countryCode: "TR",
          cityCode: cities[randomCityIndex],
          districtCode: null,
          label: cityNames[randomCityIndex]
        },
        criteria: {
          experienceMin: Math.floor(Math.random() * 5) + 1,
          experienceMax: Math.floor(Math.random() * 15) + 5,
          requiredSkills: ["Ehliyet", "SRC Belgesi", "Deneyim"],
          locationRestrictions: [cityNames[randomCityIndex]]
        },
        status: "published",
        revision: 0,
        approvedRevision: 0,
        employerUserId: randomEmployer._id,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Son 30 gün içinde
        updatedAt: new Date(),
      };
      moreJobs.push(job);
    }

    await Job.insertMany(moreJobs);
    console.log(`${moreJobs.length} yeni ilan eklendi`);

    // İstatistikler
    const finalJobsCount = await Job.countDocuments();
    const finalUsersCount = await User.countDocuments();
    const finalLocationsCount = await Location.countDocuments();

    console.log("\n=== SON DURUM ===");
    console.log(`Toplam İlanlar: ${finalJobsCount}`);
    console.log(`Toplam Kullanıcılar: ${finalUsersCount}`);
    console.log(`Toplam Lokasyonlar: ${finalLocationsCount}`);
    console.log("Örnek veriler başarıyla oluşturuldu!");
    
  } catch (error) {
    console.error("Hata:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB bağlantısı kapatıldı");
  }
}

createMoreData();
