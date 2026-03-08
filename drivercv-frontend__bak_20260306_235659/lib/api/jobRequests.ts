// PATH: drivercv-frontend/lib/api/jobRequests.ts

type AnyObj = Record<string, any>;

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function json(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.message as string)) || `İstek başarısız (status: ${res.status})`;
    throw new Error(`HTTP ${res.status}: ${String(msg)}`);
  }
  return data;
}

// Employer create request
export async function createJobRequest(body: AnyObj) {
  const res = await fetch("/api/job-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return json(res); // { success, jobRequest, job? }
}

export async function fetchMyJobRequests() {
  const res = await fetch("/api/job-requests/mine", { headers: authHeaders(), cache: "no-store" });
  return json(res); // { success, list }
}

// Admin list/approve/reject
export async function fetchAdminJobRequests(status: "pending" | "approved" | "rejected" = "pending") {
  const res = await fetch(`/api/job-requests/admin/list?status=${encodeURIComponent(status)}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  return json(res);
}

export async function approveJobRequest(id: string, body?: AnyObj) {
  const res = await fetch(`/api/job-requests/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body || {}),
  });
  return json(res);
}

export async function rejectJobRequest(id: string, body?: AnyObj) {
  const res = await fetch(`/api/job-requests/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body || {}),
  });
  return json(res);
}
