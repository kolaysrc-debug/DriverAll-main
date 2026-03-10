const mongoose = require("mongoose");

const InstructionTask = require("../models/InstructionTask");

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/driverall";

function normalizeKey(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

const TASKS = [
  {
    key: "build-blockers-advertiser-ads-api-fix",
    title: "Advertiser ads edit build hatasını düzelt",
    description: "Advertiser ads edit sayfasındaki eksik API export/import build hatası kapatıldı.",
    instruction: "lib/api/ads.ts içindeki fetchAdById ve updateAd exportları korunmalı; advertiser ads edit ekranı build ve runtime'da çalışmalı.",
    priority: "high",
    status: "done",
    tags: ["launch_blocker", "frontend", "ads", "completed"],
  },
  {
    key: "runtime-admin-branches-null-safety",
    title: "Admin branches runtime crash düzeltmesi",
    description: "Admin branches sayfasındaki undefined manager/name erişimi güvenli hale getirildi.",
    instruction: "Nested alanlar eksik geldiğinde /admin/branches render kırmamalı.",
    priority: "high",
    status: "done",
    tags: ["launch_blocker", "admin", "runtime", "completed"],
  },
  {
    key: "runtime-admin-subusers-hardening",
    title: "Admin subusers null-safety ve stil hardening",
    description: "Admin subusers sayfasına null-safety ve production-safe stil düzeltmeleri eklendi.",
    instruction: "Eksik branch/role/user verisi render'ı bozmamalı; stil seçimleri static class mapping ile korunmalı.",
    priority: "high",
    status: "done",
    tags: ["admin", "subusers", "frontend", "completed"],
  },
  {
    key: "runtime-admin-subusers-actions-wired",
    title: "Admin subusers aksiyonlarını çalışan akışlara bağla",
    description: "Düzenle, Yetkiler, Şube Ata, Şifre Sıfırla, Onayla, Aktif/Pasif aksiyonları bağlandı.",
    instruction: "Admin subusers butonları placeholder kalmamalı; backend ve frontend akışları birbirine bağlı çalışmalı.",
    priority: "high",
    status: "done",
    tags: ["admin", "subusers", "workflow", "completed"],
  },
  {
    key: "build-employer-applications-jobs-module-fix",
    title: "Employer applications jobs modül build hatasını düzelt",
    description: "Boş veya hatalı page modülü yerine geçerli sayfa modülü eklendi.",
    instruction: "/employer/applications/jobs build sırasında module/export hatası vermemeli.",
    priority: "high",
    status: "done",
    tags: ["launch_blocker", "frontend", "employer", "completed"],
  },
  {
    key: "build-rolegate-prop-name-fix",
    title: "RoleGate prop uyumsuzluklarını düzelt",
    description: "allowedRoles yerine allowRoles kullanımı hizalandı.",
    instruction: "RoleGate kullanan ekranlarda yanlış prop adı kalmamalı.",
    priority: "high",
    status: "done",
    tags: ["launch_blocker", "frontend", "auth", "completed"],
  },
  {
    key: "build-typescript-blockers-cleanup",
    title: "Kalan TypeScript build blockerlarını temizle",
    description: "Sırayla çıkan TypeScript bloklayıcıları temizlendi.",
    instruction: "Frontend build TypeScript aşamasını hatasız geçmeli.",
    priority: "high",
    status: "done",
    tags: ["launch_blocker", "typescript", "completed"],
  },
  {
    key: "build-next16-searchparams-suspense-fix",
    title: "Next 16 useSearchParams Suspense bloklarını temizle",
    description: "useSearchParams kullanan sayfalar Suspense ile sarıldı ve prerender blokları kapandı.",
    instruction: "login, register/auth, auth/callback, jobs, home, admin/groups, admin/fields ve advertiser/ad-requests/new sayfalarında Next 16 uyumu korunmalı.",
    priority: "high",
    status: "done",
    tags: ["launch_blocker", "next16", "prerender", "completed"],
  },
  {
    key: "verify-frontend-build-after-fixes",
    title: "Düzeltmeler sonrası frontend build doğrulaması",
    description: "drivercv-frontend içinde npm run build başarıyla geçti.",
    instruction: "Yeni değişikliklerden sonra build tekrar patlarsa bu görev yeniden açılmalı.",
    priority: "high",
    status: "done",
    tags: ["launch_blocker", "verification", "completed"],
  },
  {
    key: "admin-dashboard-tasks-entry-link",
    title: "Admin dashboard üzerinden tasks ekranına giriş linki",
    description: "Admin dashboard sol menüsüne Talimat / Yapılacak Takibi linki eklendi.",
    instruction: "Admin kullanıcı /admin/dashboard ekranından /admin/tasks sayfasına tek tıkla gidebilmeli.",
    priority: "medium",
    status: "done",
    tags: ["admin", "ux", "tasks", "completed"],
  },
  {
    key: "tasks-as-source-of-truth",
    title: "İş takibini admin tasks ekranına taşı",
    description: "Yapılan, yapılmayan, yapılmak istenen ve ileride düşünülen maddeler artık /admin/tasks üzerinden izlenecek.",
    instruction: "Yeni görevler mümkün olduğunca markdown notları yerine /admin/tasks içine eklenmeli ve statüleri oradan güncellenmeli.",
    priority: "high",
    status: "in_progress",
    tags: ["process", "tasks", "tracking"],
  },
  {
    key: "admin-ui-api-fetch-standardization",
    title: "Admin UI fetch standardizasyonu",
    description: "Admin sayfalarındaki fetch çağrılarını ortak apiFetch/authHeaders standardına toplama işi açık durumda.",
    instruction: "401/403 handling ve kırılma riskini azaltmak için admin sayfalarında ortak fetch standardı uygulanmalı.",
    priority: "high",
    status: "pending",
    tags: ["future", "admin", "hardening"],
  },
  {
    key: "e2e-package-order-audit",
    title: "E2E paket-sipariş akışını audit et",
    description: "Paket listeleme/satın alma -> backend orders create -> admin orders yönetimi akışı gözden geçirilecek.",
    instruction: "Package -> Order hattındaki eksik/yanlış endpoint veya UI bağlantıları tespit edilip düzeltilmeli.",
    priority: "high",
    status: "pending",
    tags: ["future", "e2e", "orders"],
  },
  {
    key: "e2e-job-publish-approval-audit",
    title: "E2E ilan yayınlama/onay akışını audit et",
    description: "Employer job create -> jobRequest -> admin approve -> publish + credit decrement akışı doğrulanacak.",
    instruction: "Job publish kredi düşümü, request onayı ve görünürlük akışı uçtan uca test edilip eksikler kapatılmalı.",
    priority: "high",
    status: "pending",
    tags: ["future", "e2e", "jobs"],
  },
  {
    key: "e2e-ad-flow-audit",
    title: "E2E reklam akışını audit et",
    description: "Package -> Order -> AdRequest -> admin approve -> AdCampaign + credit decrement akışı doğrulanacak.",
    instruction: "Legacy AdPackage davranışını bozmadan reklam akışının uçtan uca doğru çalıştığı doğrulanmalı.",
    priority: "high",
    status: "pending",
    tags: ["future", "e2e", "ads"],
  },
  {
    key: "candidate-profile-dynamic-fields-completion",
    title: "Aday profili ve dynamic fields eksiklerini tamamlama",
    description: "Self-expression alanları, filtreler ve görünürlük tarafında eksikler bulunuyor.",
    instruction: "Aday profilindeki eksik sayfalar, filtreler ve görünürlük davranışları netleştirilip tamamlanmalı.",
    priority: "medium",
    status: "pending",
    tags: ["future", "profile", "dynamic_fields"],
  },
  {
    key: "groups-deletion-end-to-end-verification",
    title: "Fields -> Groups/CV/filters deletion akışını uçtan uca doğrula",
    description: "PROJECT_TODO içindeki deletion cleanup doğrulaması henüz tamamlanmamış durumda.",
    instruction: "Bir kriter silindiğinde Groups node temizliği, CV görünümü ve jobs filter çıktısı uçtan uca doğrulanmalı.",
    priority: "medium",
    status: "pending",
    tags: ["future", "groups", "verification"],
  },
  {
    key: "groups-ordering-config-decision",
    title: "Group ordering yapılandırılabilir mi kararını ver",
    description: "Node ordering dışında group ordering konfigürasyonu ihtiyacı değerlendirilmemiş durumda.",
    instruction: "Grup sırası admin tarafından yönetilecek mi yoksa sabit mi kalacak, ürün kararı verilmeli.",
    priority: "low",
    status: "pending",
    tags: ["future", "groups", "product_decision"],
  },
  {
    key: "groups-orphan-cleanup-admin-tool",
    title: "Groups için tek seferlik orphan cleanup admin aracı değerlendirmesi",
    description: "Gerekirse orphan cleanup çalıştıracak admin tool/button eklenebilir.",
    instruction: "İhtiyaç varsa orphan node temizliği için kontrollü bir admin aksiyonu tasarlanmalı.",
    priority: "low",
    status: "pending",
    tags: ["future", "groups", "admin_tool"],
  }
];

function buildTask(doc) {
  const now = new Date();
  const done = doc.status === "done";
  return {
    key: normalizeKey(doc.key || doc.title),
    title: String(doc.title || ""),
    description: String(doc.description || ""),
    instruction: String(doc.instruction || ""),
    priority: doc.priority || "medium",
    status: doc.status || "pending",
    tags: Array.isArray(doc.tags) ? doc.tags.map((x) => String(x || "").trim()).filter(Boolean) : [],
    devDone: done,
    devDoneAt: done ? now : null,
    adminTested: done,
    adminTestedAt: done ? now : null,
    adminResult: done ? "ok" : "",
    adminResultNote: "",
    doneAt: done ? now : null,
  };
}

async function main() {
  console.log("Seeding current status tasks...");
  console.log("Mongo URI:", MONGO_URI);

  await mongoose.connect(MONGO_URI);
  console.log("Mongo connected:", mongoose.connection?.name);

  let upserted = 0;
  for (const item of TASKS) {
    const payload = buildTask(item);
    await InstructionTask.updateOne(
      { key: payload.key },
      {
        $setOnInsert: {
          key: payload.key,
          createdByUserId: null,
        },
        $set: {
          title: payload.title,
          description: payload.description,
          instruction: payload.instruction,
          priority: payload.priority,
          status: payload.status,
          tags: payload.tags,
          devDone: payload.devDone,
          devDoneAt: payload.devDoneAt,
          adminTested: payload.adminTested,
          adminTestedAt: payload.adminTestedAt,
          adminResult: payload.adminResult,
          adminResultNote: payload.adminResultNote,
          doneAt: payload.doneAt,
          updatedByUserId: null,
        },
      },
      { upsert: true }
    );
    upserted += 1;
    console.log("Upserted:", payload.key);
  }

  console.log(`Done. Upserted ${upserted} tasks.`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
  }
  process.exit(1);
});
