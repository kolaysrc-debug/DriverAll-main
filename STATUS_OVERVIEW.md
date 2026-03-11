# DriverAll — Proje Durum & Kontrol Merkezi

> **Bu dosya AI (Cascade) + insan arasında TEK KAYNAK (single source of truth).**
> Windsurf sohbet/bağlam kaybolursa **önce bu dosyayı oku** ve devam et.
> Son güncelleme: 2026-03-11

---

## 🔁 AI ile Çalışma Protokolü

### Kontrol mekanizmaları (3 katman)

| Katman | Nerede | Ne İşe Yarar |
|--------|--------|--------------|
| **1. Admin Tasks DB** | `/admin/tasks` (InstructionTask modeli) | Kalıcı görev takibi: talimat → dev yaptı → admin test → ok/not_ok |
| **2. Bu dosya (STATUS_OVERVIEW.md)** | Repo kökü | AI bağlam kaybını önler. Proje durumu, açık işler, teknik notlar |
| **3. Cascade todo_list** | Windsurf içi | Oturum bazlı anlık iş takibi (geçici — oturum bitince kaybolur) |

### Oturum başlangıç rutini (sabah / yeni sohbet)

1. `STATUS_OVERVIEW.md` oku → bağlamı al
2. `/admin/tasks` kontrol et → açık görevleri gör
3. Health check: `GET http://127.0.0.1:3001/api/health` → mongo.name = `driverall`
4. Frontend: `http://localhost:3000` açılıyor mu?
5. todo_list güncelle → oturuma başla

### Oturum bitiş rutini

1. Yapılanları `/admin/tasks`'ta işaretle (devDone: true)
2. `STATUS_OVERVIEW.md`'yi güncelle
3. Gerekirse git commit al

### Windsurf sohbet kaybolursa ne yaz?

```
STATUS_OVERVIEW.md'yi oku, oradan devam et.
Mongo ok, backend up, frontend up.
```

---

## 📊 Proje Genel Durumu

### Tamamlanan Büyük Özellikler

- [x] **Auth sistemi**: Email + OTP (Twilio) + Google OAuth + Yandex OAuth
- [x] **Rol sistemi**: admin, employer, advertiser, driver, service_provider
- [x] **CV/Profil motoru**: FieldDefinition + FieldGroup + dinamik profil alanları
- [x] **İlan motoru**: Job CRUD + onay akışı + placement
- [x] **Reklam motoru**: Ad CRUD + AdRequest + AdCampaign + placement
- [x] **Paket motoru**: Package CRUD + PackageOrder + PaymentTransaction + EFT bildirimi
- [x] **Hizmet veren sistemi**: ServiceListing CRUD + dinamik ServiceCategory motoru
- [x] **Admin paneli**: Dashboard + tüm CRUD sayfalar + sidebar navigasyon
- [x] **Belge bitiş tarihi sistemi**: Otomatik hesaplama + notification ayarları
- [x] **Alt kullanıcı/şube sistemi**: SubUser + Branch yönetimi
- [x] **Talimat/görev takibi**: `/admin/tasks` (InstructionTask)

### Build Durumu

- Frontend `npm run build`: ✅ Geçiyor
- TypeScript: ✅ 0 hata
- Backend: ✅ Çalışıyor

---

## 🗺️ Sayfa Haritası (Rol Bazlı)

### Admin (`/admin/*`)
- `/admin/dashboard` — Ana panel + sidebar (tüm linkler burada)
- `/admin/tasks` — Talimat / yapılacak takibi
- `/admin/users` — Kullanıcı yönetimi
- `/admin/subusers` — Alt kullanıcılar
- `/admin/branches` — Şube yönetimi
- `/admin/company-profiles` — Şirket profilleri
- `/admin/packages` — Paket yönetimi
- `/admin/orders` — Sipariş yönetimi
- `/admin/payments` — Ödeme yönetimi
- `/admin/job-approvals` — İlan onayları
- `/admin/job-requests` — İlan talep onayları
- `/admin/ad-requests` — Reklam talepleri
- `/admin/ad-campaigns` — Reklam kampanyaları
- `/admin/placements` — Ad placements
- `/admin/service-categories` — Hizmet kategorileri (yeni)
- `/admin/commit-logs` — Commit izleme / proje geçmişi (yeni)
- `/admin/groups` — Grup motoru
- `/admin/fields` — Alan / eşleme motoru
- `/admin/criteria` — Kriter motoru
- `/admin/dynamic-roles` — Dinamik roller
- `/admin/dynamic-profiles` — Dinamik profiller
- `/admin/dynamic-fields` — Profil alanları
- `/admin/industries` — Sektörler
- `/admin/geo-groups` — Geo gruplar
- `/admin/business-policies` — İş politikaları

### Driver (`/driver/*`)
- `/driver/dashboard` — Ana panel
- `/driver/applications` — Başvurularım
- `/cv` — Profil & CV düzenle
- `/jobs` — İlanlara gözat
- `/account` — Hesap ayarları

### Employer (`/employer/*`)
- `/employer/dashboard` — Ana panel
- `/employer/jobs` — İlanlarım
- `/employer/jobs/new` — Yeni ilan
- `/employer/job-requests` — İlan taleplerim
- `/employer/applications` — Başvurular
- `/employer/branches` — Şubelerim
- `/employer/profile` — Firma profili

### Advertiser (`/advertiser/*`)
- `/advertiser/dashboard` — Ana panel
- `/advertiser/ads` — Reklamlarım
- `/advertiser/requests` — Taleplerim
- `/advertiser/requests/new` — Yeni talep
- `/advertiser/profile` — Profil

### Service Provider (`/service-provider/*`)
- `/service-provider/dashboard` — Ana panel
- `/service-provider/services` — Hizmetlerim
- `/service-provider/services/new` — Yeni hizmet ekle
- `/service-provider/profile` — Firma profili

### Ortak
- `/` — Ana sayfa
- `/login` → `/register/auth` — Giriş/Kayıt
- `/auth/callback` — OAuth callback
- `/account` — Hesap ayarları
- `/packages` — Paket listele + satın al
- `/orders` — Siparişlerim

---

## 🔴 AÇIK GÖREVLER (öncelik sırasıyla)

### Yüksek Öncelik
- [ ] **SubRoles iyileştirmeleri** (detay: `TODO_subRoles_improvements.md`)
  - Admin/users'a subRoles alanı ekle
  - Profil sayfasındaki hardcoded alt rolleri dinamik yap
  - Role koleksiyonu sorununu çöz
- [ ] **E2E akış audit'leri** (henüz test edilmedi)
  - Package → Order → Admin mark-paid → credits aktif
  - Employer job create → jobRequest → admin approve → publish + credit decrement
  - AD package → order → AdRequest → approve → AdCampaign + credit
- [ ] **Admin UI stabilizasyonu**: Tüm fetch çağrılarını `apiFetch/authHeaders` standardına geçir

### Orta Öncelik
- [ ] Aday profili / dynamic fields eksik akışlarını tamamla
- [ ] Groups node management: deletion cleanup e2e doğrulama
- [ ] FieldGroup sıralama (group ordering) konfigürasyonu

### Düşük Öncelik
- [ ] MongoDB Windows servis: StartupType Automatic
- [ ] Apple OAuth: Developer hesabı açılınca credential ekle
- [ ] Microsoft OAuth: İhtiyaç olursa

---

## ⚙️ Teknik Notlar

### Veritabanı
- **MongoDB**: `driverall` (tek DB — `driverall_dev` artık kullanılmıyor)
- Default URI: `mongodb://127.0.0.1:27017/driverall`
- PC reboot sonrası Mongo durabilir → `services.msc` → Start

### Portlar
- Backend: `3001`
- Frontend: `3000`

### Auth
- JWT expiry: `JWT_EXPIRES_IN` env (default `30d`)
- localStorage keys: `driverall_token`, `driverall_user`
- Legacy `token/user` otomatik migrate olur (`lib/session.ts`)

### Seed Scriptleri (`drivercv-backend/scripts/`)
- `seedServiceCategories.js` — Hizmet kategorileri (9 varsayılan)
- `seedFieldGroups.js` — EHL_TR, SRC_TR grupları
- `seedPassportVisaOptions.js` — Pasaport/vize seçenekleri
- `seedPassportVisaFields.js` — Pasaport/vize alanları
- `seedCvFieldsAndDemoCv.js` — CV alanları + demo CV

### Admin Tasks Sistemi
- Frontend: `drivercv-frontend/app/admin/tasks/page.tsx`
- Backend: `drivercv-backend/routes/adminTasks.js`
- Model: `drivercv-backend/models/InstructionTask.js`
- Akış: talimat yazılır → `devDone` işaretlenir → `adminTested` → `adminResult: ok/not_ok`

### Paket Motoru
- Model: `Package.js` (JOB/AD/BOTH), `PackageOrder.js`, `PaymentTransaction.js`
- Admin: `/api/admin/packages` (CRUD), `/api/admin/orders` (mark-paid)
- Public: `/api/packages` (list+buy), `/api/orders/mine`
- EFT: `/api/payments/orders/:orderId/manual-eft`

### Hizmet Veren Kategori Motoru
- Model: `ServiceCategory.js` (key, label, icon, relatedCriteriaKeys, relatedGroupKeys)
- Admin: `/api/admin/service-categories` (CRUD)
- Public: `/api/public/service-categories` (aktif olanlar)
- Frontend: Kategoriler API'den dinamik geliyor (hardcoded değil)

---

## 📁 Diğer Referans Dosyalar

Bu dosyalar **arşiv/detay** amaçlı. Ana takip bu dosyadan yapılır.

| Dosya | İçerik |
|-------|--------|
| `TODO.md` | Eski admin UI audit TODO'ları |
| `TODO_subRoles_improvements.md` | SubRoles detaylı geliştirme planı |
| `PROJECT_TODO.md` | Groups/Fields motor tasarım notları |
| `REMINDER_next_session.md` | Oturum hatırlatıcıları + OAuth/OTP detayları |
| `LOGS_checklist_next_session.md` | Health check komutları + oturum logları |

---

## 📅 Oturum Geçmişi (kısa)

- **2026-03-06**: OTP + credential yönetimi düzeltmeleri
- **2026-03-08**: OAuth (Google, Yandex) + belge bitiş sistemi + notification + logout fix (302 dosya commit)
- **2026-03-09**: Admin UI audit + hover iyileştirmeleri + driver/employer/advertiser sayfa yeniden tasarımları
- **2026-03-10**: Hizmet veren (service_provider) backend + frontend tam implementasyon
- **2026-03-11**: Paket motoru kontrolü ✅, dinamik kategori motoru (ServiceCategory), navigasyon linkleri düzenlendi, proje takip konsolidasyonu
