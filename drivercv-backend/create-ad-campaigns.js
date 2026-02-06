// PATH: DriverAll-main/drivercv-backend/create-ad-campaigns.js
// ----------------------------------------------------------
// 10 tane örnek reklam kampanyası oluştur
// ----------------------------------------------------------

const mongoose = require("mongoose");

// MongoDB bağlantısı
mongoose.connect("mongodb://127.0.0.1:27017/driverall", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// AdCampaign Model (basit versiyon)
const AdCampaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  advertiserId: { type: mongoose.Schema.Types.ObjectId, required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, required: true },
  bannerUrl: { type: String },
  targetUrl: { type: String },
  targetAudience: {
    roles: [{ type: String }],
    cities: [{ type: String }],
    ageRange: {
      min: { type: Number },
      max: { type: Number }
    }
  },
  budget: { type: Number, required: true },
  status: { type: String, enum: ["active", "paused", "completed", "cancelled"], default: "active" },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 }, // Click-through rate
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const AdCampaign = mongoose.model("AdCampaign", AdCampaignSchema);

// User Model (advertiserId için)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true }
});

const User = mongoose.model("User", UserSchema);

// AdPackage Model (packageId için)
const AdPackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  impressions: { type: Number, required: true },
  clicks: { type: Number, required: true }
});

const AdPackage = mongoose.model("AdPackage", AdPackageSchema);

// Örnek reklam kampanyaları
const adCampaigns = [
  {
    title: "Sürücü Eğitim Kursu",
    description: "Profesyonel sürücü eğitimi kursu için reklam kampanyası",
    bannerUrl: "https://picsum.photos/seed/surucu-kursu/728x90.jpg",
    targetUrl: "https://surucu-kursu.com",
    targetAudience: {
      roles: ["driver"],
      cities: ["İstanbul", "Ankara", "İzmir"],
      ageRange: { min: 20, max: 50 }
    },
    budget: 299,
    status: "active"
  },
  {
    title: "Lojistik Yazılımı",
    description: "Nakliye firmaları için modern lojistik yönetim yazılımı",
    bannerUrl: "https://picsum.photos/seed/lojistik-yazilim/728x90.jpg",
    targetUrl: "https://lojistik-yazilim.com",
    targetAudience: {
      roles: ["employer"],
      cities: ["İstanbul", "Bursa", "Kocaeli"],
      ageRange: { min: 25, max: 60 }
    },
    budget: 599,
    status: "active"
  },
  {
    title: "Kamyon Satış",
    description: "Yeni ve ikinci el kamyon satış kampanyası",
    bannerUrl: "https://picsum.photos/seed/kamyon-satis/728x90.jpg",
    targetUrl: "https://kamyon-satis.com",
    targetAudience: {
      roles: ["employer", "driver"],
      cities: ["Ankara", "Konya", "Samsun"],
      ageRange: { min: 30, max: 55 }
    },
    budget: 1299,
    status: "active"
  },
  {
    title: "Yakıt Kartı",
    description: "Tüm istasyonlarda geçerli yakıt kartı avantajları",
    bannerUrl: "https://picsum.photos/seed/yakit-karti/728x90.jpg",
    targetUrl: "https://yakit-karti.com",
    targetAudience: {
      roles: ["driver", "employer"],
      cities: ["İstanbul", "İzmir", "Antalya"],
      ageRange: { min: 22, max: 60 }
    },
    budget: 799,
    status: "active"
  },
  {
    title: "Sürücü İlanı",
    description: "İşverenler için sürücü bulma platformu",
    bannerUrl: "https://picsum.photos/seed/surucu-ilan/728x90.jpg",
    targetUrl: "https://surucu-ilan.com",
    targetAudience: {
      roles: ["employer"],
      cities: ["İstanbul", "Ankara", "Bursa"],
      ageRange: { min: 28, max: 65 }
    },
    budget: 999,
    status: "active"
  },
  {
    title: "Oto Yedek Parça",
    description: "Tüm marka ve model araçlar için yedek parça",
    bannerUrl: "https://picsum.photos/seed/yedek-parca/728x90.jpg",
    targetUrl: "https://yedek-parca.com",
    targetAudience: {
      roles: ["driver", "employer"],
      cities: ["Kocaeli", "Sakarya", "Bilecik"],
      ageRange: { min: 25, max: 55 }
    },
    budget: 399,
    status: "active"
  },
  {
    title: "Sigorta Kampanyası",
    description: "Sürücüler için özel kasko ve trafik sigortası",
    bannerUrl: "https://picsum.photos/seed/sigorta/728x90.jpg",
    targetUrl: "https://surucu-sigorta.com",
    targetAudience: {
      roles: ["driver"],
      cities: ["İstanbul", "Ankara", "İzmir", "Adana"],
      ageRange: { min: 21, max: 50 }
    },
    budget: 199,
    status: "active"
  },
  {
    title: "GPS Takip Sistemi",
    description: "Araç filosu için GPS takip ve yönetim sistemi",
    bannerUrl: "https://picsum.photos/seed/gps-takip/728x90.jpg",
    targetUrl: "https://gps-takip.com",
    targetAudience: {
      roles: ["employer"],
      cities: ["İstanbul", "Bursa", "Kocaeli", "Manisa"],
      ageRange: { min: 30, max: 60 }
    },
    budget: 2499,
    status: "active"
  },
  {
    title: "Sürücü Ekipmanları",
    description: "Profesyonel sürücü ekipmanları ve güvenlik malzemeleri",
    bannerUrl: "https://picsum.photos/seed/surucu-ekipman/728x90.jpg",
    targetUrl: "https://surucu-ekipman.com",
    targetAudience: {
      roles: ["driver"],
      cities: ["İstanbul", "Ankara", "İzmir", "Mersin"],
      ageRange: { min: 20, max: 55 }
    },
    budget: 299,
    status: "active"
  },
  {
    title: "Nakliye Platformu",
    description: "Nakliye firmaları ve sürücüler için buluşma platformu",
    bannerUrl: "https://picsum.photos/seed/nakliye-platform/728x90.jpg",
    targetUrl: "https://nakliye-platform.com",
    targetAudience: {
      roles: ["driver", "employer"],
      cities: ["İstanbul", "Ankara", "İzmir", "Konya"],
      ageRange: { min: 22, max: 60 }
    },
    budget: 4999,
    status: "active"
  }
];

async function createAdCampaigns() {
  try {
    console.log("Reklam kampanyaları oluşturuluyor...");
    
    // Önceki kampanyaları temizle
    await AdCampaign.deleteMany({});
    console.log("Eski kampanyalar temizlendi");
    
    // Advertiser kullanıcıları bul
    const advertisers = await User.find({ role: "advertiser" });
    console.log(`${advertisers.length} advertiser bulundu`);
    
    if (advertisers.length === 0) {
      console.log("Önce advertiser kullanıcıları oluşturun!");
      process.exit(1);
    }
    
    // Reklam paketlerini bul
    const packages = await AdPackage.find({});
    console.log(`${packages.length} reklam paketi bulundu`);
    
    if (packages.length === 0) {
      console.log("Önce reklam paketleri oluşturun!");
      process.exit(1);
    }
    
    // Kampanyaları oluştur
    const createdCampaigns = [];
    for (let i = 0; i < adCampaigns.length; i++) {
      const campaignData = adCampaigns[i];
      const randomAdvertiser = advertisers[Math.floor(Math.random() * advertisers.length)];
      const randomPackage = packages[Math.floor(Math.random() * packages.length)];
      
      campaignData.advertiserId = randomAdvertiser._id;
      campaignData.packageId = randomPackage._id;
      
      // Tarihleri ayarla
      const startDate = new Date();
      const duration = randomPackage.duration;
      const endDate = new Date(startDate.getTime() + (duration * 24 * 60 * 60 * 1000));
      
      campaignData.startDate = startDate;
      campaignData.endDate = endDate;
      
      // Rastgele performans verileri
      campaignData.impressions = Math.floor(Math.random() * randomPackage.impressions);
      campaignData.clicks = Math.floor(Math.random() * randomPackage.clicks);
      campaignData.ctr = campaignData.impressions > 0 ? 
        (campaignData.clicks / campaignData.impressions * 100).toFixed(2) : 0;
      
      const createdCampaign = await AdCampaign.create(campaignData);
      createdCampaigns.push(createdCampaign);
    }
    
    console.log(`${createdCampaigns.length} reklam kampanyası oluşturuldu`);
    
    createdCampaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.title} - ${campaign.budget} TL (${campaign.impressions} görüntülenme, ${campaign.clicks} tıklama)`);
    });
    
    console.log("Reklam kampanyaları başarıyla oluşturuldu!");
    process.exit(0);
  } catch (error) {
    console.error("Hata:", error);
    process.exit(1);
  }
}

createAdCampaigns();
