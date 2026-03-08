// PATH: DriverAll-main/drivercv-backend/create-more-users.js
// ----------------------------------------------------------
// 10 tane örnek kullanıcı oluştur (driver, employer, advertiser)
// ----------------------------------------------------------

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

require("dotenv").config();

// MongoDB bağlantısı
const MONGO_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/driverall";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Model (basit versiyon)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ["admin", "driver", "employer", "advertiser"] },
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: true },
  phone: { type: String },
  city: { type: String },
  district: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

// Örnek kullanıcılar
const users = [
  // Sürücüler
  {
    name: "Ahmet Yılmaz",
    email: "ahmet.yilmaz@driverall.com",
    password: "driver123",
    role: "driver",
    phone: "05321234567",
    city: "İstanbul",
    district: "Kadıköy"
  },
  {
    name: "Mehmet Kaya",
    email: "mehmet.kaya@driverall.com",
    password: "driver123",
    role: "driver",
    phone: "05321234568",
    city: "Ankara",
    district: "Çankaya"
  },
  {
    name: "Ali Demir",
    email: "ali.demir@driverall.com",
    password: "driver123",
    role: "driver",
    phone: "05321234569",
    city: "İzmir",
    district: "Bornova"
  },
  {
    name: "Mustafa Çelik",
    email: "mustafa.celik@driverall.com",
    password: "driver123",
    role: "driver",
    phone: "05321234570",
    city: "Bursa",
    district: "Nilüfer"
  },
  
  // İşverenler
  {
    name: "Hızlı Lojistik",
    email: "hizli.lojistik@driverall.com",
    password: "password123",
    role: "employer",
    phone: "02123456789",
    city: "İstanbul",
    district: "Şişli"
  },
  {
    name: "Global Transport",
    email: "global.transport@driverall.com",
    password: "password123",
    role: "employer",
    phone: "02123456790",
    city: "İstanbul",
    district: "Levent"
  },
  {
    name: "Ankara Nakliyat",
    email: "ankara.nakliyat@driverall.com",
    password: "password123",
    role: "employer",
    phone: "03123456789",
    city: "Ankara",
    district: "Yenimahalle"
  },
  {
    name: "Ege Taşımacılık",
    email: "ege.tasimacilik@driverall.com",
    password: "password123",
    role: "employer",
    phone: "02323456789",
    city: "İzmir",
    district: "Konak"
  },
  
  // Reklam verenler
  {
    name: "Reklam Firması A",
    email: "reklam.a@driverall.com",
    password: "password123",
    role: "advertiser",
    phone: "02123456791",
    city: "İstanbul",
    district: "Beşiktaş"
  },
  {
    name: "Reklam Firması B",
    email: "reklam.b@driverall.com",
    password: "password123",
    role: "advertiser",
    phone: "02123456792",
    city: "Ankara",
    district: "Kızılay"
  }
];

async function createUsers() {
  try {
    console.log("Kullanıcılar oluşturuluyor...");
    
    // Önceki kullanıcıları temizle (admin hariç)
    await User.deleteMany({ email: { $ne: "admin@driverall.com" } });
    console.log("Eski kullanıcılar temizlendi (admin hariç)");
    
    // Şifreleri hash'le
    const salt = await bcrypt.genSalt(10);
    
    for (let user of users) {
      user.passwordHash = await bcrypt.hash(user.password, salt);
      delete user.password; // plaintext password'ı sil
    }
    
    // Yeni kullanıcıları oluştur
    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} kullanıcı oluşturuldu`);
    
    createdUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.role}) - ${user.email}`);
    });
    
    console.log("Kullanıcılar başarıyla oluşturuldu!");
    process.exit(0);
  } catch (error) {
    console.error("Hata:", error);
    process.exit(1);
  }
}

createUsers();
