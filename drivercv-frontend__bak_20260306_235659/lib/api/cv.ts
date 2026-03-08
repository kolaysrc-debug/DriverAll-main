// DriverAll-main/drivercv-frontend/lib/api/cv.ts

export type CvValues = Record<string, any>;

export type CvResponse = {
  _id?: string;
  userId?: string;
  values: CvValues;
};

const API_BASE_URL = "";

// Bu helper, token'ı header'a ekleyerek /api/cv ile konuşur
async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  const method = (options.method || "GET").toUpperCase();
  const hasBody = !!options.body;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

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
      (data as any).message || `İstek başarısız (status: ${res.status})`;
    throw new Error(String(message));
  }

  return data;
}

export async function getCv(): Promise<CvResponse | null> {
  try {
    const data = await apiFetch("/api/cv");
    const cv = (data as any).cv;
    return (cv || null) as CvResponse | null;
  } catch (err: any) {
    // Login yoksa 401 alırız, bunu "CV yok" gibi düşünelim
    if (err.message && err.message.includes("Yetkisiz")) {
      return null;
    }
    throw err;
  }
}

export async function saveCv(values: CvValues): Promise<CvResponse> {
  const data = await apiFetch("/api/cv", {
    method: "PUT",
    body: JSON.stringify({ values }),
  });

  return (data as any).cv as CvResponse;
}
