// /drivercv-frontend/lib/api/profile.ts

import { apiFetch } from "@/lib/api/_core";

export type Role = "driver" | "company" | "advertiser";

export type ProfileData = {
  role: Role;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  about: string;
  experienceYears: number | null;
  dynamicValues?: Record<string, any>;
};

// Admin panelindeki kriter motorundan gelen alan tipi
export type ProfileSchemaField = {
  _id: string;
  key: string;
  label: string;
  uiType: "text" | "number" | "boolean" | "date" | "select" | "multiselect";
  required: boolean;
  countries?: string[];
  validityYears?: number | null;
  expiryRequired?: boolean;
  active?: boolean;
};

// ---------------------------------------------------------------------
//  KULLANICI PROFİLİ
// ---------------------------------------------------------------------

export async function getMyProfile(): Promise<ProfileData | null> {
  const data = await apiFetch("/api/profile/me");
  // backend büyük ihtimalle { profile: {...} } döndürüyor
  return (data as any).profile || null;
}

export async function updateMyProfile(payload: ProfileData) {
  const data = await apiFetch("/api/profile/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return data;
}
// TÜM PROFİLLERİ LİSTELEME (şimdilik basit)
export async function listProfiles(): Promise<ProfileData[]> {
  const data = await apiFetch("/api/profile/list");
  return (data as any).profiles || [];
}

// ---------------------------------------------------------------------
//  PROFİL KRİTER ŞEMASI (Ana makine tarafı)
// ---------------------------------------------------------------------

export async function getProfileSchema(): Promise<ProfileSchemaField[]> {
  const data = await apiFetch("/api/admin/fields?category=profile");
  return (data as any).fields || [];
}
