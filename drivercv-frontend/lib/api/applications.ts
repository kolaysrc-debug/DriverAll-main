// PATH: DriverAll-main/drivercv-frontend/lib/api/applications.ts
// ----------------------------------------------------------
// Applications API (Driver & Employer)
// - Driver: listMyApplications, applyToJob ✅ EKLENDİ
// - Employer/Admin: listEmployerApplications, listJobApplications
// - Update: updateApplication (status/score/employerNote/labelColor/meetingUrl)
// - Compatibility alias exports: fetchMyApplications, fetchEmployerApplications
// ----------------------------------------------------------

export type ApplicationStatus =
  | "new"
  | "reviewed"
  | "shortlisted"
  | "rejected"
  | "hired";

export type LabelColor = "none" | "red" | "yellow" | "orange" | "green";

export interface ApplicationDriver {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface ApplicationJob {
  _id: string;
  title?: string;
  country?: string;
  city?: string;
  location?: any;
}

export interface DriverApplication {
  _id: string;
  job: ApplicationJob;
  driver: ApplicationDriver;
  note?: string; // driver note
  status: ApplicationStatus;
  score?: number | null;

  // Employer değerlendirme alanları
  employerNote?: string;
  labelColor?: LabelColor;
  meetingUrl?: string;

  createdAt: string;
  updatedAt: string;
}

// Bazı ortamlarda backend proxy /api üzerinden, bazı ortamlarda mutlak URL ister.
// Bu yüzden: varsa NEXT_PUBLIC_API_URL kullan, yoksa boş bırak (relative /api).
const API_BASE_URL =
  (typeof process !== "undefined" && (process as any)?.env?.NEXT_PUBLIC_API_URL) ||
  "";

// ----------------------------------------------------------
// Auth Header
// ----------------------------------------------------------
function authHeaders() {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// ----------------------------------------------------------
// JSON helper
// ----------------------------------------------------------
async function readJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function pickMsg(data: any, fallback: string) {
  return String(data?.message || data?.error || fallback);
}

// ----------------------------------------------------------
// Driver: ilana başvur
// POST /api/jobs/:jobId/apply
// body: { note? }
// ----------------------------------------------------------
export async function applyToJob(jobId: string, payload?: { note?: string }) {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await readJsonSafe(res);

  if (res.status === 401) throw new Error(pickMsg(data, "Giriş yapmanız gerekiyor."));
  if (res.status === 403) throw new Error(pickMsg(data, "Bu işlem için yetkiniz yok."));
  if (!res.ok) throw new Error(pickMsg(data, "Başvuru gönderilemedi."));

  // backend { success, application, alreadyApplied? }
  return data?.application ?? data;
}

// ----------------------------------------------------------
// Driver: kendi başvurularım
// GET /api/my-applications
// ----------------------------------------------------------
export async function listMyApplications(): Promise<DriverApplication[]> {
  const res = await fetch(`${API_BASE_URL}/api/my-applications`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    cache: "no-store",
  });

  const data = await readJsonSafe(res);

  if (res.status === 401) throw new Error(pickMsg(data, "Giriş yapmanız gerekiyor."));
  if (res.status === 403) throw new Error(pickMsg(data, "Bu sayfayı görmek için yetkiniz yok."));
  if (!res.ok) throw new Error(pickMsg(data, "Başvurular alınamadı."));

  return (data?.applications ?? []) as DriverApplication[];
}

// ----------------------------------------------------------
// Employer/Admin: kendi ilanlarıma gelen başvurular (toplu)
// GET /api/employer/applications
// ----------------------------------------------------------
export async function listEmployerApplications(): Promise<DriverApplication[]> {
  const res = await fetch(`${API_BASE_URL}/api/employer/applications`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    cache: "no-store",
  });

  const data = await readJsonSafe(res);

  if (res.status === 401) throw new Error(pickMsg(data, "Giriş yapmanız gerekiyor."));
  if (res.status === 403) throw new Error(pickMsg(data, "Bu sayfayı görmek için yetkiniz yok."));
  if (!res.ok) throw new Error(pickMsg(data, "Başvurular alınamadı."));

  return (data?.applications ?? []) as DriverApplication[];
}

// ----------------------------------------------------------
// Employer/Admin: tek bir ilanın başvuruları
// GET /api/jobs/:jobId/applications
// ----------------------------------------------------------
export async function listJobApplications(jobId: string): Promise<DriverApplication[]> {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/applications`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    cache: "no-store",
  });

  const data = await readJsonSafe(res);

  if (res.status === 401) throw new Error(pickMsg(data, "Giriş yapmanız gerekiyor."));
  if (res.status === 403) throw new Error(pickMsg(data, "Bu ilana erişim yetkiniz yok."));
  if (!res.ok) throw new Error(pickMsg(data, "İlana ait başvurular alınamadı."));

  return (data?.applications ?? []) as DriverApplication[];
}

// ----------------------------------------------------------
// Employer/Admin: başvuru güncelle
// PATCH /api/applications/:id
// body: { status?, score?, employerNote?, labelColor?, meetingUrl? }
// ----------------------------------------------------------
export async function updateApplication(
  id: string,
  payload: Partial<{
    status: ApplicationStatus;
    score: number | null;
    note: string;
    employerNote: string;
    labelColor: LabelColor;
    meetingUrl: string;
  }>
): Promise<DriverApplication> {
  const res = await fetch(`${API_BASE_URL}/api/applications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await readJsonSafe(res);

  if (res.status === 401) throw new Error(pickMsg(data, "Giriş yapmanız gerekiyor."));
  if (res.status === 403) throw new Error(pickMsg(data, "Bu başvuruyu güncellemek için yetkiniz yok."));
  if (!res.ok) throw new Error(pickMsg(data, "Başvuru güncellenemedi."));

  return (data?.application ?? data) as DriverApplication;
}

// ----------------------------------------------------------
// Compatibility exports (alias)
// ----------------------------------------------------------
export const fetchMyApplications = listMyApplications;
export const fetchEmployerApplications = listEmployerApplications;
