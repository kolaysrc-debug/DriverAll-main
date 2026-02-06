// DriverAll-main/drivercv-backend/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err.stack);
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} zaten sistemde kayıtlı`,
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Doğrulama hatası',
      errors
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token süresi dolmuş'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Sunucu hatası',
    error: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;