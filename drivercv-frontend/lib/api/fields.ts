// DriverAll-main/drivercv-frontend/lib/api/fields.ts

import { authHeaders as getAuthHeaders } from "@/lib/api/_core";

export type FieldDefinition = {
  _id: string;
  key: string;
  label: string;
  // yeni alanlar
  groupKey?: string | null;
  groupLabel?: string | null;
  country?: string;
  fieldType?: "boolean" | "date" | "string" | "number" | "select";
  uiType?:
    | "text"
    | "number"
    | "boolean"
    | "date"
    | "select"
    | "multiselect";
  category?: "profile" | "job" | "global";
  showInCv?: boolean;
  showInJobFilter?: boolean;
  requiresIssueDate?: boolean;
  hasExpiry?: boolean;
  validityYears?: number | null;
  validityModel?: string;
  expiryMode?: "none" | "age" | "durationFromIssue";
  maxAge?: number | null;
  durationYearsFromIssue?: number | null;
  expiryRequired?: boolean;
  qualityScore?: number | null;
  notification?: any;
  coversKeys?: string[];
  requiresKeys?: string[];
  optionsGroupKey?: string | null;
  active?: boolean;
  roles?: string[];
  engines?: {
    profile?: boolean;
    jobs?: boolean;
    searchFilter?: boolean;
    matching?: boolean;
  };
  countries?: string[];
  createdAt?: string;
  updatedAt?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

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

export async function listFields(params?: {
  category?: string;
}): Promise<FieldDefinition[]> {
  const search = params?.category
    ? `?category=${encodeURIComponent(params.category)}`
    : "";
  const data = await fetchJson(`/api/admin/fields${search}`);
  return (data?.fields ?? []) as FieldDefinition[];
}

export async function getField(id: string) {
  const data = await fetchJson(`/api/admin/fields/${id}`);
  return data.field as FieldDefinition;
}

export async function createField(payload: Partial<FieldDefinition>) {
  const data = await fetchJson("/api/admin/fields", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.field as FieldDefinition;
}

export async function updateField(
  id: string,
  payload: Partial<FieldDefinition>
) {
  const data = await fetchJson(`/api/admin/fields/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data.field as FieldDefinition;
}

export async function deleteField(id: string) {
  await fetchJson(`/api/admin/fields/${id}`, {
    method: "DELETE",
  });
}
