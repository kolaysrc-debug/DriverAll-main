# DriverAll — Environment Variables

## Backend (`drivercv-backend/.env`)

```bash
# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/driverall

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=30d

# Server
PORT=3001

# CORS (virgülle ayrılmış origin listesi)
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate Limiting (dakikada istek sayısı)
RATE_LIMIT_RPM=200
AUTH_RATE_LIMIT_RPM=15

# SMTP (Email bildirimleri)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=DriverAll <noreply@driverall.com>

# OTP (Twilio Verify)
OTP_SECRETS_MASTER_KEY=your-master-key-min-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Yandex OAuth
YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
YANDEX_CALLBACK_URL=http://localhost:3001/api/auth/yandex/callback

# Frontend URL (OAuth callback redirect)
FRONTEND_URL=http://localhost:3000
```

## Frontend (`drivercv-frontend/.env.local`)

```bash
# Backend API base (next.config.ts rewrite hedefi)
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
```

## Production Notları

- `JWT_SECRET` mutlaka güçlü bir secret olmalı (min 32 karakter)
- `CORS_ORIGINS` production domain'inizi ekleyin
- `SMTP_PASS` Gmail için App Password kullanın (2FA aktif olmalı)
- OAuth callback URL'lerini production domain'e güncelleyin
- `OTP_SECRETS_MASTER_KEY` en az 32 karakter olmalı
