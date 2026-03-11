"use client";

// PATH: DriverAll-main/drivercv-frontend/app/driver/applications/page.tsx
// ----------------------------------------------------------
// Driver Applications — kariyer.net esinlenmeli
// - Renkli durum badge'leri
// - Kart tabanlı layout
// - Boş durum davetkar
// - Mobil alt nav tutarlılığı
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RoleGate from "@/components/RoleGate";
import { listMyApplications, DriverApplication } from "@/lib/api/applications";

function clampText(s: string, max: number) {
  const t = (s || "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + "…";
}

function fmtDate(iso?: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("tr-TR");
  } catch {
    return iso;
  }
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  new:         { label: "Yeni",        cls: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  reviewed:    { label: "İncelendi",   cls: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  shortlisted: { label: "Ön Eleme",    cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  rejected:    { label: "Reddedildi",  cls: "bg-red-500/20 text-red-300 border-red-500/30" },
  hired:       { label: "İşe Alındı",  cls: "bg-green-500/20 text-green-200 border-green-500/30" },
};

const LABEL_COLOR_MAP: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  green: "bg-green-500",
  none: "bg-slate-600",
};

type StatusFilter = "" | "new" | "reviewed" | "shortlisted" | "rejected" | "hired";

export default function DriverApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apps, setApps] = useState<DriverApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await listMyApplications();
        if (!alive) return;
        setApps(Array.isArray(list) ? list : []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Başvurular alınamadı.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const list = useMemo(() => {
    const arr = [...apps];
    if (statusFilter) {
      const filtered = arr.filter((a) => a.status === statusFilter);
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return filtered;
    }
    arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return arr;
  }, [apps, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of apps) c[a.status] = (c[a.status] || 0) + 1;
    return c;
  }, [apps]);

  return (
    <RoleGate allowRoles={["driver", "admin"]}>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-slate-50">Başvurularım</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {apps.length > 0 ? `Toplam ${apps.length} başvuru` : "Başvurduğun ilanlar ve durumları"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/driver/dashboard"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
              >
                ← Panel
              </Link>
              <Link
                href="/jobs"
                className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500 transition-colors"
              >
                İlanlara Gözat
              </Link>
            </div>
          </div>

          {/* Durum Özeti + Filtre */}
          {!loading && apps.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setStatusFilter("")}
                className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  statusFilter === ""
                    ? "border-sky-500/50 bg-sky-500/20 text-sky-300"
                    : "border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                Tümü ({apps.length})
              </button>
              {Object.entries(STATUS_MAP).map(([key, { label, cls }]) => {
                const count = counts[key] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key as StatusFilter)}
                    className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      statusFilter === key ? cls : "border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Hata */}
          {error && (
            <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {/* Yükleniyor */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
              Başvurular yükleniyor…
            </div>
          )}

          {/* Boş Durum */}
          {!loading && list.length === 0 && !error && (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-slate-300 font-medium">
                {statusFilter ? "Bu durumda başvurun yok" : "Henüz başvurun yok"}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                İlanlara göz at ve sana uygun pozisyonlara başvuru yap.
              </p>
              <Link
                href="/jobs"
                className="mt-4 inline-block rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
              >
                İlanlara Gözat
              </Link>
            </div>
          )}

          {/* Başvuru Kartları */}
          {!loading && list.length > 0 && (
            <div className="space-y-3">
              {list.map((a) => {
                const jobTitle = a?.job?.title || "(ilan başlığı yok)";
                const jobId = a?.job?._id;
                const meeting = (a?.meetingUrl || "").trim();
                const driverNote = clampText(a?.note || "", 420);
                const st = STATUS_MAP[a.status] || STATUS_MAP.new;
                const labelDot = LABEL_COLOR_MAP[a.labelColor || "none"] || LABEL_COLOR_MAP.none;

                return (
                  <div
                    key={a._id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition-colors"
                  >
                    {/* Üst satır: Başlık + Durum badge */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        {jobId ? (
                          <Link
                            href={`/jobs/${encodeURIComponent(jobId)}`}
                            className="text-sm font-semibold text-slate-50 hover:text-sky-300 transition-colors line-clamp-1"
                          >
                            {jobTitle}
                          </Link>
                        ) : (
                          <div className="text-sm font-semibold text-slate-50 line-clamp-1">{jobTitle}</div>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{fmtDate(a.createdAt)}</span>
                          {a.job?.location && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span>{typeof a.job.location === "object" ? (a.job.location as any).label || "-" : "-"}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {meeting && (
                          <a
                            href={meeting}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-300 hover:bg-sky-500/20 transition-colors"
                          >
                            Görüşme Linki
                          </a>
                        )}
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>
                    </div>

                    {/* Alt: Notlar + Değerlendirme */}
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {/* Driver notu */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Benim Notum</div>
                        <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {driverNote || <span className="text-slate-600 italic">Not eklenmemiş</span>}
                        </div>
                      </div>

                      {/* İşveren değerlendirmesi */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">İşveren Değerlendirmesi</div>
                        <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {(a.employerNote || "").trim()
                            ? clampText(a.employerNote || "", 420)
                            : <span className="text-slate-600 italic">Henüz değerlendirme yok</span>
                          }
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <span className={`inline-block h-2.5 w-2.5 rounded-full ${labelDot}`} />
                            Etiket
                          </span>
                          <span>
                            Puan: <span className="text-slate-200 font-medium">{a.score == null ? "-" : String(a.score)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MOBİL ALT NAVİGASYON — KALDIRILMAYACAK */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <Link
                href="/driver/dashboard"
                className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors"
              >
                Panel
              </Link>
              <Link
                href="/jobs"
                className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors"
              >
                İlanlar
              </Link>
              <Link
                href="/driver/applications"
                className="rounded-xl border border-sky-600/40 bg-sky-950/30 px-2 py-2 text-center text-[11px] font-medium text-sky-300"
              >
                Başvurular
              </Link>
              <Link
                href="/cv"
                className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors"
              >
                CV
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </RoleGate>
  );
}
