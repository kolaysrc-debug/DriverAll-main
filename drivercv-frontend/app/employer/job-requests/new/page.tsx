"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/job-requests/new/page.tsx
// ----------------------------------------------------------
// Employer Job Request Create (İlan Talebi Oluştur)
// - GET  /api/jobs/mine                         (auth)
// - GET  /api/public/job-packages?country=TR     (public)
// - POST /api/job-requests/from-job/:jobId       (auth)
// Akış: İlan seç → Paket + Placement seç → Talep gönder → Admin onayı → Yayın
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import EmployerOnly from "@/components/EmployerOnly";
import Link from "next/link";

type JobRow = {
  _id: string;
  title?: string;
  status?: string;
  createdAt?: string;
};

type Placement = {
  key: string;
  label?: string;
  maxDays?: number;
  notes?: string;
};

type JobPackage = {
  _id: string;
  name: string;
  country?: string;
  geoLevel?: string;
  placements?: Placement[];
  durationDays?: number;
  maxJobs?: number;
  price?: number;
  currency?: string;
  requiresAdminApproval?: boolean;
  restrictedBusinessTypes?: string[];
  active?: boolean;
};

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}
function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function EmployerJobRequestNewPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [packages, setPackages] = useState<JobPackage[]>([]);

  const [jobId, setJobId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [placementKey, setPlacementKey] = useState("");
  const [requestedDays, setRequestedDays] = useState<number>(7);

  async function loadAll() {
    setLoading(true);
    setErr(null);
    setOkMsg(null);

    try {
      // 1) Employer jobs (auth)
      const rJobs = await fetch("/api/jobs/mine", { headers: authHeaders(), cache: "no-store" });
      const dJobs = await rJobs.json().catch(() => null);
      if (!rJobs.ok) throw new Error(dJobs?.message || "İlanlarım alınamadı.");
      setJobs(Array.isArray(dJobs?.jobs) ? dJobs.jobs : []);

      // 2) Job packages (public)
      const rPkg = await fetch("/api/public/job-packages?country=TR", { cache: "no-store" });
      const dPkg = await rPkg.json().catch(() => null);
      if (!rPkg.ok) throw new Error(dPkg?.message || "Paketler alınamadı.");
      const list = Array.isArray(dPkg?.list) ? dPkg.list : [];
      setPackages(list);

      // defaults
      if (list[0]?._id) setPackageId(list[0]._id);
    } catch (e: any) {
      setErr(e?.message || "Beklenmeyen hata.");
      setJobs([]);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPackage = useMemo(
    () => packages.find((p) => p._id === packageId) || null,
    [packages, packageId]
  );

  const placementOptions = useMemo(() => {
    const pls = selectedPackage?.placements || [];
    return Array.isArray(pls) ? pls : [];
  }, [selectedPackage]);

  useEffect(() => {
    if (!placementKey && placementOptions[0]?.key) {
      setPlacementKey(placementOptions[0].key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId, placementOptions.length]);

  const selectedPlacement = useMemo(
    () => placementOptions.find((p) => p.key === placementKey) || null,
    [placementOptions, placementKey]
  );

  const maxDays = Number(selectedPlacement?.maxDays || 0) || 9999;

  async function submit() {
    setErr(null);
    setOkMsg(null);

    try {
      if (!jobId) throw new Error("İlan seçmelisin (jobId).");
      if (!packageId) throw new Error("Paket seçmelisin (packageId).");
      if (!placementKey) throw new Error("Placement seçmelisin (placementKey).");

      const days = Math.max(1, Math.min(Number(requestedDays || 0), maxDays));

      const res = await fetch(`/api/job-requests/from-job/${encodeURIComponent(jobId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          packageId,
          placementKey,
          requestedDays: days,
          countryTargets: ["TR"],
          geoLevel: selectedPackage?.geoLevel || "country",
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Talep gönderilemedi.");

      setOkMsg("Talep oluşturuldu. Admin onayı bekliyor.");
    } catch (e: any) {
      setErr(e?.message || "Beklenmeyen hata.");
    }
  }

  return (
    <EmployerOnly>
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">İlan Talebi Oluştur</h1>
            <div className="text-xs text-slate-400">İlan seç → paket/placement seç → talep gönder</div>
          </div>
          <Link
            href="/employer/dashboard"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 hover:bg-slate-800"
          >
            Dashboard
          </Link>
        </div>

        {(err || okMsg) && (
          <div
            className={
              "mb-4 rounded-lg border px-3 py-2 text-sm " +
              (err
                ? "border-rose-800 bg-rose-950/40 text-rose-200"
                : "border-emerald-800 bg-emerald-950/40 text-emerald-200")
            }
          >
            {err || okMsg}
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          {loading ? (
            <div className="text-sm text-slate-400">Yükleniyor…</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-slate-400">1) İlan seç (jobId)</div>
                <select
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="">— ilan seç —</option>
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>
                      {(j.title || "Başlıksız")} {j.status ? `(${j.status})` : ""}
                    </option>
                  ))}
                </select>

                <div className="mt-2 text-xs text-slate-500">
                  İlan yoksa önce{" "}
                  <Link className="text-sky-300 hover:underline" href="/employer/jobs/new">
                    /employer/jobs/new
                  </Link>{" "}
                  ile ilan oluştur.
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">2) Paket seç</div>
                <select
                  value={packageId}
                  onChange={(e) => {
                    setPackageId(e.target.value);
                    setPlacementKey("");
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                >
                  {packages.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.price ? `- ${p.price} ${p.currency || ""}` : ""}
                    </option>
                  ))}
                </select>

                <div className="mt-2 text-xs text-slate-500">
                  {selectedPackage?.requiresAdminApproval ? "Admin onayı gerekir." : "Otomatik yayınlanabilir."}
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">3) Placement</div>
                <select
                  value={placementKey}
                  onChange={(e) => setPlacementKey(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="">— placement seç —</option>
                  {placementOptions.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label || p.key} {p.maxDays ? `(max ${p.maxDays} gün)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">4) Gün</div>
                <input
                  type="number"
                  min={1}
                  max={maxDays}
                  value={requestedDays}
                  onChange={(e) => setRequestedDays(Number(e.target.value || 1))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                />
                <div className="mt-2 text-xs text-slate-500">Seçili placement için max: {maxDays} gün</div>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <Link
                  href="/employer/job-requests"
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
                >
                  Taleplerim
                </Link>
                <button
                  onClick={submit}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Talep Gönder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </EmployerOnly>
  );
}
