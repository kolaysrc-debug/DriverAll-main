// PATH: DriverAll-main/drivercv-frontend/lib/api/publicJobs.ts

type AnyObj = Record<string, any>;

async function getJson(path: string) {
  // IMPORTANT: Codespaces uyumu için ABSOLUTE yok; aynı origin üzerinden /api
  const res = await fetch(path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const text = await res.text();
  let data: AnyObj = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { success: false, message: "invalid json", raw: text };
  }

  if (!res.ok) {
    const msg = data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function qs(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && String(v).trim() !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// ---------------------------
// JOBS
// ---------------------------
export async function fetchJobFilters(country: string) {
  const cc = String(country || "TR").toUpperCase();
  return getJson(`/api/jobs/filters${qs({ country: cc })}`);
}

export async function fetchPublicJobs(params: Record<string, string>) {
  const cc = String(params.country || "TR").toUpperCase();
  const qParams = { ...params, country: cc };
  return getJson(`/api/jobs${qs(qParams)}`);
}
// Public detail (published job)
export async function fetchPublicJobById(id: string) {
  if (!id) throw new Error("job id required");

  const res = await fetch(`/api/jobs/${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      (data && (data.message as string)) ||
      `İstek başarısız (status: ${res.status})`;
    throw new Error(msg);
  }

  return data; // backend: { success: true, job }
}
// ---------------------------
// LOCATIONS
// ---------------------------
export async function fetchLocationsList(
  country: string,
  level: "region" | "state" | "city" | "district",
  parentCode?: string
) {
  const cc = String(country || "TR").toUpperCase();
  return getJson(
    `/api/locations/list${qs({
      country: cc,
      level,
      parentCode: parentCode ? String(parentCode) : undefined,
    })}`
  );
}
