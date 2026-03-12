// PATH: DriverAll-main/drivercv-backend/constants/permissions.js
// ----------------------------------------------------------
// Sistem genelinde yetki tanımları
// - Her modül ve aksiyon burada tek noktada tanımlanır
// - Owner (employer/advertiser/service_provider) TÜM yetkilere sahiptir
// - Alt kullanıcılara owner bu listeden kısıtlama yapar
// ----------------------------------------------------------

/**
 * Kısıtlama türleri (her aksiyon için opsiyonel):
 *   ownOnly       → Sadece kendi oluşturduğu kayıtlar
 *   branchBased   → Sadece atandığı şubeye ait kayıtlar
 *   locationBased → Sadece bölgesindeki kayıtlar
 */

const PERMISSION_MODULES = [
  // ─── Firma Profili ───
  {
    module: "profile",
    label: "Firma Profili",
    icon: "🏢",
    description: "Firma bilgilerini görüntüleme ve düzenleme",
    actions: [
      { action: "read",   label: "Görüntüle",  description: "Firma profil bilgilerini görür" },
      { action: "update", label: "Düzenle",     description: "Firma profil bilgilerini günceller" },
    ],
    restrictions: [],
  },

  // ─── Şube Yönetimi ───
  {
    module: "branches",
    label: "Şubeler",
    icon: "📍",
    description: "Şube oluşturma, düzenleme ve silme",
    actions: [
      { action: "create", label: "Oluştur",     description: "Yeni şube ekler" },
      { action: "read",   label: "Görüntüle",  description: "Şube listesini ve detaylarını görür" },
      { action: "update", label: "Düzenle",     description: "Şube bilgilerini günceller" },
      { action: "delete", label: "Sil",         description: "Şube kaydını siler" },
    ],
    restrictions: ["branchBased"],
  },

  // ─── Ekip (Alt Kullanıcı) Yönetimi ───
  {
    module: "team",
    label: "Ekip Yönetimi",
    icon: "👥",
    description: "Alt kullanıcı oluşturma, yetki atama, silme",
    actions: [
      { action: "create", label: "Oluştur",     description: "Yeni alt kullanıcı ekler" },
      { action: "read",   label: "Görüntüle",  description: "Ekip üyelerini listeler" },
      { action: "update", label: "Düzenle",     description: "Alt kullanıcı bilgilerini günceller" },
      { action: "delete", label: "Sil",         description: "Alt kullanıcıyı siler" },
    ],
    restrictions: ["branchBased"],
  },

  // ─── İlan Yönetimi ───
  {
    module: "jobs",
    label: "İlanlar",
    icon: "📋",
    description: "İş ilanı oluşturma, düzenleme, yayınlama",
    actions: [
      { action: "create",  label: "Oluştur",     description: "Yeni ilan taslağı oluşturur" },
      { action: "read",    label: "Görüntüle",  description: "İlanları listeler ve detay görür" },
      { action: "update",  label: "Düzenle",     description: "İlan bilgilerini günceller" },
      { action: "delete",  label: "Sil",         description: "İlan taslağını siler" },
      { action: "publish", label: "Yayınla",     description: "İlanı onaya gönderir / yayınlar" },
    ],
    restrictions: ["ownOnly", "branchBased"],
  },

  // ─── İlan Talepleri ───
  {
    module: "job_requests",
    label: "İlan Talepleri",
    icon: "📝",
    description: "İlan talebi oluşturma ve takip",
    actions: [
      { action: "create", label: "Oluştur",     description: "Yeni ilan talebi gönderir" },
      { action: "read",   label: "Görüntüle",  description: "İlan taleplerini listeler" },
      { action: "update", label: "Düzenle",     description: "Talebi günceller" },
      { action: "delete", label: "İptal Et",    description: "Talebi iptal eder" },
    ],
    restrictions: ["ownOnly"],
  },

  // ─── Başvuru Yönetimi ───
  {
    module: "applications",
    label: "Başvurular",
    icon: "📨",
    description: "Gelen başvuruları inceleme ve yanıtlama",
    actions: [
      { action: "read",    label: "Görüntüle",  description: "Başvuruları listeler ve detay görür" },
      { action: "respond", label: "Yanıtla",    description: "Başvuruyu kabul/ret/beklet yapar" },
      { action: "export",  label: "Dışa Aktar", description: "Başvuru listesini dışa aktarır" },
    ],
    restrictions: ["branchBased", "ownOnly"],
  },

  // ─── Aday Profilleri ───
  {
    module: "candidates",
    label: "Aday Profilleri",
    icon: "🧑‍💼",
    description: "Platformdaki aday profillerini görüntüleme",
    actions: [
      { action: "read",    label: "Görüntüle",   description: "Aday CV ve profillerini görür" },
      { action: "contact", label: "İletişim Kur", description: "Adayla iletişim başlatır" },
      { action: "shortlist", label: "Listeye Al", description: "Adayı kısa listeye ekler" },
    ],
    restrictions: [],
  },

  // ─── Raporlar & İstatistikler ───
  {
    module: "reports",
    label: "Raporlar",
    icon: "📊",
    description: "İstatistik ve raporları görüntüleme",
    actions: [
      { action: "read",   label: "Görüntüle",  description: "Dashboard ve istatistikleri görür" },
      { action: "export", label: "Dışa Aktar", description: "Rapor verilerini dışa aktarır" },
    ],
    restrictions: ["branchBased"],
  },

  // ─── Mesajlaşma ───
  {
    module: "messaging",
    label: "Mesajlar",
    icon: "💬",
    description: "Sistem içi mesajlaşma",
    actions: [
      { action: "read",   label: "Oku",     description: "Gelen mesajları okur" },
      { action: "create", label: "Gönder",  description: "Yeni mesaj gönderir" },
    ],
    restrictions: [],
  },

  // ─── Finans / Paketler ───
  {
    module: "billing",
    label: "Finans & Paketler",
    icon: "💳",
    description: "Paket satın alma, fatura ve ödeme işlemleri",
    actions: [
      { action: "read",     label: "Görüntüle",   description: "Fatura ve paket bilgilerini görür" },
      { action: "purchase", label: "Satın Al",     description: "Yeni paket satın alır" },
    ],
    restrictions: [],
  },

  // ─── Ayarlar ───
  {
    module: "settings",
    label: "Ayarlar",
    icon: "⚙️",
    description: "Firma hesap ayarları ve bildirim tercihleri",
    actions: [
      { action: "read",   label: "Görüntüle", description: "Ayarları görür" },
      { action: "update", label: "Değiştir",  description: "Ayarları günceller" },
    ],
    restrictions: [],
  },
];

/**
 * Owner (firma sahibi) için tüm yetkileri "allowed: true" olarak üret.
 * SubUser oluşturulurken bu tam listeyi başlangıç olarak kullanıp kısıtlama yaparız.
 */
function buildFullPermissions() {
  return PERMISSION_MODULES.map((mod) => ({
    module: mod.module,
    actions: mod.actions.map((a) => ({
      action: a.action,
      allowed: true,
      restrictions: {
        ownOnly: false,
        locationBased: false,
        branchBased: false,
      },
    })),
  }));
}

/**
 * Boş (hiç yetki verilmemiş) permission seti üret.
 */
function buildEmptyPermissions() {
  return PERMISSION_MODULES.map((mod) => ({
    module: mod.module,
    actions: mod.actions.map((a) => ({
      action: a.action,
      allowed: false,
      restrictions: {
        ownOnly: false,
        locationBased: false,
        branchBased: false,
      },
    })),
  }));
}

/**
 * Modül listesini frontend'e göndermek için sade yapıda döndür
 */
function getPermissionDefinitions() {
  return PERMISSION_MODULES.map((mod) => ({
    module: mod.module,
    label: mod.label,
    icon: mod.icon,
    description: mod.description,
    restrictions: mod.restrictions,
    actions: mod.actions.map((a) => ({
      action: a.action,
      label: a.label,
      description: a.description,
    })),
  }));
}

module.exports = {
  PERMISSION_MODULES,
  buildFullPermissions,
  buildEmptyPermissions,
  getPermissionDefinitions,
};
