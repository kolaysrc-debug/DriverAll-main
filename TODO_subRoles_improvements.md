# SubRoles İyileştirmeleri - Yapılacaklar Listesi

## 🎯 Ana Hedef
Alt rol (subRoles) yönetimini hem admin panelinde hem profil sayfasında düzgün çalışır hale getirmek.

---

## 📋 Yapılacak İşler

### 1. Admin/Users Sayfasına SubRoles Alanı Ekle
**Dosya:** `drivercv-frontend/app/admin/users/page.tsx`

**Gereksinimler:**
- Kullanıcı düzenleme modal/formunda **SubRoles** alanı ekle
- Multi-select dropdown olmalı (birden fazla alt rol seçilebilmeli)
- Alt roller API'den dinamik olarak gelecek: `/api/public/roles/candidate-subroles`
- Kullanıcının ana rolüne göre filtrelenmiş alt roller gösterilmeli
  - Örnek: `role: "candidate"` ise sadece `category: "candidate"` alt rolleri göster
- Seçilen alt roller `PUT /api/admin/users/:id` ile backend'e kaydedilecek

**Backend API Kontrolü:**
- `PUT /api/admin/users/:id` endpoint'i `subRoles` alanını kabul ediyor mu kontrol et
- Gerekirse backend'e `subRoles` kaydetme ekle

---

### 2. Profil Sayfasındaki Hardcoded Alt Rolleri Kaldır
**Dosya:** `drivercv-frontend/components/CandidateProfileCvEditor.tsx`

**Kaldırılacak Kod:**
```typescript
// Satır ~1447-1452 civarı - hardcoded array
["driver", "Driver", ""],
["courier", "Kurye", ""],
["forklift", "Forklift", ""],
["shuttle", "Servis", ""],
```

**Değiştirilecek:**
- Bu hardcoded array yerine `candidateSubRoles` state'inden gelen dinamik liste kullanılacak
- `candidateSubRoles` zaten `/api/public/roles/candidate-subroles` endpoint'inden geliyor

---

### 3. Profil Sayfasına Dinamik Alt Rol Listesi Ekle
**Dosya:** `drivercv-frontend/components/CandidateProfileCvEditor.tsx`

**Gereksinimler:**
- Alt rol checkbox'ları `candidateSubRoles` state'inden render edilecek
- Kullanıcının ana rolüne (`profile.role`) göre filtrelenmiş alt roller gösterilecek
- Multi-select checkbox listesi olarak kalacak (mevcut UI korunacak)
- Seçilen alt roller `selectedSubRoles` state'inde tutulacak (mevcut mantık korunacak)

**Örnek Kod:**
```typescript
{(candidateSubRoles || [])
  .filter(subRole => subRole.category === profile?.role || subRole.category === 'candidate')
  .map(subRole => (
    <label key={subRole.key}>
      <input
        type="checkbox"
        checked={selectedSubRoles.includes(subRole.key)}
        onChange={(e) => {
          // mevcut onChange mantığı
        }}
      />
      {subRole.label}
    </label>
  ))
}
```

---

### 4. Role Koleksiyonu Sorunu Çöz
**Sorun:** Kullanıcı "kursiyer" alt rolü eklemiş, profil sayfasında çıkıyor ama admin/dynamic-roles sayfasında görünmüyor.

**Kontrol Edilecekler:**
1. MongoDB'de `roles` koleksiyonunda "kursiyer" rolü var mı?
   ```javascript
   db.roles.find({ name: "kursiyer" })
   ```

2. Admin/dynamic-roles sayfası rolleri doğru çekiyor mu?
   - Backend: `GET /api/admin/dynamic-roles` endpoint'i
   - Frontend: `drivercv-frontend/app/admin/dynamic-roles/page.tsx`
   - Network tab'da response kontrol et

3. Frontend render sorunu var mı?
   - Console'da hata var mı?
   - `roles` state'i dolu mu?

**Olası Çözümler:**
- Backend cache sorunu: `_candidateSubRoleCache` temizlenmeli (backend restart)
- Frontend cache sorunu: Hard refresh (Ctrl+Shift+R)
- MongoDB index sorunu: `name_1` unique index çakışması
- Filter sorunu: Frontend'de yanlış filtreleme

---

### 5. Backend SubRoles Normalizasyon Kontrolü
**Dosya:** `drivercv-backend/routes/profile.js`

**Kontrol Edilecek:**
- `normalizeSubRolesDynamic` fonksiyonu doğru çalışıyor mu?
- Role koleksiyonundan alt rolleri doğru çekiyor mu?
- Cache mekanizması doğru çalışıyor mu?

**Debug için eklenen loglar:**
```javascript
console.log("🔧 Updating User.subRoles:", { userId, input: body.subRoles, normalized });
console.log("✅ User.updateOne result:", updateResult);
```

Bu loglar backend console'da görünmeli.

---

## 🔍 Test Senaryoları

### Test 1: Admin Panelinde SubRoles Düzenleme
1. Admin panelinde Users sayfasına git
2. Bir kullanıcıyı düzenle
3. SubRoles dropdown'ından birden fazla alt rol seç
4. Kaydet
5. Sayfayı yenile
6. Seçilen alt rollerin görünüp görünmediğini kontrol et

### Test 2: Profil Sayfasında Dinamik Alt Roller
1. Profil/CV sayfasına git
2. Alt rol listesinin API'den geldiğini doğrula (hardcoded değil)
3. Kullanıcı rolüne göre filtrelenmiş alt rollerin göründüğünü kontrol et
4. Birden fazla alt rol seç
5. Profil Kaydet
6. Backend console'da `🔧 Updating User.subRoles` ve `normalized: [...]` mesajlarını gör
7. Frontend console'da `💾 Save Response` ve `receivedSubRoles: [...]` mesajlarını gör
8. Sayfayı yenile
9. Seçilen alt rollerin işaretli kaldığını doğrula

### Test 3: Role Koleksiyonu
1. Admin/dynamic-roles sayfasına git
2. Tüm alt rollerin (driver, courier, forklift, shuttle, kursiyer) listelendiğini kontrol et
3. Yeni bir alt rol ekle
4. Backend restart
5. Profil sayfasında yeni alt rolün göründüğünü kontrol et

---

## 🐛 Bilinen Sorunlar

1. **SubRoles persist etmiyor**
   - Kök neden: Role koleksiyonunda `category: "candidate", level > 0` rolleri eksik
   - Seed script çalıştırıldığında duplicate key hatası alınıyor (roller var ama görünmüyor)

2. **Admin/dynamic-roles sayfası rolleri göstermiyor**
   - Kullanıcı "kursiyer" eklemiş ama listede görünmüyor
   - Frontend veya backend sorunu olabilir

3. **Hardcoded alt roller**
   - Profil sayfasında driver, courier, forklift, shuttle hardcoded
   - Dinamik hale getirilmeli

---

## 📝 Notlar

- User modelinde `subRoles: { type: [String], default: [] }` alanı mevcut ✅
- Backend API'leri `subRoles` kaydetme ve okuma yapıyor ✅
- Frontend state management doğru ✅
- Sorun: Role koleksiyonu ve admin UI

---

## 🚀 Öncelik Sırası

1. **Yüksek:** Role koleksiyonu sorununu çöz (admin/dynamic-roles sayfası)
2. **Yüksek:** Profil sayfasındaki hardcoded alt rolleri dinamik yap
3. **Orta:** Admin/users sayfasına subRoles alanı ekle
4. **Düşük:** Seed script'i düzelt (gerekirse)

---

**Son Güncelleme:** 2026-03-09 04:05
**Hazırlayan:** Cascade AI
