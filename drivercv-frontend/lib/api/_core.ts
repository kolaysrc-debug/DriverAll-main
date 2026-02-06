// PATH: drivercv-frontend/lib/api/_core.ts
// ----------------------------------------------------------
// Shared API fetch helper (same-origin /api)
// - Adds Authorization header if token exists
// - Parses JSON and throws readable errors
// ----------------------------------------------------------

const API_BASE_URL = "";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}

export function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function handleJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data && (data.message as string)) ||
      `İstek başarısız (status: ${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers: HeadersInit = {
    ...(init.headers || {}),
    ...authHeaders(),
  };

  // JSON body varsa content-type ekle
  const hasBody = init.body !== undefined && init.body !== null;
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  if (hasBody && !isFormData) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  return handleJson(res);
}
