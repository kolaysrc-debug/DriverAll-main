// PATH: DriverAll-main/drivercv-frontend/app/page.tsx
// ----------------------------------------------------------
// Server Component — veriyi server-side çekip client'a aktarır.
// Görsel aynı kalır, performans artar (SSR + cache).
// ----------------------------------------------------------

import HomePageClient from "@/components/HomePageClient";

const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:3001";

async function safeFetch<T>(path: string, fallback: T, revalidate = 60): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate },
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return fallback;
    const json = await res.json();
    return json as T;
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  // Server-side parallel data fetch — 60s cache (ISR)
  const [jobsData, statsData, packagesData, citiesData, subRolesData] = await Promise.all([
    safeFetch<any>("/api/jobs?country=TR&page=1&limit=50", { jobs: [] }),
    safeFetch<any>("/api/jobs/stats?country=TR&limit=5", { topJobs: [], topCities: [] }),
    safeFetch<any>("/api/packages?type=JOB&country=TR", { packages: [] }),
    safeFetch<any>("/api/locations/list?country=TR&level=city", { list: [] }),
    safeFetch<any>("/api/public/roles/candidate-subroles", { subRoles: [] }),
  ]);

  const initialJobs = Array.isArray(jobsData?.jobs) ? jobsData.jobs : [];
  const initialStats = {
    topJobs: Array.isArray(statsData?.topJobs) ? statsData.topJobs : [],
    topCities: Array.isArray(statsData?.topCities) ? statsData.topCities : [],
  };
  const initialPackages = Array.isArray(packagesData?.packages) ? packagesData.packages : [];
  const initialCities = Array.isArray(citiesData?.list)
    ? citiesData.list
    : Array.isArray(citiesData?.locations)
    ? citiesData.locations
    : [];
  const initialSubRoles = (Array.isArray(subRolesData?.subRoles) ? subRolesData.subRoles : [])
    .map((x: any) => ({
      key: String(x?.key || "").trim(),
      label: String(x?.label || x?.key || "").trim(),
      description: String(x?.description || "").trim() || undefined,
    }))
    .filter((x: any) => !!x.key);

  return (
    <HomePageClient
      initialJobs={initialJobs}
      initialCities={initialCities}
      initialSubRoles={initialSubRoles}
      initialStats={initialStats}
      initialPackages={initialPackages}
    />
  );
}

