// PATH: drivercv-frontend/lib/api/_core.ts
// ----------------------------------------------------------
// Shared API fetch helper (same-origin /api)
// - Adds Authorization header if token exists (via session.getToken)
// - Parses JSON and throws readable errors
// - 401/403 → clearSession + redirect to /register/auth
// ----------------------------------------------------------

import { getToken as sessionGetToken, clearSession } from "@/lib/session";

const API_BASE_URL = "";

export function authHeaders(): HeadersInit {
  const token = sessionGetToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function handleJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data && (data.message as string)) ||
      `İstek başarısız (status: ${res.status})`;
    throw new Error(`HTTP ${res.status}: ${String(msg)}`);
  }
  return data;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {};

  if (init.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(init.headers)) {
      for (const [key, value] of init.headers) headers[key] = value;
    } else {
      Object.assign(headers, init.headers as Record<string, string>);
    }
  }

  Object.assign(headers, authHeaders() as Record<string, string>);

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

/**
 * apiFetch with auto-redirect on 401/403.
 * Admin sayfaları bu versiyonu kullanmalı.
 */
export async function apiFetchWithAuth(path: string, init: RequestInit = {}) {
  try {
    return await apiFetch(path, init);
  } catch (err: any) {
    const msg = err?.message || "";
    if (msg.includes("401") || msg.includes("403")) {
      clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/register/auth";
      }
    }
    throw err;
  }
}
