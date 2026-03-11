"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/jobs/page.tsx
// ----------------------------------------------------------
// Employer Jobs Page — modern kart tabanlı tasarım
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RoleGate from "@/components/RoleGate";
import { fetchMyJobs, deleteJob } from "@/lib/api/jobs";

type JobItem = any;

function statusBadge(s?: string) {
  const v = String(s || "").toLowerCase();
  if (v === "published") return { label: "Yayında", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
  if (v === "draft") return { label: "Taslak", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" };
  if (v === "archived") return { label: "Arşiv", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" };
  if (v === "closed") return { label: "Kapalı", cls: "bg-red-500/15 text-red-300 border-red-500/30" };
  return { label: v || "—", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" };
}

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
      const data = await fetchMyJobs();
      setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
    } catch (e: any) {
      setJobs([]);
      setErr(e?.message || "İlanlar alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

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
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-50">İlanlarım</h1>
                <p className="text-xs text-slate-400 mt-0.5">Oluşturduğun ilanları yönet</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/employer/dashboard" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors">← Panel</Link>
                <Link href="/employer/jobs/new" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition-colors">+ Yeni İlan</Link>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="İlan ara (başlık, şehir, ülke)…"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-600/50 focus:ring-1 focus:ring-emerald-600/30 transition-colors"
            />
            <button onClick={load} disabled={loading} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50">
              {loading ? "…" : "Yenile"}
            </button>
          </div>

          {/* Error */}
          {err && (
            <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
              <span className="text-rose-400">✕</span> {err}
            </div>
          )}

          {/* Count badge */}
          <div className="text-xs text-slate-500">{filtered.length} ilan{q.trim() ? ` ("${q.trim()}" filtresi)` : ""}</div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
              Yükleniyor…
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
              <div className="text-slate-400 text-sm">Henüz ilan oluşturmadınız.</div>
              <Link href="/employer/jobs/new" className="mt-3 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
                İlk İlanı Oluştur
              </Link>
            </div>
          )}

          {/* Job Cards */}
          {!loading && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((j: any) => {
                const badge = statusBadge(j?.status);
                const loc = j?.location?.label || j?.location?.cityName || j?.city || j?.country || "-";
                return (
                  <div
                    key={j._id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-800/30 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-100 truncate">{j?.title || "(başlık yok)"}</span>
                          <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {loc}
                          </span>
                          {j?.createdAt && (
                            <span className="text-slate-500">
                              {new Date(j.createdAt).toLocaleDateString("tr-TR")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/jobs/${j._id}`}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900 transition-colors"
                        >
                          Önizle
                        </Link>
                        <Link
                          href={`/employer/jobs/new?edit=${j._id}`}
                          className="rounded-lg border border-sky-600/40 bg-sky-950/30 px-3 py-2 text-xs text-sky-300 hover:bg-sky-900/30 transition-colors"
                        >
                          Düzenle
                        </Link>
                        <button
                          onClick={() => onDelete(String(j._id))}
                          disabled={busyId === String(j._id)}
                          className="rounded-lg border border-rose-800/40 bg-rose-950/20 px-3 py-2 text-xs text-rose-300 hover:bg-rose-900/30 transition-colors disabled:opacity-50"
                        >
                          {busyId === String(j._id) ? "…" : "Sil"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobil Alt Navigasyon */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <Link href="/employer/dashboard" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Panel</Link>
              <Link href="/employer/jobs" className="rounded-xl border border-emerald-600/40 bg-emerald-950/30 px-2 py-2 text-center text-[11px] font-medium text-emerald-300">İlanlar</Link>
              <Link href="/employer/applications" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Başvurular</Link>
              <Link href="/employer/profile" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Profil</Link>
            </div>
          </div>
        </nav>
      </div>
    </RoleGate>
  );
}
