// PATH: drivercv-frontend/lib/api/branches.ts
// Branches API helper (same-origin /api)

import { authHeaders, handleJson } from "@/lib/api/_core";

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
