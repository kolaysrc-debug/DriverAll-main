"use client";

// PATH: DriverAll-main/drivercv-frontend/app/driver/applications/page.tsx
// ----------------------------------------------------------
// Driver Applications
// - Kendi başvurularını listeler
// - Driver "görüş" (note) alanı kısa tutulur
// - Employer'ın gönderdiği meetingUrl varsa gösterir
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

export default function DriverApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apps, setApps] = useState<DriverApplication[]>([]);

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
    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(() => {
    // burada kesinlikle [...apps] olmalı; aksi halde liste bozulur
    const arr = [...apps];
    arr.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da;
    });
    return arr;
  }, [apps]);

  return (
    <RoleGate roles={["driver", "admin"]}>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">Başvurularım</h1>
            <div className="text-xs text-slate-400">
              Başvurduğun ilanlar ve durumları
            </div>
          </div>

          <Link
            href="/jobs"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
          >
            İlanlara git
          </Link>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-rose-900 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="text-sm text-slate-300">Yükleniyor…</div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            Henüz başvurun yok.
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((a) => {
              const jobTitle = a?.job?.title || "(ilan başlığı yok)";
              const meeting = (a?.meetingUrl || "").trim();
              const driverNote = clampText(a?.note || "", 420);

              return (
                <div
                  key={a._id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-50">
                        {jobTitle}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        Başvuru tarihi: {fmtDate(a.createdAt)} • Durum:{" "}
                        <span className="text-slate-200">
                          {a.status || "new"}
                        </span>
                      </div>
                    </div>

                    {meeting ? (
                      <a
                        href={meeting}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/25"
                      >
                        Görüşme linki
                      </a>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                      <div className="text-xs font-semibold text-slate-100">
                        Benim Görüşüm (Kısa)
                      </div>
                      <div className="mt-2 text-xs text-slate-300 whitespace-pre-wrap">
                        {driverNote ? driverNote : (
                          <span className="text-slate-500">—</span>
                        )}
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500">
                        Not: Görüş alanı kısa tutulur (3–4 cümle ideal).
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                      <div className="text-xs font-semibold text-slate-100">
                        İşveren Notu / Değerlendirme
                      </div>
                      <div className="mt-2 text-xs text-slate-300 whitespace-pre-wrap">
                        {(a.employerNote || "").trim() ? (
                          clampText(a.employerNote || "", 420)
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-slate-400">
                        Etiket:{" "}
                        <span className="text-slate-200">
                          {a.labelColor || "none"}
                        </span>{" "}
                        • Puan:{" "}
                        <span className="text-slate-200">
                          {a.score == null ? "-" : String(a.score)}
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-500">
                        (Sistem kalite puanı ayrı tutulacak; burası işveren puanı.)
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleGate>
  );
}
