"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/job-requests/page.tsx
// ----------------------------------------------------------
// Employer Job Requests — modern kart tabanlı tasarım
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import EmployerOnly from "@/components/EmployerOnly";
import Link from "next/link";
import { authHeaders } from "@/lib/api/_core";

type ReqRow = {
  _id: string;
  status?: string;
  jobId?: string;
  jobTitle?: string;
  packageName?: string;
  placementKey?: string;
  requestedDays?: number;
  createdAt?: string;
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Bekliyor", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  approved: { label: "Onaylandı", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  rejected: { label: "Reddedildi", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("tr-TR"); } catch { return iso; }
}

export default function EmployerJobRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [list, setList] = useState<ReqRow[]>([]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/job-requests/mine", { headers: authHeaders(), cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Liste alınamadı.");
      setList(Array.isArray(data?.list) ? data.list : []);
    } catch (e: any) {
      setErr(e?.message || "Beklenmeyen hata.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <EmployerOnly>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-50">İlan Taleplerim</h1>
                <p className="text-xs text-slate-400 mt-0.5">Gönderilen taleplerin durumunu takip edin</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/employer/dashboard" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors">← Panel</Link>
                <Link href="/employer/job-requests/new" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition-colors">+ Yeni Talep</Link>
                <button onClick={load} disabled={loading} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50">Yenile</button>
              </div>
            </div>
          </div>

          {/* Error */}
          {err && (
            <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
              <span className="text-rose-400">✕</span> {err}
            </div>
          )}

          {/* Count */}
          <div className="text-xs text-slate-500">{list.length} talep</div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
              Yükleniyor…
            </div>
          )}

          {/* Empty */}
          {!loading && list.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-slate-400 text-sm">Henüz ilan talebi göndermediniz.</div>
              <Link href="/employer/job-requests/new" className="mt-3 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
                İlk Talebi Oluştur
              </Link>
            </div>
          )}

          {/* Request Cards */}
          {!loading && list.length > 0 && (
            <div className="space-y-3">
              {list.map((r) => {
                const statusKey = String(r.status || "pending").toLowerCase();
                const badge = STATUS_MAP[statusKey] || STATUS_MAP.pending;
                return (
                  <div
                    key={r._id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-800/30 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-100 truncate">
                            {r.jobTitle || r.jobId || "(ilan yok)"}
                          </span>
                          <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          {r.packageName && <span className="flex items-center gap-1">📦 {r.packageName}</span>}
                          {r.placementKey && <span className="text-slate-500">Yer: {r.placementKey}</span>}
                          {r.requestedDays ? <span className="text-slate-500">{r.requestedDays} gün</span> : null}
                          {r.createdAt && <span className="text-slate-500">{fmtDate(r.createdAt)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.jobId && (
                          <Link
                            href={`/jobs/${r.jobId}`}
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900 transition-colors"
                          >
                            İlanı Gör
                          </Link>
                        )}
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
              <Link href="/employer/jobs" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">İlanlar</Link>
              <Link href="/employer/applications" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Başvurular</Link>
              <Link href="/employer/profile" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Profil</Link>
            </div>
          </div>
        </nav>
      </div>
    </EmployerOnly>
  );
}
