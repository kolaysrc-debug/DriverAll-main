/**
 * Admin token üretici.
 * - DB'de admin kullanıcı varsa onun token'ını üretir.
 * - Yoksa test@test.com kullanıcısını admin'e yükseltir (veya yeni admin oluşturur).
 * - Token'ı admin_token.local.txt dosyasına yazar.
 *
 * Kullanım: node scripts/genAdminToken.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const User = require("../models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/driverall";
const JWT_SECRET = process.env.JWT_SECRET || "dev-driverall-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";
const TOKEN_FILE = path.join(__dirname, "..", "admin_token.local.txt");

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected:", MONGO_URI);

    // 1) Admin kullanıcı var mı?
    let admin = await User.findOne({ role: "admin", isActive: true });

    if (!admin) {
      console.log("Admin kullanıcı bulunamadı. test@test.com admin'e yükseltiliyor...");
      admin = await User.findOne({ email: "test@test.com" });
      if (admin) {
        admin.role = "admin";
        await admin.save();
        console.log("test@test.com -> admin olarak güncellendi.");
      } else {
        // Hiç kullanıcı yoksa yeni admin oluştur
        admin = await User.create({
          name: "Admin",
          email: "admin@driverall.local",
          role: "admin",
          isActive: true,
        });
        console.log("Yeni admin oluşturuldu: admin@driverall.local");
      }
    } else {
      console.log("Admin bulundu:", admin.email, admin._id);
    }

    // 2) Token üret
    const token = jwt.sign(
      { userId: admin._id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 3) Dosyaya yaz
    fs.writeFileSync(TOKEN_FILE, token, "utf8");
    console.log("Token yazıldı:", TOKEN_FILE);
    console.log("Token len:", token.length);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("HATA:", err.message);
    process.exit(1);
  }
})();
