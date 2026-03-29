export type DashboardItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  helpText?: string;
  color?: string;
};

export type NavBarItem = {
  itemId: string;
  order: number;
};

export type DashboardGroup = {
  groupId: string;
  title: string;
  order: number;
  items: { itemId: string; order: number }[];
};

export const MENU_CATALOG: Record<string, DashboardItem> = {
  "dashboard": {
    id: "dashboard",
    label: "Dashboard",
    description: "Genel istatistikler ve özet.",
    href: "/admin/dashboard",
    icon: "📊",
    color: "border-blue-800/40",
  },
  "users": {
    id: "users",
    label: "Kullanıcılar",
    description: "Tüm kullanıcı yönetimi.",
    href: "/admin/users",
    icon: "👥",
  },
  "drivers": {
    id: "drivers",
    label: "Sürücüler",
    description: "Sürücü profilleri ve onay.",
    href: "/admin/drivers",
    icon: "🚗",
  },
  "jobs": {
    id: "jobs",
    label: "İş İlanları",
    description: "İlan yönetimi ve onaylar.",
    href: "/admin/jobs",
    icon: "💼",
  },
  "job-requests": {
    id: "job-requests",
    label: "İlan Talepleri",
    description: "İşveren ilan talepleri.",
    href: "/admin/job-requests",
    icon: "📋",
  },
  "approvals": {
    id: "approvals",
    label: "Onaylar",
    description: "Bekleyen onay işlemleri.",
    href: "/admin/approvals",
    icon: "✅",
  },
  "orders": {
    id: "orders",
    label: "Siparişler",
    description: "Paket siparişleri.",
    href: "/admin/orders",
    icon: "🛒",
  },
  "payments": {
    id: "payments",
    label: "Ödemeler",
    description: "Ödeme işlemleri ve takibi.",
    href: "/admin/payments",
    icon: "💰",
  },
  "packages": {
    id: "packages",
    label: "Paketler",
    description: "Paket tanımları ve fiyatlandırma.",
    href: "/admin/packages",
    icon: "📦",
  },
  "ad-campaigns": {
    id: "ad-campaigns",
    label: "Reklam Kampanyaları",
    description: "Reklam kampanyası yönetimi.",
    href: "/admin/ad-campaigns",
    icon: "📢",
  },
  "ad-packages": {
    id: "ad-packages",
    label: "Reklam Paketleri",
    description: "Reklam paketi tanımları.",
    href: "/admin/ad-packages",
    icon: "🎯",
  },
  "ad-requests": {
    id: "ad-requests",
    label: "Reklam Talepleri",
    description: "Reklam başvuruları.",
    href: "/admin/ad-requests",
    icon: "📝",
  },
  "placements": {
    id: "placements",
    label: "Yerleşimler",
    description: "Reklam yerleşim noktaları.",
    href: "/admin/placements",
    icon: "📍",
  },
  "company-profiles": {
    id: "company-profiles",
    label: "Firma Profilleri",
    description: "Firma profil yönetimi.",
    href: "/admin/company-profiles",
    icon: "🏢",
  },
  "branches": {
    id: "branches",
    label: "Şubeler",
    description: "Şube yönetimi.",
    href: "/admin/branches",
    icon: "🏬",
  },
  "subusers": {
    id: "subusers",
    label: "Alt Kullanıcılar",
    description: "Alt kullanıcı yönetimi.",
    href: "/admin/subusers",
    icon: "👤",
  },
  "service-categories": {
    id: "service-categories",
    label: "Hizmet Kategorileri",
    description: "Hizmet kategori tanımları.",
    href: "/admin/service-categories",
    icon: "🔧",
  },
  "business-policies": {
    id: "business-policies",
    label: "İş Politikaları",
    description: "İşletme politikaları.",
    href: "/admin/business-policies",
    icon: "📜",
  },
  "fields": {
    id: "fields",
    label: "Alan Tanımları",
    description: "Dinamik alan yönetimi.",
    href: "/admin/fields",
    icon: "🔤",
  },
  "groups": {
    id: "groups",
    label: "Gruplar",
    description: "Grup yönetimi.",
    href: "/admin/groups",
    icon: "📁",
  },
  "dynamic-roles": {
    id: "dynamic-roles",
    label: "Dinamik Roller",
    description: "Rol tanımları.",
    href: "/admin/dynamic-roles",
    icon: "🎭",
  },
  "dynamic-fields": {
    id: "dynamic-fields",
    label: "Dinamik Alanlar",
    description: "Dinamik alan yapılandırması.",
    href: "/admin/dynamic-fields",
    icon: "⚙️",
  },
  "industries": {
    id: "industries",
    label: "Sektörler",
    description: "Sektör tanımları.",
    href: "/admin/industries",
    icon: "🏭",
  },
  "geo-groups": {
    id: "geo-groups",
    label: "Coğrafi Gruplar",
    description: "Bölge ve coğrafi gruplar.",
    href: "/admin/geo-groups",
    icon: "🌍",
  },
  "tasks": {
    id: "tasks",
    label: "Görevler",
    description: "Proje görev takibi.",
    href: "/admin/tasks",
    icon: "📌",
  },
  "commit-logs": {
    id: "commit-logs",
    label: "Commit Logları",
    description: "Geliştirme geçmişi.",
    href: "/admin/commit-logs",
    icon: "🔖",
  },
  "criteria": {
    id: "criteria",
    label: "Kriterler",
    description: "Kriter önizleme ve test.",
    href: "/admin/criteria",
    icon: "🧪",
  },
};

export const DEFAULT_TOP_BAR: NavBarItem[] = [
  { itemId: "dashboard", order: 0 },
  { itemId: "users", order: 1 },
  { itemId: "drivers", order: 2 },
  { itemId: "jobs", order: 3 },
  { itemId: "orders", order: 4 },
  { itemId: "payments", order: 5 },
];

export const DEFAULT_BOTTOM_BAR: NavBarItem[] = [
  { itemId: "users", order: 0 },
  { itemId: "drivers", order: 1 },
  { itemId: "jobs", order: 2 },
  { itemId: "approvals", order: 3 },
  { itemId: "payments", order: 4 },
  { itemId: "tasks", order: 5 },
];

export const DEFAULT_GROUPS: DashboardGroup[] = [
  {
    groupId: "core",
    title: "Ana İşlevler",
    order: 0,
    items: [
      { itemId: "dashboard", order: 0 },
      { itemId: "users", order: 1 },
      { itemId: "drivers", order: 2 },
      { itemId: "jobs", order: 3 },
      { itemId: "approvals", order: 4 },
    ],
  },
  {
    groupId: "finance",
    title: "Finans",
    order: 1,
    items: [
      { itemId: "orders", order: 0 },
      { itemId: "payments", order: 1 },
      { itemId: "packages", order: 2 },
    ],
  },
  {
    groupId: "ads",
    title: "Reklamlar",
    order: 2,
    items: [
      { itemId: "ad-campaigns", order: 0 },
      { itemId: "ad-packages", order: 1 },
      { itemId: "ad-requests", order: 2 },
      { itemId: "placements", order: 3 },
    ],
  },
  {
    groupId: "system",
    title: "Sistem",
    order: 3,
    items: [
      { itemId: "fields", order: 0 },
      { itemId: "groups", order: 1 },
      { itemId: "dynamic-roles", order: 2 },
      { itemId: "tasks", order: 3 },
      { itemId: "commit-logs", order: 4 },
    ],
  },
];
