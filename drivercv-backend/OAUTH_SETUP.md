# OAuth Sosyal Giriş Kurulumu

Bu dokümantasyon Google, Apple, Microsoft ve Yandex ile sosyal giriş yapabilmek için gerekli ayarları içerir.

## 🔑 Gerekli Environment Variables

`.env` dosyanıza aşağıdaki değişkenleri ekleyin:

```env
# Frontend URL (OAuth callback için)
FRONTEND_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Apple OAuth
APPLE_CLIENT_ID=your-apple-service-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=./config/AuthKey_XXXXX.p8
APPLE_CALLBACK_URL=http://localhost:3001/api/auth/apple/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:3001/api/auth/microsoft/callback

# Yandex OAuth
YANDEX_CLIENT_ID=your-yandex-client-id
YANDEX_CLIENT_SECRET=your-yandex-client-secret
YANDEX_CALLBACK_URL=http://localhost:3001/api/auth/yandex/callback
```

## 📱 Platform Kurulumları

### 1. Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → API & Services → Credentials
2. "Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: "Web application"
4. Authorized redirect URIs:
   - Development: `http://localhost:3001/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
5. Client ID ve Client Secret'i kopyalayın

### 2. Apple Sign In

1. [Apple Developer](https://developer.apple.com/) → Certificates, Identifiers & Profiles
2. Identifiers → "+" → App IDs → Register
3. Services IDs → "+" → Create Service ID
4. Sign In with Apple → Configure
5. Return URLs:
   - Development: `http://localhost:3001/api/auth/apple/callback`
   - Production: `https://yourdomain.com/api/auth/apple/callback`
6. Keys → "+" → Create Key → Enable "Sign in with Apple"
7. Download `.p8` key file → `config/AuthKey_XXXXX.p8` klasörüne kaydedin

### 3. Microsoft OAuth

1. [Azure Portal](https://portal.azure.com/) → Azure Active Directory → App registrations
2. "New registration"
3. Redirect URI: `http://localhost:3001/api/auth/microsoft/callback`
4. Certificates & secrets → New client secret
5. Application (client) ID ve Client secret'i kopyalayın

### 4. Yandex OAuth

1. [Yandex OAuth](https://oauth.yandex.com/) → Create App
2. Platforms → Web services
3. Callback URI: `http://localhost:3001/api/auth/yandex/callback`
4. Permissions: `login:email`, `login:info`
5. Client ID ve Client secret'i kopyalayın

## 🚀 Kullanım

Backend başlatıldıktan sonra OAuth endpoint'leri:

- Google: `GET /api/auth/google`
- Apple: `GET /api/auth/apple`
- Microsoft: `GET /api/auth/microsoft`
- Yandex: `GET /api/auth/yandex`

Callback endpoint'leri otomatik olarak token oluşturup frontend'e redirect eder:
`http://localhost:3000/auth/callback?token=JWT_TOKEN&provider=google`

## 📝 Notlar

- Tüm OAuth provider'lar opsiyoneldir. Credential yoksa o provider devre dışı kalır.
- Production'da HTTPS kullanılmalıdır.
- Apple Sign In iOS uygulaması için zorunludur (App Store kuralı).
- Yandex Rusya ve Türki Cumhuriyetler için popülerdir.
