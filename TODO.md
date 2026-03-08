# DriverAll Admin UI Audit TODO

## Completed
- Veri katmanı audit: Backend’in bağlı olduğu Mongo DB adını netleştir; driverall vs driverall_dev mismatch varsa standardize et (seed script varsayılanı dahil).
- Demo seed: driverall_dev DB’ye PackageOrder + pending AdRequest + pending JobRequest oluştur (silmeden) ve çıktıda ID’leri yazdır.
- Smoke test: Admin approve AdRequest -> AdCampaign oluşuyor mu + PackageOrder adCount düşüyor mu.
- Smoke test: Admin approve JobRequest -> Job publish oluyor mu + PackageOrder jobPostCount düşüyor mu.
- CV alanları: FieldDefinition seed ekle + demo CV values yaz (driverall_dev).
- CV boşken bile alanlar görünsün: /api/fields DB boşsa default FieldDefinition listesi fallback dönsün (migration gerektirmeden).
- Aday onboarding akışı: kayıt/login sonrası driver her zaman CV ekranına ulaşabilsin (redirect + dashboard linkleri).
- Kriterler (FieldDefinition) kalıcılığı: DB boşsa server startup’ta DEFAULT_FIELDS’i DB’ye upsert ederek kriterleri otomatik oluştur (tek kaynak).

## In Progress / Next
- Admin UI stabilizasyon: admin sayfalarındaki tüm fetch çağrılarını apiFetch/authHeaders standardına geçir (401/403 handling dahil) ve kırılmaları engelle.
- Yarın: projeyi baştan aşağı gez (frontend/backend ana akışlar, admin, paket/sipariş, CV, auth) ve bulgularla audit planını netleştir.

## Pending
- E2E satın alma akışı audit (Package -> Order): frontend paket listeleme/satın alma -> backend orders create -> admin orders yönetimi; eksik/yanlış endpointleri düzelt.
- E2E ilan yayınlama/onay akışı: Employer job create -> jobRequest (packageOrderId) -> admin approve -> job publish + credit decrement; eksik validasyon/filtreleri tamamla.
- E2E reklam akışı: Package (AD) -> Order -> AdRequest(packageOrderId) -> admin approve -> AdCampaign + credit decrement -> public slot gösterim; legacy AdPackage bozulmasın.
- Aday profili/dynamic fields: self-expression alanları, filtreler ve görünürlük; eksik sayfaları/filtreleri tamamla.
