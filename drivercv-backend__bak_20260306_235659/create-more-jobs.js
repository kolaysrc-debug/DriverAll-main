// PATH: DriverAll-main/drivercv-backend/create-more-jobs.js
// ----------------------------------------------------------
// 10 tane örnek iş ilanı oluştur
// ----------------------------------------------------------

const mongoose = require("mongoose");

require("dotenv").config();

// MongoDB bağlantısı
const MONGO_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/driverall";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Job Model (basit versiyon)
const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String },
  salary: { type: Number },
  salaryType: { type: String, enum: ["monthly", "daily", "hourly"], default: "monthly" },
  jobType: { type: String, enum: ["full-time", "part-time", "contract", "temporary"], default: "full-time" },
  experience: { type: String, enum: ["junior", "mid", "senior", "any"], default: "any" },
  vehicleType: { type: String },
  licenseRequired: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  employerUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
  applications: [{ type: mongoose.Schema.Types.ObjectId }],
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Job = mongoose.model("Job", JobSchema);

// User Model (employerUserId için)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true }
});

const User = mongoose.model("User", UserSchema);

// Örnek iş ilanları
const jobs = [
  {
    title: "C Sınıfı Sürücü",
    description: "Şehir içi dağıtım için C sınıfı ehliyetli sürücü arıyoruz. Esnek çalışma saatleri.",
    company: "Hızlı Lojistik",
    location: "İstanbul, Kadıköy",
    city: "İstanbul",
    district: "Kadıköy",
    salary: 8500,
    salaryType: "monthly",
    jobType: "full-time",
    experience: "mid",
    vehicleType: "Kamyonet",
    licenseRequired: true
  },
  {
    title: "E Sınıfı Tır Sürücüsü",
    description: "Uluslararası yolculuklar için deneyimli E sınıfı tır sürücüsü arıyoruz. Konaklama dahil.",
    company: "Global Transport",
    location: "İstanbul, Şişli",
    city: "İstanbul",
    district: "Şişli",
    salary: 12000,
    salaryType: "monthly",
    jobType: "full-time",
    experience: "senior",
    vehicleType: "Tır",
    licenseRequired: true
  },
  {
    title: "Kamyon Şoförü",
    description: "Ankara içi ve çevre illere mal taşımacılığı için kamyon şoförü alınacaktır.",
    company: "Ankara Nakliyat",
    location: "Ankara, Yenimahalle",
    city: "Ankara",
    district: "Yenimahalle",
    salary: 7500,
    salaryType: "monthly",
    jobType: "full-time",
    experience: "mid",
    vehicleType: "Kamyon",
    licenseRequired: true
  },
  {
    title: "Servis Şoförü",
    description: "Personel servisi için B sınıfı ehliyetli servis şoförü arıyoruz. Sabah ve akşam seferleri.",
    company: "Ege Taşımacılık",
    location: "İzmir, Bornova",
    city: "İzmir",
    district: "Bornova",
    salary: 6500,
    salaryType: "monthly",
    jobType: "part-time",
    experience: "junior",
    vehicleType: "Servis Aracı",
    licenseRequired: true
  },
  {
    title: "Kurye Sürücü",
    description: "Motorlu kurye olarak çalışacak, ehliyetli ve dinamik sürücü arıyoruz.",
    company: "Hızlı Kargo",
    location: "İstanbul, Beşiktaş",
    city: "İstanbul",
    district: "Beşiktaş",
    salary: 5500,
    salaryType: "monthly",
    jobType: "full-time",
    experience: "junior",
    vehicleType: "Motorsiklet",
    licenseRequired: true
  },
  {
    title: "Taksi Şoförü",
    description: "Taksi olarak çalışacak, İstanbul trafiğine hakim şoför arıyoruz. Vekalet imkanı.",
    company: "Taksi Durakları",
    location: "İstanbul, Taksim",
    city: "İstanbul",
    district: "Beyoğlu",
    salary: 8000,
    salaryType: "monthly",
    jobType: "full-time",
    experience: "mid",
    vehicleType: "Taksi",
    licenseRequired: true
  },
  {
    title: "Minibüs Şoförü",
    description: "Öğrenci servisi için minibüs şoförü arıyoruz. Sabah ve öğle seferleri.",
    company: "Okul Servisleri",
    location: "Ankara, Çankaya",
    city: "Ankara",
    district: "Çankaya",
    salary: 6000,
    salaryType: "monthly",
    jobType: "part-time",
    experience: "junior",
    vehicleType: "Minibüs",
    licenseRequired: true
  },
  {
    title: "Damga Şoförü",
    description: "Fabrika içi mal taşımacılığı için damga şoförü alınacaktır. İç mesafe.",
    company: "Fabrika Lojistik",
    location: "Kocaeli, İzmit",
    city: "Kocaeli",
    district: "İzmit",
    salary: 7000,
    salaryType: "monthly",
    jobType: "full-time",
    experience: "junior",
    vehicleType: "Forklift",
    licenseRequired: false
  },
  {
    title: "Panelvan Şoförü",
    description: "Eşya taşımacılığı için panelvan şoförü arıyoruz. Hafta sonu mesaisi yok.",
    company: "Ev Taşıma",
    location: "Bursa, Nilüfer",
    city: "Bursa",
    district: "Nilüfer",
    salary: 6800,
    salaryType: "monthly",
    jobType: "full-time",
    experience: "mid",
    vehicleType: "Panelvan",
    licenseRequired: true
  },
  {
    title: "Çekici Şoförü",
    description: "Araç çekici olarak çalışacak, deneyimli çekici şoförü arıyoruz. Gece vardiyası.",
    company: "Otoyol Yardım",
    location: "İstanbul, Pendik",
    city: "İstanbul",
    district: "Pendik",
    salary: 9000,
    salaryType: "monthly",
    jobType: "full-time",
    experience: "senior",
    vehicleType: "Çekici",
    licenseRequired: true
  }
];

async function createJobs() {
  try {
    console.log("İş ilanları oluşturuluyor...");
    
    // Önceki ilanları temizle
    await Job.deleteMany({});
    console.log("Eski ilanlar temizlendi");
    
    // Employer kullanıcıları bul
    const employers = await User.find({ role: "employer" });
    console.log(`${employers.length} employer bulundu`);
    
    if (employers.length === 0) {
      console.log("Önce employer kullanıcıları oluşturun!");
      process.exit(1);
    }
    
    // Her ilana rastgele employer ata
    const createdJobs = [];
    for (let i = 0; i < jobs.length; i++) {
      const jobData = jobs[i];
      const randomEmployer = employers[Math.floor(Math.random() * employers.length)];
      
      jobData.employerUserId = randomEmployer._id;
      jobData.views = Math.floor(Math.random() * 100) + 10; // 10-110 arası rastgele görünüm
      
      const createdJob = await Job.create(jobData);
      createdJobs.push(createdJob);
    }
    
    console.log(`${createdJobs.length} iş ilanı oluşturuldu`);
    
    createdJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} - ${job.salary} TL (${job.views} görüntülenme)`);
    });
    
    console.log("İş ilanları başarıyla oluşturuldu!");
    process.exit(0);
  } catch (error) {
    console.error("Hata:", error);
    process.exit(1);
  }
}

createJobs();
