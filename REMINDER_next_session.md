# Next Session Reminder (2026-02-23)

## What we fixed today

- Fixed CV screen pulling job/legacy groups by adding a scope filter to `GET /api/jobs/filters`.
  - Backend: `drivercv-backend/routes/jobs.js`
    - Added `scope` query param (`profile` | `job`).
    - FieldDefinition filter by `category` when `scope` is provided.
    - FieldGroup filter by `domain` when `scope` is provided, but still includes legacy groups where `domain` is missing/empty.
  - Frontend: `drivercv-frontend/components/CandidateProfileCvEditor.tsx`
    - CV now requests `.../api/jobs/filters?...&scope=profile`.

- Stabilized MongoDB database usage to stop “weekly rollback” (driverall_dev vs driverall drift).
  - Backend default DB changed to `driverall`.
    - File: `drivercv-backend/server.js`
      - Default `MONGO_URI` fallback is now `mongodb://127.0.0.1:27017/driverall`.
      - Added `DeletedDefaultField` import so tombstone logic works (default fields shouldn’t come back after deletion).
  - Docker compose DB name aligned.
    - File: `drivercv-backend/docker-compose.yml`
      - `MONGO_URI` now targets `/driverall` (was `/driverall_dev`).
  - Seed/utility scripts default DB aligned to `driverall` (so running scripts without env still writes to the same DB as backend).

- Seeded Passport/Visa options + fields into the correct DB (`driverall`).
  - `node scripts/seedPassportVisaOptions.js`
  - `node scripts/seedPassportVisaFields.js`
  - Verified via admin fields endpoint that keys exist:
    - `PASSPORT_TYPE_TR`
    - `VISA_TYPES`

## Current confirmed runtime state

- Backend health check confirms DB:
  - `GET http://127.0.0.1:3001/api/health` -> `mongo.name = driverall`

## Next session: first things to check (in order)

1) Backend is running and connected to the correct DB

- Run:
  - `GET http://127.0.0.1:3001/api/health`
- Expect:
  - `mongo.name: driverall`

2) CV filters endpoint returns profile groups

- Run:
  - `GET http://127.0.0.1:3001/api/jobs/filters?country=TR&scope=profile`
- Expect:
  - Non-empty `groups`.

3) Passport/Visa still present

- Admin list endpoint (no auth in current dev setup):
  - `GET http://127.0.0.1:3001/api/admin/fields?activeOnly=true`
- Expect `PASSPORT_TYPE_TR` and `VISA_TYPES` included.

## Known notes / gotchas

- `VISA_TYPES` UI visibility depends on `PASSPORT_TYPE_TR` because of `meta.visibility.dependsOnKey`.
- CV field rendering source is primarily `GET /api/cv-profile/me` (auth required) with a legacy fallback to `/api/fields`.

## OTP / Phone-first auth (new)

- SMS yerine WhatsApp/SMS OTP motoru eklendi (Twilio Verify ile başlayacak).
- Backend port çakışmaları var:
  - 3001 ve 3002 dolu olduğu için backend şu an 3003 ile çalıştırılıyor.
- Yeni endpointler:
  - `POST /api/auth/otp/request`
  - `POST /api/auth/otp/verify`
  - Admin config: `GET/PUT /api/admin/otp-config`
  - Admin credentials: `GET/PUT /api/admin/otp-credentials` (JWT + admin role)

### Twilio credentials (artık DB üzerinden)

- Twilio Verify bilgileri env yerine **DB’ye** admin endpoint ile kaydediliyor.
- Gerekli master key (gitignore `.env` içine):
  - `OTP_SECRETS_MASTER_KEY` (en az 32 karakter)

Not:
- Twilio `Auth Token` chate yazma; PowerShell `Read-Host -AsSecureString` ile gir.

### Backend port notu

- Son durumda backend 3001 üzerinden doğrulandı:
  - `GET http://127.0.0.1:3001/api/health` -> `200`
- Port boşsa istenirse `PORT=3003` ile de çalıştırılabilir; ama health/endpoint kontrollerinde doğru portu kullan.

### Smoke test (PowerShell)

- OTP gönder:
  - `Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:3001/api/auth/otp/request" -ContentType "application/json" -Body '{"phone":"+905555555555","channel":"sms"}' | ConvertTo-Json -Depth 10`

- OTP doğrula:
  - `Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:3001/api/auth/otp/verify" -ContentType "application/json" -Body '{"phone":"+905555555555","code":"123456"}' | ConvertTo-Json -Depth 10`

### PowerShell gotcha: curl

- PowerShell'de `curl` bazen `Invoke-WebRequest` alias’ına çarpıyor.
- HTTP status görmek için şu format güvenilir:
  - `curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3001/api/health`

### Mongo after reboot

- PC tamamen kapanıp açılınca MongoDB bazen stop kalabiliyor.
- Çözüm:
  - `services.msc` -> `MongoDB` / `MongoDB Server (MongoDB)` -> Start
  - Startup type: `Automatic`

## If we need to re-seed passport/visa

- From `drivercv-backend` folder:
  - `node scripts/seedPassportVisaOptions.js`
  - `node scripts/seedPassportVisaFields.js`

## Morning runbook (2026-03-03) — start + smoke test

### 1) Start order (Windows)

1) MongoDB service
- `services.msc` -> `MongoDB` / `MongoDB Server (MongoDB)` -> Start
- Startup type: `Automatic`

2) Backend
- From `drivercv-backend`:
  - `npm start`
- Health:
  - `GET http://127.0.0.1:3001/api/health`

3) Frontend
- From `drivercv-frontend`:
  - `npm run dev`
- UI:
  - `http://localhost:3000`

### 2) OTP smoke test (UI)

- TopBar -> Giriş -> `Telefon (OTP)`
- `Kod Gönder` -> SMS geldi mi
- `Kodu Doğrula` -> token oluştu mu, `/profile` açılıyor mu
- F5 / tarayıcıyı kapat-aç:
  - OTP istemeden girişli kalmalı (token localStorage’da)
- `Çıkış`:
  - Gerçek logout (token silinir) => tekrar girişte OTP istemesi normal

### 3) OTP maliyetini düşüren ayar (backend)

- JWT expiry artık env’den ayarlanıyor:
  - `JWT_EXPIRES_IN` (default: `30d`)
- Uygulandı:
  - `drivercv-backend/routes/auth.js`
  - `drivercv-backend/routes/authOtp.js`
  - `drivercv-backend/routes/subAuth.js`

### 4) Frontend session standardı (önemli)

- Canonical localStorage keys:
  - `driverall_token`
  - `driverall_user`
- `lib/session.ts` legacy fallback içerir:
  - Eski `token/user` varsa otomatik migrate eder.

### 5) Port troubleshooting (kısa)

- Backend port: `3001`
- Frontend port: `3000`
- Eğer Next.js `Port 3000 is in use` derse:
  - 3000’i boşalt (açık `next dev` varsa kapat)
  - Gerekirse PID kill edip tekrar `npm run dev`

## Snapshot / Commit disiplini (2026-03-06)

Amaç: “çalışan iyi noktayı” kaybetmemek ve gereksiz rollback/restore döngüsüne girmemek.

### Ne zaman?

- Her sabah projeyi açınca, **sistem yeşilse** (backend+frontend+mongo + kritik akışlar çalışıyorsa)
- Yeni bir geliştirme / düzeltme sonrası **olumlu bir durum** yakaladığımız anda

### Rutini (kısa)

1) Minimum smoke checks

- `GET http://127.0.0.1:3001/api/health` -> `200`
- UI açılıyor mu: `http://localhost:3000`
- Eğer değişiklik auth/OTP ile ilgiliyse: OTP UI smoke test (varsa)

2) Git kontrol

- `git status` -> beklenen dosyalar dışında sürpriz yok
- `.env` ve `uploads/` kesinlikle commit edilmemeli

3) Commit al

- Mesaj formatı (örnek):
  - `snapshot: 2026-03-06 otp runtime stabilized`
- İsteğe bağlı tag (örnek):
  - `snapshot-2026-03-06`

4) Snapshot Log’a tarih düş

- Aşağıdaki log listesine aynı gün bir satır ekle.

### Snapshot Log (tarihleyerek)

- 2026-03-06: OTP master key + OTP credential yönetimi düzeltmeleri; DB’de decrypt edilemeyen eski Twilio credential pasifleştirildi; Twilio env ile smoke test bekleniyor.
- 2026-03-08: OAuth entegrasyonları (Google, Yandex), Belge bitiş tarihi sistemi, Notification sistemi, Logout bug düzeltildi. 302 dosya commit edildi.
- 2026-03-12: Ana sayfa erişim fix, TopBar navigasyon, employer dashboard paket bilgisi, null safety, resolveRole fix. 13 dosya, commit `ba4641a`.

---

## 📅 8 Mart 2026 (20:00 - 22:07) - OAuth & Document Expiry Session

### ✅ Tamamlanan Özellikler

#### OAuth Entegrasyonları
- **Google OAuth**: Tam çalışıyor
  - Client ID: `1034561161406-gjrjk7thltkqit14p566oamkem8cpp81.apps.googleusercontent.com`
  - Callback: `http://localhost:3001/api/auth/google/callback`
- **Yandex OAuth**: Tam çalışıyor
  - Email yoksa telefon numarasından email oluşturuyor: `{phone}@yandex.temp`
  - Client ID: `06cb8f1abccc460cb813631b6580fbe1`
  - Callback: `http://localhost:3001/api/auth/yandex/callback`
- **Apple OAuth**: Altyapı hazır (Apple Developer hesabı gerekli)
- **Microsoft OAuth**: Altyapı hazır

#### Belge Bitiş Tarihi Sistemi
- Her belge kendi alınış ve bitiş tarihini gösteriyor
- Grup başlığında ana belgenin bitiş tarihi
- Bağımlılık kuralları FieldGroup motorundan geliyor

#### Notification Sistemi
- Admin panelinde belge bitişi takip ayarları
- X gün/ay önce uyarı başlasın
- Tekrar sıklığı ayarlanabilir

#### Bug Düzeltmeleri
- **Logout Bug**: `popstate` event listener ile tarayıcı geçmişinde auth state kontrolü
- **Phone Index**: Partial filter expression ile MongoDB unique index sorunu çözüldü
- **User Model**: OAuth desteği (`authProvider`, `authProviderId`, `emailVerified`)

### 🔧 Kritik Dosyalar

**Backend:**
- `config/passport.js` - OAuth stratejileri
- `routes/authOAuth.js` - OAuth route'ları
- `OAUTH_SETUP.md` - Kurulum dokümantasyonu
- `utils/documentValidity.js` - Belge bitiş tarihi hesaplamaları

**Frontend:**
- `app/auth/callback/page.tsx` - OAuth callback handler
- `app/register/auth/page.tsx` - Social login butonları
- `components/TopBar.tsx` - Logout bug düzeltmesi (popstate)

### 📝 Environment Variables (.env)

```bash
# Google OAuth
GOOGLE_CLIENT_ID=1034561161406-gjrjk7thltkqit14p566oamkem8cpp81.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Yandex OAuth
YANDEX_CLIENT_ID=06cb8f1abccc460cb813631b6580fbe1
YANDEX_CLIENT_SECRET=4d57ef98c8534835babd20b220c0cd6e
YANDEX_CALLBACK_URL=http://localhost:3001/api/auth/yandex/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 🧪 Test Sonuçları

**Google OAuth:**
- ✅ `hgdurmus@gmail.com` - Başarılı
- ✅ `kolaysrc@gmail.com` - Başarılı

**Yandex OAuth:**
- ✅ Yandex hesabı (email yok, telefon kullanıldı) - Başarılı

**Logout:**
- ✅ Çıkış yap → Geri git → Auth state doğru güncelleniyor

### 📦 Commit

**Message:** `feat: OAuth integration (Google, Yandex) + Document expiry system + Notification system + Logout bug fix`

**Değişen Dosyalar:** 302 dosya

### 🔍 Sonraki Adımlar

1. **Apple OAuth**: Apple Developer hesabı açılınca credential eklenecek
2. **Microsoft OAuth**: İhtiyaç olursa kurulum tamamlanacak
3. **Production**: OAuth callback URL'lerini production domain'e güncellemek
