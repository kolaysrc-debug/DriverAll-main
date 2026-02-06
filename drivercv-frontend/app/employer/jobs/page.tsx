"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/jobs/page.tsx
// ----------------------------------------------------------
// Employer Jobs Page
// - İşverenin ilanlarını listeler
// - Uyum: fetchEmployerJobs yok -> fetchMyJobs kullanılır
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RoleGate from "@/components/RoleGate";
import { fetchMyJobs, deleteJob } from "@/lib/api/jobs"; // <-- FIX

type JobItem = any;

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchMyJobs(); // <-- FIX
      setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
    } catch (e: any) {
      setJobs([]);
      setErr(e?.message || "İlanlar alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return jobs;
    return jobs.filter((j: any) => {
      const title = String(j?.title || "").toLowerCase();
      const country = String(j?.country || j?.location?.countryCode || "").toLowerCase();
      const city = String(j?.city || j?.location?.label || "").toLowerCase();
      return title.includes(term) || country.includes(term) || city.includes(term);
    });
  }, [jobs, q]);

  async function onDelete(id: string) {
    if (!id) return;
    setBusyId(id);
    setErr(null);
    try {
      await deleteJob(id);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Silme başarısız.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <RoleGate allowRoles={["employer", "admin"]}>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">İlanlarım</h1>
            <div className="text-xs text-slate-400">Oluşturduğun ilanları buradan yönetebilirsin.</div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/employer/dashboard"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
            >
              Dashboard
            </Link>
            <Link
              href="/employer/jobs/new"
              className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/25"
            >
              Yeni ilan
            </Link>
          </div>
        </div>

        <div className="mb-4 grid gap-2 md:grid-cols-12">
          <div className="md:col-span-8">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="İlan ara (başlık/şehir/ülke)."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            />
          </div>
          <div className="md:col-span-4">
            <Link
              href="/employer/profile"
              className="block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center text-sm text-slate-100 hover:bg-slate-800"
            >
              Firma profili
            </Link>
          </div>
        </div>

        {err ? (
          <div className="mb-4 rounded-lg border border-red-900/40 bg-red-950/40 p-3 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        {loading ? (
          <div className="text-sm text-slate-300">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-300">İlan bulunamadı.</div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((j: any) => (
              <div
                key={j._id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-100">{j?.title || "(başlık yok)"}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {String(j?.country || j?.location?.countryCode || "-")} •{" "}
                    {String(j?.city || j?.location?.label || "-")} • Durum: {String(j?.status || "-")}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/employer/jobs/new?edit=${j._id}`}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
                  >
                    Düzenle
                  </Link>
                  <button
                    onClick={() => onDelete(String(j._id))}
                    disabled={busyId === String(j._id)}
                    className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-200 hover:bg-red-950/40 disabled:opacity-60"
                  >
                    {busyId === String(j._id) ? "Siliniyor..." : "Sil"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RoleGate>
  );
}
