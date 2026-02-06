// PATH: DriverAll-main/drivercv-frontend/lib/api/adRequests.ts

import { apiFetch } from "@/lib/api/_core";

export async function fetchMyAdRequests() {
  return apiFetch(`/api/ad-requests/mine`, { method: "GET" });
}

export async function createAdRequestFromAd(adId: string, payload: any) {
  return apiFetch(`/api/ad-requests/from-ad/${encodeURIComponent(adId)}`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function fetchAdminAdRequests(status: string = "pending") {
  return apiFetch(`/api/ad-requests/admin/list?status=${encodeURIComponent(status)}`, { method: "GET" });
}

export async function approveAdRequest(id: string, payload?: any) {
  return apiFetch(`/api/ad-requests/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function rejectAdRequest(id: string, payload?: any) {
  return apiFetch(`/api/ad-requests/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}
