// PATH: drivercv-frontend/lib/api/serviceListings.ts
// ----------------------------------------------------------
// Service Listings API helpers
// ----------------------------------------------------------

import { apiFetch } from "./_core";

export async function fetchMyServiceListings() {
  return apiFetch("/api/service-listings/mine");
}

export async function fetchServiceListing(id: string) {
  return apiFetch(`/api/service-listings/${id}`);
}

export async function createServiceListing(body: Record<string, unknown>) {
  return apiFetch("/api/service-listings", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateServiceListing(id: string, body: Record<string, unknown>) {
  return apiFetch(`/api/service-listings/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteServiceListing(id: string) {
  return apiFetch(`/api/service-listings/${id}`, { method: "DELETE" });
}

export async function searchServiceListings(params: { category?: string; stateCode?: string; q?: string }) {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.stateCode) qs.set("stateCode", params.stateCode);
  if (params.q) qs.set("q", params.q);
  return apiFetch(`/api/service-listings/public/search?${qs.toString()}`);
}
