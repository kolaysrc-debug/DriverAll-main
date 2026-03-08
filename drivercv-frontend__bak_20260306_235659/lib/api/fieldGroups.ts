// DriverAll-main/drivercv-frontend/lib/api/fieldGroups.ts - 25.01.2026
// --------------------------------------------------------------------------------
// Updated with Unified Rule Engine support (zones, coverage, requiredWith)
// --------------------------------------------------------------------------------

export type FieldGroupNode = {
  key: string;
  label: string;
  level?: number;
  parentKey?: string | null;
  sortOrder?: number;
  zones?: string[];       // NEW: Regional validity (TR, EU, etc.)
  coverage?: string[];    // NEW: Hierarchical coverage (e.g., B covers M)
  requiredWith?: string[];// NEW: Prerequisites (e.g., Tanker needs Basic)
  isDefault?: boolean;
  active?: boolean;
};

export type FieldGroup = {
  _id: string;
  groupKey: string;
  groupLabel: string;
  description?: string;
  domain?: string | null;
  category?: string | null;
  country: string;
  sortOrder?: number;
  selectionMode?: "multi" | "single";
  validityModel?: string;
  maxAge?: number | null;
  durationYearsFromIssue?: number | null;
  required?: boolean;
  active?: boolean;
  nodes: FieldGroupNode[];
  createdAt?: string;
  updatedAt?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function fetchJson(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  let data: any = null;

  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await res.text();
      data = text ? { message: text } : null;
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `İstek başarısız (status: ${res.status})`;
    throw new Error(msg);
  }

  return data;
}

// ----------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------

export async function listFieldGroups(): Promise<FieldGroup[]> {
  const data = await fetchJson("/api/admin/field-groups");
  return (data?.groups ?? []) as FieldGroup[];
}

export async function createFieldGroup(payload: {
  groupLabel: string;
  groupKey?: string | null;
  description?: string;
  domain?: string | null;
  category?: string | null;
  country?: string | null;
  selectionMode?: "multi" | "single";
  validityModel?: string;
  maxAge?: number | null;
  durationYearsFromIssue?: number | null;
  required?: boolean;
}) {
  const data = await fetchJson("/api/admin/field-groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.group as FieldGroup;
}

export async function updateFieldGroup(
  id: string,
  payload: Partial<{
    groupLabel: string;
    description: string;
    domain: string | null;
    category: string | null;
    country: string | null;
    sortOrder: number;
    selectionMode: "multi" | "single";
    validityModel: string;
    maxAge: number | null;
    durationYearsFromIssue: number | null;
    required: boolean;
    active: boolean;
  }>
) {
  const data = await fetchJson(`/api/admin/field-groups/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data.group as FieldGroup;
}

export async function deleteFieldGroup(id: string) {
  await fetchJson(`/api/admin/field-groups/${id}`, {
    method: "DELETE",
  });
}

export async function addFieldGroupNode(
  groupId: string,
  payload: {
    key: string;
    label: string;
    parentKey?: string | null;
    level?: number;
    sortOrder?: number;
    zones?: string[];
    coverage?: string[];
    requiredWith?: string[];
  }
) {
  const data = await fetchJson(`/api/admin/field-groups/${groupId}/nodes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.group as FieldGroup;
}

export async function updateFieldGroupNode(
  groupId: string,
  nodeKey: string,
  payload: Partial<{
    key: string;
    label: string;
    parentKey: string | null;
    level: number;
    sortOrder: number;
    active: boolean;
    zones: string[];       // Added to support rule engine
    coverage: string[];    // Already here, but ensured
    requiredWith: string[];// Already here, but ensured
  }>
) {
  const data = await fetchJson(
    `/api/admin/field-groups/${groupId}/nodes/${encodeURIComponent(nodeKey)}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
  return data.group as FieldGroup;
}

export async function deleteFieldGroupNode(groupId: string, nodeKey: string) {
  const data = await fetchJson(
    `/api/admin/field-groups/${groupId}/nodes/${encodeURIComponent(nodeKey)}`,
    {
      method: "DELETE",
    }
  );
  return data.group as FieldGroup;
}