// middleware/admin.js
module.exports = (req, res, next) => {
  // auth middleware'den gelen req.user veya req.user.role'i kullanıyoruz
  const user = req.user || {};

  if (user.role !== "admin") {
    return res.status(403).json({ message: "Bu işlem için yetkiniz yok." });
  }

  next();
};
    