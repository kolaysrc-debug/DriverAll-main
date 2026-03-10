// PATH: drivercv-frontend/lib/api/ads.ts

import { apiFetch } from "@/lib/api/_core";

// ----------------------------------------------------------
// Public
// ----------------------------------------------------------
export async function fetchPublicAdPackages(country?: string) {
  const qs = new URLSearchParams();
  if (country) qs.set("country", String(country).toUpperCase());
  return apiFetch(`/api/public/ad-packages?${qs.toString()}`, { method: "GET" });
}

// ----------------------------------------------------------
// Advertiser/Employer
// ----------------------------------------------------------
export async function createAdRequest(payload: any) {
  return apiFetch(`/api/ads/requests`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function fetchMyAdRequests() {
  return apiFetch(`/api/ads/requests/mine`, { method: "GET" });
}

export async function fetchAdById(id: string) {
  return apiFetch(`/api/ads/${encodeURIComponent(id)}`, { method: "GET" });
}

export async function updateAd(
  id: string,
  payload: {
    title?: string;
    description?: string;
    imageUrl?: string;
    targetUrl?: string;
    countryTargets?: string[];
  }
) {
  return apiFetch(`/api/ads/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload || {}),
  });
}

// ----------------------------------------------------------
// Admin
// ----------------------------------------------------------
export async function fetchAdminAdPackages() {
  return apiFetch(`/api/admin/ad-packages`, { method: "GET" });
}

export async function createAdPackage(payload: any) {
  return apiFetch(`/api/admin/ad-packages`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function updateAdPackage(id: string, payload: any) {
  return apiFetch(`/api/admin/ad-packages/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload || {}),
  });
}

export async function deleteAdPackage(id: string) {
  return apiFetch(`/api/admin/ad-packages/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function fetchAdminAdRequests(status = "pending") {
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  return apiFetch(`/api/ads/requests/admin/list?${qs.toString()}`, { method: "GET" });
}

export async function approveAdRequest(id: string, payload?: any) {
  return apiFetch(`/api/ads/requests/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function rejectAdRequest(id: string, payload?: any) {
  return apiFetch(`/api/ads/requests/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}
