// PATH: DriverAll-main/drivercv-backend/create-ad-packages.js
// ----------------------------------------------------------
// 10 tane örnek reklam paketi oluştur
// ----------------------------------------------------------

const mongoose = require("mongoose");

// MongoDB bağlantısı
mongoose.connect("mongodb://127.0.0.1:27017/driverall", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// AdPackage Model (basit versiyon)
const AdPackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true }, // gün
  impressions: { type: Number, required: true },
  clicks: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  features: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const AdPackage = mongoose.model("AdPackage", AdPackageSchema);

// Örnek reklam paketleri
const adPackages = [
  {
    name: "Başlangıç Paketi",
    description: "Küçük işletmeler için ideal başlangıç reklam paketi",
    price: 299,
    duration: 7,
    impressions: 5000,
    clicks: 100,
    features: ["Banner reklam", "7 gün görüntüleme", "Basic raporlama"]
  },
  {
    name: "Profesyonel Paket",
    description: "Orta ölçekli firmalar için popüler paket",
    price: 599,
    duration: 14,
    impressions: 15000,
    clicks: 300,
    features: ["Banner reklam", "14 gün görüntüleme", "Detaylı raporlama", "Hedefleme"]
  },
  {
    name: "Premium Paket",
    description: "Büyük firmalar için kapsamlı reklam çözümü",
    price: 1299,
    duration: 30,
    impressions: 50000,
    clicks: 1000,
    features: ["Banner reklam", "30 gün görüntüleme", "Premium raporlama", "İleri hedefleme", "Öncelikli gösterim"]
  },
  {
    name: "Ultra Paket",
    description: "Maksimum görünürlük için en üst düzey paket",
    price: 2499,
    duration: 60,
    impressions: 150000,
    clicks: 3000,
    features: ["Banner reklam", "60 gün görüntüleme", "Ultra raporlama", "İleri hedefleme", "Öncelikli gösterim", "Video reklam"]
  },
  {
    name: "Sürücü Odaklı Paket",
    description: "Sadece sürücülere özel hedeflenmiş reklam",
    price: 799,
    duration: 21,
    impressions: 20000,
    clicks: 500,
    features: ["Sürücü hedefleme", "21 gün görüntüleme", "Detaylı raporlama", "Mobil optimizasyon"]
  },
  {
    name: "Employer Paketi",
    description: "İşverenlere özel personel bulma reklamları",
    price: 999,
    duration: 30,
    impressions: 30000,
    clicks: 800,
    features: ["İşveren hedefleme", "30 gün görüntüleme", "İlan vurgulama", "Başvuru raporları"]
  },
  {
    name: "Lokal Paket",
    description: "Belirli bölgelere özel yerel reklam paketi",
    price: 399,
    duration: 14,
    impressions: 8000,
    clicks: 200,
    features: ["Bölgesel hedefleme", "14 gün görüntüleme", "Lokal raporlama", "Google Maps entegrasyonu"]
  },
  {
    name: "Flash Paket",
    description: "Kısa süreli yoğun kampanyalar için",
    price: 199,
    duration: 3,
    impressions: 3000,
    clicks: 50,
    features: ["Hızlı başlangıç", "3 gün görüntüleme", "Anlık raporlama", "Acil durum desteği"]
  },
  {
    name: "Süper Flash Paket",
    description: "Hafta sonu özel kampanyalar için ideal",
    price: 299,
    duration: 2,
    impressions: 4000,
    clicks: 80,
    features: ["Hafta sonu gösterim", "2 gün görüntüleme", "Anlık raporlama", "Özel tasarım"]
  },
  {
    name: "Enterprise Paket",
    description: "Kurumsal firmalar için özel çözüm",
    price: 4999,
    duration: 90,
    impressions: 500000,
    clicks: 10000,
    features: ["Kurumsal hedefleme", "90 gün görüntüleme", "Enterprise raporlama", "Özel danışman", "API erişimi", "Öncelikli destek"]
  }
];

async function createAdPackages() {
  try {
    console.log("Reklam paketleri oluşturuluyor...");
    
    // Önceki paketleri temizle
    await AdPackage.deleteMany({});
    console.log("Eski paketler temizlendi");
    
    // Yeni paketleri oluştur
    const createdPackages = await AdPackage.insertMany(adPackages);
    console.log(`${createdPackages.length} reklam paketi oluşturuldu`);
    
    createdPackages.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name} - ${pkg.price} TL`);
    });
    
    console.log("Reklam paketleri başarıyla oluşturuldu!");
    process.exit(0);
  } catch (error) {
    console.error("Hata:", error);
    process.exit(1);
  }
}

createAdPackages();
