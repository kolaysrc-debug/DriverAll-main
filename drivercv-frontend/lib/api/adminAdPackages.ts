// PATH: DriverAll-main/drivercv-frontend/lib/api/adminAdPackages.ts

type AnyObj = Record<string, any>;

function qs(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && String(v).trim() !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function json(method: string, path: string, body?: AnyObj) {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;

  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let data: AnyObj = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { success: false, message: "invalid json", raw: text };
  }

  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

export async function listAdPackages(params?: { country?: string; q?: string }) {
  const country = params?.country ? String(params.country).toUpperCase() : undefined;
  const q = params?.q ? String(params.q) : undefined;
  return json("GET", `/api/admin/ad-packages${qs({ country, q })}`);
}

export async function createAdPackage(payload: AnyObj) {
  return json("POST", `/api/admin/ad-packages`, payload);
}

export async function updateAdPackage(id: string, payload: AnyObj) {
  return json("PUT", `/api/admin/ad-packages/${encodeURIComponent(id)}`, payload);
}

export async function deleteAdPackage(id: string) {
  return json("DELETE", `/api/admin/ad-packages/${encodeURIComponent(id)}`);
}
