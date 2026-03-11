/**
 * ROUTE: /types/role-engine.ts
 * Alt roller artık DB'den dinamik geliyor (GET /api/public/roles/candidate-subroles).
 * Bu dosya sadece tip tanımları ve legacy fallback içerir.
 */
export type SubRole = string;

export interface RoleConfig {
  key: string;
  label: string;
  description: string;
}

// Legacy fallback — DB boşsa veya API çağrısı başarısız olursa kullanılır.
// Gerçek kaynak: Role koleksiyonu (category: "candidate", level > 0)
export const CANDIDATE_SUB_ROLES: RoleConfig[] = [
  { key: "driver", label: "Sürücü", description: "Ağır vasıta veya binek araç sürücüsü" },
  { key: "operator", label: "İş Makinesi Operatörü", description: "Forklift, Ekskavatör vb. operatörü" },
  { key: "courier", label: "Kurye", description: "Motorlu veya arabalı kurye" },
  { key: "valet", label: "Vale", description: "Otopark ve vale hizmetleri" },
];