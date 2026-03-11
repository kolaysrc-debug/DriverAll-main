// PATH: DriverAll-main/drivercv-frontend/lib/api/jobs.ts
// ======================================================
// Jobs API helper (same-origin /api)
// - Public: list, filters, published read
// - Auth: mine, create, update, publish, archive, delete
// - Admin: pending(draft) jobs
// ======================================================

import { authHeaders, handleJson } from "@/lib/api/_core";

const API_BASE_URL = "";

// ---------------------------
// PUBLIC
// ---------------------------
export async function fetchPublicJobs(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/api/jobs${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
  return handleJson(res);
}

export async function fetchJobFilters(country: string = "TR") {
  const qs = new URLSearchParams({ country }).toString();
  const res = await fetch(`${API_BASE_URL}/api/jobs/filters?${qs}`, {
    cache: "no-store",
  });
  return handleJson(res);
}

/**
 * Public read:
 * - Published job => public OK
 * - Draft/Archived => token varsa owner/admin erişebilir
 * Bu yüzden authHeaders() ekli (token yoksa zaten boş gider)
 */
export async function fetchJobById(id: string) {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(id)}`, {
    cache: "no-store",
    headers: { ...authHeaders() },
  });
  return handleJson(res);
}

// ---------------------------
// EMPLOYER / ADMIN (AUTH)
// ---------------------------
export async function fetchMyJobs() {
  const res = await fetch(`${API_BASE_URL}/api/jobs/mine`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  return handleJson(res);
}

export async function createJob(input: any) {
  const res = await fetch(`${API_BASE_URL}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input || {}),
  });
  return handleJson(res);
}

export async function updateJob(id: string, input: any) {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input || {}),
  });
  return handleJson(res);
}

export async function publishJob(id: string) {
  const res = await fetch(
    `${API_BASE_URL}/api/jobs/${encodeURIComponent(id)}/publish`,
    {
      method: "POST",
      headers: { ...authHeaders() },
    }
  );
  return handleJson(res);
}

export async function archiveJob(id: string) {
  const res = await fetch(
    `${API_BASE_URL}/api/jobs/${encodeURIComponent(id)}/archive`,
    {
      method: "POST",
      headers: { ...authHeaders() },
    }
  );
  return handleJson(res);
}

export async function deleteJob(id: string) {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleJson(res);
}

// ---------------------------
// ADMIN
// ---------------------------
export async function fetchPendingJobs() {
  const res = await fetch(`${API_BASE_URL}/api/jobs/pending`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  return handleJson(res);
}

export async function approveJob(id: string, body: any = {}) {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body || {}),
  });
  return handleJson(res);
}

export async function rejectJob(id: string, body: any = {}) {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body || {}),
  });
  return handleJson(res);
}
