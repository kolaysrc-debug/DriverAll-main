# Logs / Checklist for Next Session

## Quick health checks (copy/paste)

### 1) Backend health + DB name

- URL:
  - `http://127.0.0.1:3001/api/health`
- Expect:
  - `mongo.name = driverall`

PowerShell:

```powershell
Invoke-RestMethod -Method GET -Uri "http://127.0.0.1:3001/api/health" | Select-Object -ExpandProperty mongo
```

### 2) Profile-scoped filters payload

- URL:
  - `http://127.0.0.1:3001/api/jobs/filters?country=TR&scope=profile`
- Expect:
  - `success: true`
  - `groups` length > 0

PowerShell:

```powershell
$r = Invoke-RestMethod -Method GET -Uri "http://127.0.0.1:3001/api/jobs/filters?country=TR&scope=profile"
$r.groups | Select-Object -First 30 groupKey,groupLabel,country,active
```

### 3) Passport/Visa fields exist (no auth required in current setup)

- URL:
  - `http://127.0.0.1:3001/api/admin/fields?activeOnly=true`
- Expect keys:
  - `PASSPORT_TYPE_TR`
  - `VISA_TYPES`

PowerShell:

```powershell
$x = Invoke-RestMethod -Method GET -Uri "http://127.0.0.1:3001/api/admin/fields?activeOnly=true"
$x.fields | Where-Object { $_.key -in @('PASSPORT_TYPE_TR','VISA_TYPES') } | Select-Object key,label,category,country,active,showInCv,uiType,optionsGroupKey
```

## Known running commands

- Backend (dev):
  - `drivercv-backend`: `npm run dev`
- Frontend (dev):
  - `drivercv-frontend`: `npm run dev`

## OTP / Twilio quick checks (copy/paste)

### 4) Mongo after reboot (Windows)

- If backend returns `503` / DB unavailable or health fails after PC reboot:
  - `services.msc` -> `MongoDB` / `MongoDB Server (MongoDB)` -> Start
  - Set Startup type: `Automatic`

### 5) Backend health (port)

PowerShell:

```powershell
Invoke-RestMethod -Method GET -Uri "http://127.0.0.1:3001/api/health" | Select-Object -ExpandProperty mongo
```

### 6) Admin login -> JWT token

PowerShell:

```powershell
$base = "http://127.0.0.1:3001"
$loginBody = @{ email = "admin@driverall.com"; password = "123456" } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Method POST -Uri "$base/api/auth/login" -ContentType "application/json" -Body $loginBody
$token = $loginRes.token
$token
```

### 7) Save Twilio Verify credentials to DB (authToken prompt)

- Requires `.env`:
  - `OTP_SECRETS_MASTER_KEY` (>= 32 chars)

PowerShell:

```powershell
$base = "http://127.0.0.1:3001"
$headers = @{ Authorization = "Bearer $token" }

$accountSid = "AC00abbd8f74734ee9164062d909eb4de1"
$verifyServiceSid = "VA39379feb8ab2c04845dc3082e34a9f6a"

$secureTok = Read-Host "Twilio Auth Token" -AsSecureString
$authToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureTok))

$credBody = @{
  providerKey = "twilioVerify"
  ref = "default"
  accountSid = $accountSid
  verifyServiceSid = $verifyServiceSid
  authToken = $authToken
  isActive = $true
} | ConvertTo-Json

Invoke-RestMethod -Method PUT -Uri "$base/api/admin/otp-credentials" -Headers $headers -ContentType "application/json" -Body $credBody | ConvertTo-Json -Depth 6
```

### 8) OTP request / verify smoke test

PowerShell:

```powershell
$base = "http://127.0.0.1:3001"

$otpReq = @{ phone = "+905323047271"; channel = "sms" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "$base/api/auth/otp/request" -ContentType "application/json" -Body $otpReq | ConvertTo-Json -Depth 6

$code = Read-Host "Gelen OTP kodu"
$otpVer = @{ phone = "+905323047271"; code = $code } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "$base/api/auth/otp/verify" -ContentType "application/json" -Body $otpVer | ConvertTo-Json -Depth 6
```

## Notes

- CV UI hides `VISA_TYPES` until `PASSPORT_TYPE_TR` is filled (field meta visibility).
- If default fields ever “come back”, re-check `DeletedDefaultField` tombstone logic and whether the deletion path is writing tombstones.

---

## 📅 Session Log: 8 Mart 2026

### ✅ Tamamlanan Özellikler

#### 1. OAuth Entegrasyonları
- **Google OAuth**: Çalışıyor ve test edildi
- **Yandex OAuth**: Çalışıyor (email yoksa telefon numarasından email oluşturuyor: `905323047271@yandex.temp`)
- **Apple OAuth**: Altyapı hazır (Apple Developer hesabı gerektiğinde credential eklenecek)
- **Microsoft OAuth**: Altyapı hazır (şimdilik atlandı)

**Backend Dosyalar:**
- `drivercv-backend/config/passport.js` - OAuth stratejileri
- `drivercv-backend/routes/authOAuth.js` - OAuth route'ları
- `drivercv-backend/OAUTH_SETUP.md` - Kurulum dokümantasyonu

**Frontend Dosyalar:**
- `drivercv-frontend/app/auth/callback/page.tsx` - OAuth callback handler
- `drivercv-frontend/app/register/auth/page.tsx` - Social login butonları

**Environment Variables (.env):**
```
GOOGLE_CLIENT_ID=1034561161406-gjrjk7thltkqit14p566oamkem8cpp81.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

YANDEX_CLIENT_ID=06cb8f1abccc460cb813631b6580fbe1
YANDEX_CLIENT_SECRET=4d57ef98c8534835babd20b220c0cd6e
YANDEX_CALLBACK_URL=http://localhost:3001/api/auth/yandex/callback

FRONTEND_URL=http://localhost:3000
```

#### 2. Belge Bitiş Tarihi Sistemi
- Her belge kendi alınış ve bitiş tarihini gösteriyor
- Grup başlığında ana belgenin bitiş tarihi
- Bağımlılık kuralları tamamen organik (FieldGroup motorundan)

#### 3. Notification (Uyarı) Sistemi
- Admin panelinde belge bitişi takip ayarları
- X gün/ay önce uyarı başlasın
- Tekrar sıklığı ayarlanabilir

#### 4. Bug Düzeltmeleri
- **Logout Bug**: Tarayıcı geçmişinde geri/ileri gidildiğinde auth state kontrol ediliyor (`popstate` event listener)
- **Phone Index**: MongoDB phone field unique index sorunu çözüldü (partial filter expression ile sadece string değerler unique)
- **User Model**: `passwordHash` optional, OAuth için `authProvider`, `authProviderId`, `emailVerified` eklendi

### 🔧 Teknik Detaylar

**MongoDB Index Düzeltmesi:**
```javascript
// Phone index - sadece string değerler unique
collection.createIndex(
  { phone: 1 }, 
  { unique: true, partialFilterExpression: { phone: { $type: "string" } } }
);
```

**OAuth Callback Flow:**
1. User clicks social login button → Backend OAuth route
2. User authenticates with provider → Provider redirects to backend callback
3. Backend generates JWT → Redirects to frontend `/auth/callback?token=...&provider=...`
4. Frontend stores token in localStorage → Redirects to `/profile`

### 📦 Commit Bilgileri

**Commit Message:**
```
feat: OAuth integration (Google, Yandex) + Document expiry system + Notification system + Logout bug fix

- Added Google OAuth authentication with Passport.js
- Added Yandex OAuth authentication (supports phone-based email generation)
- Apple OAuth infrastructure ready (requires Apple Developer account)
- Implemented document expiry tracking system with date calculations
- Added notification system for document expiry alerts in admin panel
- Fixed logout bug: auth state now updates on browser back/forward navigation
- Added OAuth callback page for token handling and user redirection
- Updated User model to support OAuth providers
- Fixed phone field unique index issue with partial filter expression
- Social login buttons added to auth page
```

**Değişen Dosya Sayısı:** 302 dosya

### 🧪 Test Notları

**Google OAuth:**
- Test kullanıcı: `hgdurmus@gmail.com` - Başarılı
- Test kullanıcı: `kolaysrc@gmail.com` - Başarılı

**Yandex OAuth:**
- Test kullanıcı: Yandex hesabı (email yok, telefon kullanıldı) - Başarılı
- Email yoksa telefon numarasından email oluşturuluyor: `{phone}@yandex.temp`

**Logout:**
- Çıkış yap → Geri git → Auth state doğru güncelleniyor ✅

### 📝 Sonraki Adımlar

1. **Apple OAuth**: Apple Developer hesabı açılınca credential'lar eklenecek
2. **Microsoft OAuth**: İhtiyaç olursa kurulum tamamlanacak
3. **OAuth Test**: Farklı kullanıcılarla daha fazla test
4. **Production**: OAuth callback URL'lerini production domain'e güncellemek gerekecek
