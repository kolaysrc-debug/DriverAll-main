// PATH: drivercv-backend/scripts/seedAdmin.js
// ----------------------------------------------------------
// Dev helper: seed an initial Admin user.
// Usage:
//   MONGO_URI="mongodb://127.0.0.1:27017/driverall_dev" \
//   DEFAULT_ADMIN_EMAIL="admin@driverall.local" \
//   DEFAULT_ADMIN_PASSWORD="Admin123!" \
//   node scripts/seedAdmin.js
// ----------------------------------------------------------

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function main() {
  const MONGO_URI =
    process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/driverall";

  const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production";

  const email = (process.env.DEFAULT_ADMIN_EMAIL || "admin@driverall.local").trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "Admin123!";
  const name = process.env.DEFAULT_ADMIN_NAME || "DriverAll Admin";
  const phoneEnv = String(process.env.DEFAULT_ADMIN_PHONE || "").trim();
  const reset = String(process.env.RESET_ADMIN || "").toLowerCase() === "true";

  // Production'da env zorunlu — hardcoded şifre ile admin oluşturmayı engelle
  if (isProd) {
    if (!process.env.DEFAULT_ADMIN_EMAIL || !process.env.DEFAULT_ADMIN_PASSWORD) {
      console.error("[seedAdmin] HATA: Production modda DEFAULT_ADMIN_EMAIL ve DEFAULT_ADMIN_PASSWORD env zorunludur.");
      process.exit(1);
    }
    if (password.length < 8) {
      console.error("[seedAdmin] HATA: Production şifre en az 8 karakter olmalı.");
      process.exit(1);
    }
  }

  const fallbackPhone = `+90${String(Date.now()).slice(-10)}`;
  const phone = phoneEnv || fallbackPhone;

  await mongoose.connect(MONGO_URI);
  console.log("[seedAdmin] Connected:", MONGO_URI);

  const exists = await User.findOne({ email });
  if (exists) {
    if (!reset) {
      console.log("[seedAdmin] Admin already exists:", email);
      await mongoose.disconnect();
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    exists.name = name;
    exists.passwordHash = hashed;
    if (!String(exists.phone || "").trim()) exists.phone = phone;
    exists.role = "admin";
    exists.isActive = true;
    exists.isApproved = true;
    await exists.save();

    console.log("[seedAdmin] Admin reset:", email);
    console.log("[seedAdmin] Password:", password);
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email,
    phone,
    passwordHash: hashed,
    role: "admin",
    isActive: true,
    isApproved: true,
  });

  console.log("[seedAdmin] Admin created:", email);
  console.log("[seedAdmin] Password:", password);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[seedAdmin] Error:", err);
  process.exit(1);
});
