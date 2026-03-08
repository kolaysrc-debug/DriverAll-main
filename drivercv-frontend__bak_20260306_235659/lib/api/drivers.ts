// DriverAll-main/drivercv-frontend/lib/api/drivers.ts

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

  activityAreas?: string[];
  providerLimits?: ProviderLimits;
};

const API_BASE_URL = "";

// Ortak fetch helper (token ekliyor)
async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  const method = (options.method || "GET").toUpperCase();
  const hasBody = !!options.body;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // Tarayıcıdaysak token'ı header'a ekle
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

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
      (data as any).message || `İstek başarısız (status: ${res.status})`;
    throw new Error(`HTTP ${res.status}: ${String(message)}`);
  }

  return data;
}

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
