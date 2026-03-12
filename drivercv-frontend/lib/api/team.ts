// PATH: drivercv-frontend/lib/api/team.ts
// Owner sub-user (team) API helpers

import { authHeaders, handleJson } from "@/lib/api/_core";

export async function fetchMyTeam() {
  const res = await fetch(`/api/owner/subusers`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  return handleJson(res);
}

export async function createSubUser(input: any) {
  const res = await fetch(`/api/owner/subusers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input || {}),
  });
  return handleJson(res);
}

export async function updateSubUser(id: string, input: any) {
  const res = await fetch(`/api/owner/subusers/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input || {}),
  });
  return handleJson(res);
}

export async function deleteSubUser(id: string) {
  const res = await fetch(`/api/owner/subusers/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleJson(res);
}

export async function toggleSubUserActive(id: string) {
  const res = await fetch(`/api/owner/subusers/${encodeURIComponent(id)}/toggle-active`, {
    method: "PUT",
    headers: { ...authHeaders() },
  });
  return handleJson(res);
}
