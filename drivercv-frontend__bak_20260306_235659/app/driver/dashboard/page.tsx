"use client";

// PATH: drivercv-frontend/app/driver/dashboard/page.tsx
// ----------------------------------------------------------
// Driver Dashboard
// - Başvurularım linki eklendi: /driver/applications
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import RoleGate from "@/components/RoleGate";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import { fetchPublicJobs } from "@/lib/api/publicJobs";

type User = { name?: string; email?: string; role?: string };

type PublicJob = {
  _id: string;
  title?: string;
  createdAt?: string;
  publishedAt?: string;
  location?: { label?: string };
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function DriverDashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsErr, setJobsErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setJobsLoading(true);
        setJobsErr(null);

        const data = await fetchPublicJobs({
          country: "TR",
          page: "1",
          limit: "10",
          sort: "newest",
        });

        if (!alive) return;
        const list = Array.isArray(data?.jobs) ? (data.jobs as PublicJob[]) : [];
        setJobs(list);
      } catch (e: any) {
        if (!alive) return;
        setJobs([]);
        setJobsErr(e?.message || "İlanlar yüklenemedi.");
      } finally {
        if (!alive) return;
        setJobsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <RoleGate allowRoles={["driver", "admin"]}>
      <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6 pb-24 md:px-8 md:pb-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold">Sürücü Paneli</h1>
                <p className="text-sm text-slate-400 mt-1">
                  İlanlara başvur, başvurularını takip et, CV’ni güncelle.
                </p>
              </div>
              {user?.email ? (
                <div className="text-xs text-slate-400">
                  Oturum:{" "}
                  <span className="text-slate-100 font-semibold">
                    {user.name || user.email}
                  </span>
                  {user.role ? <span className="text-slate-500"> • {user.role}</span> : null}
                </div>
              ) : null}
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-9">
              <div className="grid gap-3 md:grid-cols-3">
                <Link
                  href="/jobs"
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/50 transition"
                >
                  <div className="text-sm font-semibold">İlanlara Gözat</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Açık ilanları incele ve başvuru yap.
                  </div>
                </Link>

                <Link
                  href="/driver/applications"
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/50 transition"
                >
                  <div className="text-sm font-semibold">Başvurularım</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Durum/puan/etiket ve işveren görüşlerini takip et.
                  </div>
                </Link>

                <Link
                  href="/cv"
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/50 transition"
                >
                  <div className="text-sm font-semibold">Profil & CV</div>
                  <div className="text-xs text-slate-400 mt-1">CV alanlarını düzenle, güncel tut.</div>
                </Link>
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 md:hidden">
                <div className="text-sm font-semibold text-slate-100">Reklam</div>
                <div className="mt-3">
                  <AdSlot placement="DASHBOARD_RIGHT" country="TR" />
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-100">İlan Akışı</div>
                  <Link href="/jobs" className="text-xs text-sky-300 hover:text-sky-200">
                    Tüm ilanlar
                  </Link>
                </div>

                {jobsLoading ? (
                  <div className="mt-3 text-xs text-slate-400">Yükleniyor…</div>
                ) : jobsErr ? (
                  <div className="mt-3 text-xs text-slate-400">{jobsErr}</div>
                ) : jobs.length === 0 ? (
                  <div className="mt-3 text-xs text-slate-400">Şu an yayınlanmış ilan yok.</div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {jobs.map((j) => (
                      <Link
                        key={j._id}
                        href={`/jobs/${encodeURIComponent(j._id)}`}
                        className="block rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-2 hover:bg-slate-900/50"
                      >
                        <div className="text-sm text-slate-100 line-clamp-1">
                          {String(j.title || "(Başlıksız)").trim() || "(Başlıksız)"}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">
                          {j.location?.label ? String(j.location.label) : "-"} • {formatDate(j.publishedAt || j.createdAt)}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:block md:col-span-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="text-sm font-semibold text-slate-100">Reklam</div>
                <div className="mt-3">
                  <AdSlot placement="DASHBOARD_RIGHT" country="TR" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <Link
                href="/driver/dashboard"
                className="rounded-xl border border-slate-800 bg-slate-900/40 px-2 py-2 text-center text-[11px] text-slate-100"
              >
                Panel
              </Link>
              <Link
                href="/jobs"
                className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200"
              >
                İlanlar
              </Link>
              <Link
                href="/driver/applications"
                className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200"
              >
                Başvurular
              </Link>
              <Link
                href="/cv"
                className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200"
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
