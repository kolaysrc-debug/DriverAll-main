// PATH: DriverAll-main/drivercv-backend/constants/roles.js
// ----------------------------------------------------------
// Ana Roller - Sabit (Değiştirilemez)
// ----------------------------------------------------------

const MAIN_ROLES = {
  CANDIDATE: {
    name: 'candidate',
    displayName: 'Aday',
    description: 'İş arayan adaylar',
    category: 'candidate',
    level: 0,
    isSystem: true,
    isActive: true,
    icon: '👤',
    color: '#8b5cf6',
    sortOrder: 1,
    criteria: [],
    permissions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  EMPLOYER: {
    name: 'employer',
    displayName: 'İşveren / Firma',
    description: 'İşveren ve firma temsilcileri',
    category: 'employer',
    level: 0,
    isSystem: true,
    isActive: true,
    icon: '🏢',
    color: '#10b981',
    sortOrder: 2,
    criteria: [],
    permissions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  ADVERTISER: {
    name: 'advertiser',
    displayName: 'Reklamveren',
    description: 'Reklam veren firmalar',
    category: 'advertiser',
    level: 0,
    isSystem: true,
    isActive: true,
    icon: '📢',
    color: '#f59e0b',
    sortOrder: 3,
    criteria: [],
    permissions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  SERVICE_PROVIDER: {
    name: 'service_provider',
    displayName: 'Hizmet Veren',
    description: 'Kurs, eğitim, destek hizmetleri sağlayıcılar',
    category: 'service_provider',
    level: 0,
    isSystem: true,
    isActive: true,
    icon: '🎓',
    color: '#06b6d4',
    sortOrder: 4,
    criteria: [],
    permissions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  ADMIN: {
    name: 'admin',
    displayName: 'Admin',
    description: 'Sistem yöneticileri',
    category: 'admin',
    level: 0,
    isSystem: true,
    isActive: true,
    icon: '👨‍💼',
    color: '#ef4444',
    sortOrder: 5,
    criteria: [],
    permissions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

// Ana rol isimlerini array olarak
const MAIN_ROLE_NAMES = Object.values(MAIN_ROLES).map(r => r.name);

// Ana rol kontrolü
function isMainRole(roleName) {
  return MAIN_ROLE_NAMES.includes(roleName);
}

// Ana rolleri array olarak döndür
function getMainRoles() {
  return Object.values(MAIN_ROLES);
}

// Ana rol bilgisini getir
function getMainRole(roleName) {
  return Object.values(MAIN_ROLES).find(r => r.name === roleName) || null;
}

module.exports = {
  MAIN_ROLES,
  MAIN_ROLE_NAMES,
  isMainRole,
  getMainRoles,
  getMainRole,
};
