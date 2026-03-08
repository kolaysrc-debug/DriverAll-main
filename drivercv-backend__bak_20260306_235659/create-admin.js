// Admin kullanıcı oluşturma scripti
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User model'i (backend'deki gibi)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ["driver", "employer", "advertiser", "admin", "company"],
    default: "driver",
    index: true,
  },
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: true },
  notes: { type: String, default: "" },
}, { timestamps: true });

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model("User", userSchema);

async function createAdmin() {
  try {
    // MongoDB bağlantısı
    require("dotenv").config();
    const MONGO_URI =
      process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/driverall";

    await mongoose.connect(MONGO_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Admin kullanıcısı var mı kontrol et
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin kullanıcısı zaten var:', existingAdmin.email);
      await mongoose.connection.close();
      return;
    }

    // Şifre hash'le
    const password = 'admin123'; // Basit şifre
    const passwordHash = await bcrypt.hash(password, 10);

    // Admin kullanıcı oluştur
    const admin = new User({
      name: 'Admin User',
      email: 'admin@driverall.com',
      passwordHash: passwordHash,
      role: 'admin',
      isActive: true,
      isApproved: true,
    });

    await admin.save();
    console.log('✅ Admin kullanıcısı oluşturuldu:');
    console.log('📧 Email: admin@driverall.com');
    console.log('🔑 Şifre: admin123');
    console.log('');
    console.log('⚠️  Lütfen şifreyi daha sonra değiştirin!');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

createAdmin();
