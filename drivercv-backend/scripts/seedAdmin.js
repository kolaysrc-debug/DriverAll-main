// PATH: drivercv-backend/scripts/seedAdmin.js
// ----------------------------------------------------------
// Dev helper: seed an initial Admin user.
// Usage:
//   MONGO_URI="mongodb://127.0.0.1:27017/driverall" \
//   DEFAULT_ADMIN_EMAIL="admin@driverall.local" \
//   DEFAULT_ADMIN_PASSWORD="Admin123!" \
//   node scripts/seedAdmin.js
// ----------------------------------------------------------

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function main() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/driverall";

  const email = (process.env.DEFAULT_ADMIN_EMAIL || "admin@driverall.local").trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "Admin123!";
  const name = process.env.DEFAULT_ADMIN_NAME || "DriverAll Admin";

  await mongoose.connect(MONGO_URI);
  console.log("[seedAdmin] Connected:", MONGO_URI);

  const exists = await User.findOne({ email });
  if (exists) {
    console.log("[seedAdmin] Admin already exists:", email);
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email,
    password: hashed,
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
