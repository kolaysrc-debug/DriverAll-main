/**
 * ROUTE: /types/profile-engine.ts (Güncellendi)
 */
export type SubRole = "driver" | "operator" | "courier" | "valet";

export interface RoleConfig {
  key: SubRole;
  label: string;
  description: string;
}

export const CANDIDATE_SUB_ROLES: RoleConfig[] = [
  { key: "driver", label: "Sürücü", description: "Ağır vasıta veya binek araç sürücüsü" },
  { key: "operator", label: "İş Makinesi Operatörü", description: "Forklift, Ekskavatör vb. operatörü" },
  { key: "courier", label: "Kurye", description: "Motorlu veya arabalı kurye" },
  { key: "valet", label: "Vale", description: "Otopark ve vale hizmetleri" }
];