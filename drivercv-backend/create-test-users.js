// Test kullanıcıları oluşturma scripti
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User model
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

async function createTestUsers() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/driverall');
    console.log('MongoDB bağlantısı başarılı');

    // Test kullanıcıları
    const testUsers = [
      {
        name: 'Test Sürücü',
        email: 'driver@test.com',
        password: 'test123',
        role: 'driver',
        isActive: true,
        isApproved: true,
      },
      {
        name: 'Test İşveren',
        email: 'employer@test.com',
        password: 'test123',
        role: 'employer',
        isActive: true,
        isApproved: true,
      },
      {
        name: 'Test Reklamveren',
        email: 'advertiser@test.com',
        password: 'test123',
        role: 'advertiser',
        isActive: true,
        isApproved: true,
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️  ${userData.email} zaten var`);
        continue;
      }

      const passwordHash = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        passwordHash,
      });

      await user.save();
      console.log(`✅ ${userData.role} oluşturuldu: ${userData.email} / ${userData.password}`);
    }

    console.log('\n🎯 Test Kullanıcıları:');
    console.log('📧 Sürücü: driver@test.com / test123');
    console.log('🏢 İşveren: employer@test.com / test123');
    console.log('📢 Reklamveren: advertiser@test.com / test123');
    console.log('👑 Admin: admin@driverall.com / admin123');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

createTestUsers();
