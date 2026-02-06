// DriverAll-main/drivercv-frontend/lib/api/groups.ts

export type FieldGroupNode = {
  key: string;
  label: string;
  level?: number;
  parentKey?: string | null;
  sortOrder?: number;
  coverage?: string[];
  requiredWith?: string[];
  isDefault?: boolean;
  active?: boolean;
  metadata?: Record<string, any>;
};

export type FieldGroup = {
  _id: string;
  groupKey: string;
  groupLabel: string;
  description?: string;
  domain?: string | null;
  category?: string | null;
  country?: string | null;
  validityModel?: "none" | "age" | "durationFromIssue";
  maxAge?: number | null;
  durationYearsFromIssue?: number | null;
  required?: boolean;
  active?: boolean;
  nodes: FieldGroupNode[];
};

const API_BASE_URL = "";

// Aynı profil.ts mantığıyla
async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  const method = (options.method || "GET").toUpperCase();
  const hasBody = !!options.body;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // Tarayıcı tarafında token'ı header'a ekle
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  if (hasBody && method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    method,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (data as any).message ||
      `İstek başarısız (status: ${res.status})`;
    throw new Error(String(message));
  }

  return data;
}

// ------------------------------------------------------
// GRUP LİSTESİ
// ------------------------------------------------------
export async function listGroups(): Promise<FieldGroup[]> {
  const data = await apiFetch("/api/admin/field-groups");
  return (data as any).groups || [];
}

// ------------------------------------------------------
// GRUP OLUŞTUR
// ------------------------------------------------------
export async function createGroup(payload: {
  groupLabel: string;
  groupKey?: string;
  description?: string;
}): Promise<FieldGroup> {
  const body: any = {
    groupLabel: payload.groupLabel.trim(),
  };

  if (payload.groupKey && payload.groupKey.trim()) {
    body.groupKey = payload.groupKey.trim();
  }
  if (payload.description && payload.description.trim()) {
    body.description = payload.description.trim();
  }

  const data = await apiFetch("/api/admin/field-groups", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return (data as any).group as FieldGroup;
}

// ------------------------------------------------------
// GRUP GÜNCELLE
// ------------------------------------------------------
export async function updateGroup(
  id: string,
  updates: Partial<FieldGroup>
): Promise<FieldGroup> {
  const body: any = {};

  if (updates.groupKey !== undefined) body.groupKey = updates.groupKey;
  if (updates.groupLabel !== undefined) body.groupLabel = updates.groupLabel;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.domain !== undefined) body.domain = updates.domain;
  if (updates.category !== undefined) body.category = updates.category;
  if (updates.country !== undefined) body.country = updates.country;
  if (updates.validityModel !== undefined)
    body.validityModel = updates.validityModel;
  if (updates.maxAge !== undefined) body.maxAge = updates.maxAge;
  if (updates.durationYearsFromIssue !== undefined)
    body.durationYearsFromIssue = updates.durationYearsFromIssue;
  if (updates.required !== undefined) body.required = updates.required;
  if (updates.active !== undefined) body.active = updates.active;

  const data = await apiFetch(`/api/admin/field-groups/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  return (data as any).group as FieldGroup;
}

// ------------------------------------------------------
// GRUP SİL
// ------------------------------------------------------
export async function deleteGroup(id: string): Promise<void> {
  await apiFetch(`/api/admin/field-groups/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ------------------------------------------------------
// NODE EKLE
// ------------------------------------------------------
export async function addNode(
  groupId: string,
  payload: {
    key: string;
    label: string;
    parentKey?: string | null;
    level?: number;
    sortOrder?: number;
  }
): Promise<FieldGroup> {
  const body: any = {
    key: payload.key.trim(),
    label: payload.label.trim(),
  };

  if (payload.parentKey !== undefined) {
    body.parentKey = payload.parentKey || null;
  }
  if (payload.level !== undefined) {
    body.level = payload.level;
  }
  if (payload.sortOrder !== undefined) {
    body.sortOrder = payload.sortOrder;
  }

  const data = await apiFetch(
    `/api/admin/field-groups/${encodeURIComponent(groupId)}/nodes`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return (data as any).group as FieldGroup;
}

// ------------------------------------------------------
// NODE GÜNCELLE
// ------------------------------------------------------
export async function updateNode(
  groupId: string,
  nodeKey: string,
  updates: Partial<FieldGroupNode>
): Promise<FieldGroup> {
  const data = await apiFetch(
    `/api/admin/field-groups/${encodeURIComponent(
      groupId
    )}/nodes/${encodeURIComponent(nodeKey)}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    }
  );

  return (data as any).group as FieldGroup;
}

// ------------------------------------------------------
// NODE SİL
// ------------------------------------------------------
export async function deleteNode(
  groupId: string,
  nodeKey: string
): Promise<FieldGroup> {
  const data = await apiFetch(
    `/api/admin/field-groups/${encodeURIComponent(
      groupId
    )}/nodes/${encodeURIComponent(nodeKey)}`,
    {
      method: "DELETE",
    }
  );

  return (data as any).group as FieldGroup;
}
