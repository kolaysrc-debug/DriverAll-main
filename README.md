# DriverAll
Driver training and development platform
D) “Sabah unutma” için 10 satırlık runbook

Bunu bir yere (README veya not) koyun:

Admin/Groups: Grup aç → node ekle → parentKey ile hiyerarşi → coverage/required gir

Node eklenince backend FieldDefinition’i otomatik üretir (showInCv=true)

Admin/Fields: FieldDefinition’da country = ALL veya TR seç

Profile/CV: Görünürlük filtresi = ALL || profileCountry olmalı

CV kaydet → backend criteria engine expandedKeys uygular → dönen values UI state’e yazılır

UI’da CV alanları groupKey ile kartlara bölünür

Grup içi sıralama: level, sortOrder, label

Değişiklik sonrası: docker compose restart backend + next dev restart

Bir şey bozulursa: git checkout <checkpoint> ile geri dön

Her çalışır adımda commit al
// HEAD is now at 7e190d0 checkpoint: stable before group-order/country-filter
25.12.2025 geri dönüş noktası hazırladık. 
admin olarak girmeyince yetki kısıtlaması yaptık.
hiyerarşi hazırladık. en iyisi de bu oldu.
dashboardlar eklendi. 
Yedek geri dönüş	:	HEAD commit: d22357 
Geri dönüş noktası	:	Switched to a new branch 'feat/roles-v3'
30.12.2025 00:10
30.12.2025	:	git commit -m "feat: topbar advertiser menu + admin dashboard approvals card"
git push:	02.01.2026	-	a4e3419..4d8c46d  feat/roles-v3 -> feat/roles-v3 (topbar tamam dashboard tamam)
git push:	03.01.2026	-	4d8c46d..d86a292  feat/roles-v3 -> feat/roles-v3 (ilanlar filtresi)
[new tag]         checkpoint-2026-01-05-ads-requests -> checkpoint-2026-01-05-ads-requests
git push:	04.01.2026-03:30	-	b4a1d81..9c15f75  feat/roles-v3 -> feat/roles-v3