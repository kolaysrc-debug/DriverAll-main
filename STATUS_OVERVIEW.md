# DriverAll Status Overview

Bu dosya, dağınık duran TODO / reminder / log bilgisini tek yerde toplamak için oluşturuldu.

## CURRENT CONTEXT (tek kaynak) — buradan devam

Bu repo ile ilgili sohbet/bağlam kaybolursa (Windsurf kapanınca vs.) **önce bu bölümü oku** ve devam et.

### Şu an ne yapıyoruz?

- Aktif ekran/akış: **Admin Tasks**
  - Route: `/admin/tasks`
  - Amaç: Talimatları/görevleri kalıcı şekilde burada takip etmek (dev yaptı / admin test / ok-not ok / status).

### Resume checklist (sabah/yeniden açınca)

1) Mongo çalışıyor mu?
2) Backend ayakta mı?
   - `GET http://127.0.0.1:3001/api/health`
3) Frontend ayakta mı?
   - `http://localhost:3000`
4) Admin login -> `/admin/tasks`
5) Task listesi gelmiyorsa:
   - DevTools Network: `/api/admin/tasks` status (401/403/500?)

### Windsurf sohbet kaybolursa ne yazmalısın?

- Şu 2 satır yeter:
  - `Mongo ok, backend up, frontend up`
  - `Şu an /admin/tasks açtım, network sonucu: <status>`

### /admin/tasks teknik not

- Frontend: `drivercv-frontend/app/admin/tasks/page.tsx`
- Backend: `drivercv-backend/routes/adminTasks.js`
- Model: `drivercv-backend/models/InstructionTask.js`
- Endpoint admin-only:
  - `GET/POST/PUT /api/admin/tasks` => `requireAuth + requireRoles("admin")`

## Hızlı Linkler

- Görev / talimat ekranı: `/admin/tasks`
- Admin ana sayfa kartı: `Admin > Talimat / Yapılacak Takibi`
- Frontend build doğrulama komutu:
  - `drivercv-frontend` içinde `npm run build`

## Şu an en güncel durum

- Frontend production build: `geçiyor`
- Build blocker zinciri: `temizlendi`
- Next 16 `useSearchParams` / prerender blokları: `temizlendi`
- Admin subusers aksiyon akışları: `bağlandı`
- Admin branches runtime crash: `düzeltildi`
- Advertiser ads edit API hizası: `düzeltildi`

## Bu oturumda kapanan kritik hedefler

### Tamamlandı

- [x] Advertiser ads edit sayfasındaki eksik API export/import build hatası düzeltildi.
- [x] Admin branches sayfasındaki `manager/name` null crash düzeltildi.
- [x] Admin subusers sayfasına null-safety ve production-safe stil düzeltmeleri eklendi.
- [x] Admin subusers aksiyonları çalışan akışlara bağlandı:
  - Düzenle
  - Yetkiler
  - Şube Ata
  - Şifre Sıfırla
  - Onayla
  - Aktif/Pasif Yap
- [x] Employer applications jobs boş modül build hatası kapatıldı.
- [x] `RoleGate` prop adı uyumsuzlukları (`allowedRoles` -> `allowRoles`) düzeltildi.
- [x] `admin/jobs/new` içindeki olmayan tip import’u düzeltildi.
- [x] `admin/unified-engine-test` API tipi / payload hizası düzeltildi.
- [x] `RuleManagerForm` implicit `any` hatası düzeltildi.
- [x] `lib/api/applications.ts` header tipi düzeltildi.
- [x] Next 16 prerender için `Suspense` uyumları eklendi.
- [x] Frontend build tekrar çalıştırıldı ve başarıyla geçti.

### Doğrulandı

- [x] `drivercv-frontend` içinde `npm run build` başarılı.
- [x] Route üretimi tamamlandı.
- [x] TypeScript aşaması geçti.
- [x] Page data / static generation aşaması geçti.

## Bu iş için değişen ana dosyalar

### Frontend

- `drivercv-frontend/lib/api/ads.ts`
- `drivercv-frontend/app/admin/branches/page.tsx`
- `drivercv-frontend/app/admin/subusers/page.tsx`
- `drivercv-frontend/app/employer/applications/jobs/page.tsx`
- `drivercv-frontend/app/account/page.tsx`
- `drivercv-frontend/components/AdvertiserOnly.tsx`
- `drivercv-frontend/app/admin/jobs/new/page.tsx`
- `drivercv-frontend/app/admin/unified-engine-test/page.tsx`
- `drivercv-frontend/components/RuleManagerForm.tsx`
- `drivercv-frontend/lib/api/applications.ts`
- `drivercv-frontend/app/login/page.tsx`
- `drivercv-frontend/app/register/auth/page.tsx`
- `drivercv-frontend/app/auth/callback/page.tsx`
- `drivercv-frontend/app/jobs/page.tsx`
- `drivercv-frontend/app/page.tsx`
- `drivercv-frontend/app/admin/groups/page.tsx`
- `drivercv-frontend/app/admin/fields/page.tsx`
- `drivercv-frontend/app/advertiser/ad-requests/new/page.tsx`

### Backend

- `drivercv-backend/routes/subUsers.js`

## Kısa runtime smoke-check

### Auth

- [ ] `/`
  - Login/register görünümü açılıyor mu?
- [ ] `/login`
  - `/register/auth` yönlendirmesi çalışıyor mu?
- [ ] `/register/auth`
  - Email ile giriş/kayıt akışı çalışıyor mu?
- [ ] `/auth/callback`
  - Token ile yönlendirme bozulmadan tamamlanıyor mu?

### Admin kritik ekranlar

- [ ] `/admin/branches`
  - Eksik manager / parentUser verisinde crash yok mu?
- [ ] `/admin/subusers`
  - Liste açılıyor mu?
  - Eksik rol / parent / branch verisinde render bozulmuyor mu?
  - Buton akışları çalışıyor mu?
- [ ] `/admin/groups`
  - Sayfa query param ile açılırken hata vermiyor mu?
- [ ] `/admin/fields`
  - Draft restore / createdGroupKey akışları bozulmadı mı?
- [ ] `/admin/unified-engine-test`
  - Edit save çağrıları hata atmıyor mu?

### Employer / Advertiser

- [ ] `/employer/applications/jobs`
  - Redirect çalışıyor mu?
- [ ] `/advertiser/ads/[id]`
  - Reklam edit ekranı açılıyor ve kaydediyor mu?
- [ ] `/advertiser/ad-requests/new?adId=...`
  - `adId` prefill geliyor mu?

### Jobs / Public

- [ ] `/jobs`
  - Query param ile açılışta hata yok mu?
- [ ] `/jobs/[id]`
  - Detay sayfası açılıyor mu?

## Hâlâ açık / sonraki mantıklı işler

- [ ] Admin UI genel stabilizasyonu:
  - Tüm admin fetch çağrılarını ortak `apiFetch/authHeaders` standardına toplamak
- [ ] E2E satın alma akışı audit:
  - Package -> Order -> Admin orders
- [ ] E2E ilan yayınlama/onay akışı audit:
  - Employer job create -> request -> admin approve -> publish + credit decrement
- [ ] E2E reklam akışı audit:
  - Package -> Order -> AdRequest -> admin approve -> AdCampaign + credit decrement
- [ ] Aday profili / dynamic fields eksik akışlarını tamamlama

## Eski ama hâlâ referans alınabilecek dosyalar

- `TODO.md`
- `PROJECT_TODO.md`
- `REMINDER_next_session.md`
- `LOGS_checklist_next_session.md`
- `handoff/latest.md`

## Not

Yapılacakları yazmak için hazırladığımız sayfa büyük olasılıkla:

- **Route:** `/admin/tasks`
- **Menü adı:** `Talimat / Yapılacak Takibi`

Bu ekrana gidip yeni görevleri doğrudan kaydedebilirsin.
