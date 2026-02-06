// /drivercv-frontend/lib/api/profile.ts

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

// Frontend hep kendi origin'ine /api/... isteği atacak.
// Next.js bunu backend'e forward ediyor (next.config.ts içindeki rewrites ile).
const API_BASE_URL = "";

async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  const method = (options.method || "GET").toUpperCase();
  const hasBody = !!options.body;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // Tarayıcı tarafında token'ı header'a ekle
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Body varsa JSON header ekle
  if (hasBody && method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    method,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (data as any).message ||
      `İstek başarısız (status: ${res.status})`;
    throw new Error(String(message));
  }

  return data;
}

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
