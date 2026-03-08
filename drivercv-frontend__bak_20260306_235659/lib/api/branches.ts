// PATH: drivercv-frontend/lib/api/branches.ts
// Branches API helper (same-origin /api)

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function handleJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.message as string)) || `İstek başarısız (status: ${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export async function fetchMyBranches() {
  const res = await fetch(`/api/branches/mine`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  return handleJson(res);
}

export async function createBranch(input: any) {
  const res = await fetch(`/api/branches`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input || {}),
  });
  return handleJson(res);
}

export async function updateBranch(id: string, input: any) {
  const res = await fetch(`/api/branches/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input || {}),
  });
  return handleJson(res);
}

export async function deleteBranch(id: string) {
  const res = await fetch(`/api/branches/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleJson(res);
}
