# SubRoles İyileştirmeleri - Yapılacaklar Listesi

## 🎯 Ana Hedef
Alt rol (subRoles) yönetimini hem admin panelinde hem profil sayfasında düzgün çalışır hale getirmek.

---

## ✅ Tamamlanan İşler (2026-03-11)

### 1. ✅ Admin/Users — SubRoles BUG FIX + Gösterim
**Dosya:** `drivercv-frontend/app/admin/users/page.tsx`
- **BUG FIX:** `loadSubRoles()` fonksiyonunda `data.roles` → `data.subRoles` düzeltildi (API `subRoles` döndürüyor)
- Multi-select dropdown zaten mevcuttu, artık düzgün çalışıyor
- Kullanıcı listesi tablosunda "Rol" sütununa subRoles badge'leri eklendi (mor renkli)
- Backend `PUT /api/drivers/:id` zaten `subRoles` kabul ediyor ✅

### 2. ✅ types/role-engine.ts — Hardcoded → Dinamik
**Dosya:** `drivercv-frontend/types/role-engine.ts`
- `SubRole` tipi `"driver" | "operator" | "courier" | "valet"` → `string` olarak güncellendi
- `RoleConfig.key` tipi `SubRole` → `string` olarak güncellendi
- `CANDIDATE_SUB_ROLES` artık yalnızca legacy fallback olarak işaretlendi
- Gerçek kaynak: Role koleksiyonu (`category: "candidate"`, `level > 0`)

### 3. ✅ Backend: Profil PUT'a SubRoles Kaydetme
**Dosya:** `drivercv-backend/routes/profile.js`
- `PUT /api/profile/me` handler'ına `body.subRoles` kontrolü eklendi
- `normalizeSubRolesDynamic()` ile validate + normalize ediliyor
- User modeline `User.updateOne()` ile kaydediliyor
- Response'da güncel `updatedSubRoles` döndürülüyor (stale data bug önlendi)

### 4. ✅ CandidateProfileCvEditor — Dinamik SubRoles UI
**Dosya:** `drivercv-frontend/components/CandidateProfileCvEditor.tsx`
- `candidateSubRoles` ve `selectedSubRoles` state'leri eklendi
- `loadAll()` içinde `/api/public/roles/candidate-subroles` API fetch eklendi
- Profil response'undan mevcut kullanıcı subRoles'ları yükleniyor
- Profil kaydetme body'sine `subRoles: selectedSubRoles` eklendi
- Checkbox UI eklendi (İlçe ile Hakkımda arasında):
  - Dinamik API'den gelen alt roller
  - Seçili olanlar mor renkli border/bg
  - Boş seçim uyarısı
- Eski hardcoded subrole dizisi zaten kaldırılmıştı

### 5. ✅ dynamic-roles Sayfası Kontrol
**Dosya:** `drivercv-frontend/app/admin/dynamic-roles/page.tsx`
- Backend kodu doğru: ana roller constant'tan, alt roller DB'den
- "Kursiyer görünmüyor" sorunu → DB verisi eksikliği (seed ya da manual ekleme gerekli)
- Kod düzeltmesi gerekmedi

---

## 🔍 Runtime Test Senaryoları

### Test 1: Admin/Users SubRoles
1. `/admin/users` sayfasına git
2. SubRoles multi-select'in dolu olduğunu doğrula (artık `data.subRoles` kullanıyor)
3. Bir kullanıcıyı düzenle → alt rol seç → Kaydet
4. Kullanıcı satırında mor alt rol badge'lerini gör

### Test 2: Profil Sayfası SubRoles
1. Profil/CV sayfasına git
2. "Alt Roller" checkbox'larının API'den dinamik geldiğini doğrula
3. Birden fazla alt rol seç → Profili Kaydet
4. Sayfayı yenile → seçimlerin korunduğunu doğrula

### Test 3: dynamic-roles Sayfa Kontrolü
1. `/admin/dynamic-roles` sayfasına git
2. Alt rollerin listelenip listelenmediğini kontrol et
3. Eksikse: seed script çalıştır veya manual ekle

---

## � Mimari Notlar

- **SubRoles User modeline kaydedilir**, Profile'a değil
- Backend `normalizeSubRolesDynamic()` fonksiyonu Role koleksiyonundan izinli key'leri çeker (60s cache)
- Public API: `GET /api/public/roles/candidate-subroles` (auth gerektirmez)
- Admin API: `GET /api/admin/dynamic-roles` (admin auth gerektirir)
- Frontend: 3 yerde subRoles fetch var → `page.tsx` (kayıt), `CandidateProfileCvEditor.tsx` (profil), `admin/users/page.tsx` (admin)

---

**Son Güncelleme:** 2026-03-11
**Hazırlayan:** Cascade AI
