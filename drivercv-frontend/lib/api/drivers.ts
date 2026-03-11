// DriverAll-main/drivercv-frontend/lib/api/drivers.ts

import { apiFetch } from "@/lib/api/_core";

export type DriverCvInfo = {
  hasCv: boolean;
  updatedAt?: string | null;
  filledKeysCount?: number;
};

export type ProviderLimits = {
  allowedCountries?: string[];
  allowedCityCodes?: string[];
  allowedDistrictCodes?: string[];
};

export type DriverUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  isApproved?: boolean;
  notes?: string;
  createdAt?: string;
  cvInfo?: DriverCvInfo; // 🔹 CV özeti

  subRoles?: string[]; // Alt roller
  activityAreas?: string[];
  providerLimits?: ProviderLimits;
};

// ------------------------------------------------------
// Liste
// ------------------------------------------------------
export async function listDrivers(): Promise<DriverUser[]> {
  const data = await apiFetch("/api/drivers");
  return (data as any).users || [];
}

// ------------------------------------------------------
// Güncelle (isim, rol, aktif, onay vs.)
// ------------------------------------------------------
export async function updateDriver(
  id: string,
  updates: Partial<DriverUser>
): Promise<DriverUser> {
  const data = await apiFetch(`/api/drivers/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });

  return (data as any).user as DriverUser;
}

// ------------------------------------------------------
// Sil
// ------------------------------------------------------
export async function deleteDriver(id: string): Promise<void> {
  await apiFetch(`/api/drivers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
