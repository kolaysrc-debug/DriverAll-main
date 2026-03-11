"use client";

// PATH: drivercv-frontend/app/driver/dashboard/page.tsx
// ----------------------------------------------------------
// Driver Dashboard — kariyer.net esinlenmeli, mobil-first
// - Sol sidebar (desktop) / Profil kartı (mobil)
// - CV özeti + ilerleme çubuğu
// - Başvuru özeti (durum bazlı sayaçlar)
// - Öne çıkan ilanlar
// - Reklam alanı
// - Alt navigasyon (mobil) — KALDIRILMAYACAK
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import RoleGate from "@/components/RoleGate";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import { fetchPublicJobs } from "@/lib/api/publicJobs";
import { getMyProfile, type ProfileData } from "@/lib/api/profile";
import { listMyApplications, type DriverApplication } from "@/lib/api/applications";

type User = { name?: string; email?: string; role?: string };

type PublicJob = {
  _id: string;
  title?: string;
  createdAt?: string;
  publishedAt?: string;
  location?: { label?: string };
  company?: { name?: string };
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function cvCompletion(p: ProfileData | null): number {
  if (!p) return 0;
  const checks = [
    !!p.fullName,
    !!p.phone,
    !!p.country,
    !!p.city,
    !!p.about,
    p.experienceYears != null && p.experienceYears > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Yeni", color: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  reviewed: { label: "İncelendi", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  shortlisted: { label: "Ön Eleme", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  rejected: { label: "Reddedildi", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  hired: { label: "İşe Alındı", color: "bg-green-500/20 text-green-200 border-green-500/30" },
};

/* ------------------------------------------------------------------ */
/*  SIDEBAR MENU ITEMS                                                 */
/* ------------------------------------------------------------------ */

const SIDEBAR_MENU = [
  {
    title: "İlanlarım",
    items: [
      { label: "İlanlara Gözat", href: "/jobs", icon: "🔍" },
      { label: "Başvurularım", href: "/driver/applications", icon: "📋" },
    ],
  },
  {
    title: "Profilim",
    items: [
      { label: "Profil & CV Düzenle", href: "/cv", icon: "📝" },
      { label: "Hesap Ayarları", href: "/account", icon: "⚙️" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function DriverDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [apps, setApps] = useState<DriverApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);

  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsErr, setJobsErr] = useState<string | null>(null);

  /* -- user from localStorage -- */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  /* -- profile -- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await getMyProfile();
        if (alive) setProfile(p);
      } catch {
        /* silent */
      } finally {
        if (alive) setProfileLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* -- applications -- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await listMyApplications();
        if (alive) setApps(list);
      } catch {
        /* silent */
      } finally {
        if (alive) setAppsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* -- jobs -- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setJobsErr(null);
        const data = await fetchPublicJobs({ country: "TR", page: "1", limit: "6", sort: "newest" });
        if (!alive) return;
        setJobs(Array.isArray(data?.jobs) ? (data.jobs as PublicJob[]) : []);
      } catch (e: any) {
        if (!alive) return;
        setJobs([]);
        setJobsErr(e?.message || "İlanlar yüklenemedi.");
      } finally {
        if (alive) setJobsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* -- derived -- */
  const completion = cvCompletion(profile);
  const appCounts = apps.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const displayName = profile?.fullName || user?.name || user?.email || "Sürücü";

  /* ---------------------------------------------------------------- */
  /*  RENDER                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <RoleGate allowRoles={["driver", "admin"]}>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8">

          {/* ============ DESKTOP: sidebar + content ============ */}
          <div className="flex gap-6">

            {/* ---------- LEFT SIDEBAR (desktop only) ---------- */}
            <aside className="hidden md:flex md:w-64 flex-shrink-0 flex-col gap-4">

              {/* Profile Card */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-600/20 text-sky-400 text-lg font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-100">{displayName}</div>
                    <div className="text-[11px] text-slate-400">{user?.email || ""}</div>
                  </div>
                </div>

                {/* CV Completion */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">CV Tamamlanma</span>
                    <span className={`font-semibold ${completion >= 80 ? "text-emerald-400" : completion >= 50 ? "text-amber-400" : "text-red-400"}`}>
                      %{completion}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        completion >= 80 ? "bg-emerald-500" : completion >= 50 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                  {completion < 100 && (
                    <Link href="/cv" className="mt-2 block text-[11px] text-sky-400 hover:text-sky-300">
                      Profilini tamamla →
                    </Link>
                  )}
                </div>
              </div>

              {/* Menu */}
              {SIDEBAR_MENU.map((section) => (
                <div key={section.title} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {section.title}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 transition-colors"
                      >
                        <span className="text-base">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {/* Desktop Ad */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Sponsor</div>
                <AdSlot placement="DASHBOARD_RIGHT" country="TR" />
              </div>
            </aside>

            {/* ---------- MAIN CONTENT ---------- */}
            <main className="min-w-0 flex-1 space-y-4">

              {/* Mobile: Profile Card (compact) */}
              <div className="md:hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600/20 text-sky-400 text-base font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-100">{displayName}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            completion >= 80 ? "bg-emerald-500" : completion >= 50 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">CV %{completion}</span>
                    </div>
                  </div>
                  <Link
                    href="/cv"
                    className="rounded-lg bg-sky-600/20 border border-sky-500/30 px-3 py-1.5 text-[11px] font-medium text-sky-300 hover:bg-sky-600/30 transition-colors"
                  >
                    CV Düzenle
                  </Link>
                </div>
              </div>

              {/* Mobile Ad */}
              <div className="md:hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
                <AdSlot placement="DASHBOARD_RIGHT" country="TR" />
              </div>

              {/* ====== BAŞVURU ÖZETİ ====== */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-100">Başvurularım</h2>
                  <Link href="/driver/applications" className="text-[11px] text-sky-400 hover:text-sky-300">
                    Tümünü Gör →
                  </Link>
                </div>

                {appsLoading ? (
                  <div className="text-xs text-slate-500">Yükleniyor…</div>
                ) : apps.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
                    <div className="text-slate-500 text-sm">Henüz başvurun yok</div>
                    <Link
                      href="/jobs"
                      className="mt-2 inline-block rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-sky-500 transition-colors"
                    >
                      İlanlara Gözat
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => {
                      const count = appCounts[key] || 0;
                      return (
                        <div
                          key={key}
                          className={`rounded-xl border px-3 py-2.5 text-center ${color}`}
                        >
                          <div className="text-lg font-bold">{count}</div>
                          <div className="text-[10px] mt-0.5">{label}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ====== ÖNE ÇIKAN İLANLAR ====== */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-100">Öne Çıkan İlanlar</h2>
                  <Link href="/jobs" className="text-[11px] text-sky-400 hover:text-sky-300">
                    Tümünü Gör →
                  </Link>
                </div>

                {jobsLoading ? (
                  <div className="text-xs text-slate-500">Yükleniyor…</div>
                ) : jobsErr ? (
                  <div className="text-xs text-red-400">{jobsErr}</div>
                ) : jobs.length === 0 ? (
                  <div className="text-xs text-slate-500">Şu an yayınlanmış ilan yok.</div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {jobs.map((j) => (
                      <Link
                        key={j._id}
                        href={`/jobs/${encodeURIComponent(j._id)}`}
                        className="group flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 hover:border-sky-700/50 hover:bg-slate-900/60 transition-all"
                      >
                        {/* Company icon placeholder */}
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400 text-xs font-bold group-hover:bg-sky-900/30 group-hover:text-sky-400 transition-colors">
                          {(j.company?.name || j.title || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-100 line-clamp-1 group-hover:text-sky-300 transition-colors">
                            {String(j.title || "(Başlıksız)").trim() || "(Başlıksız)"}
                          </div>
                          {j.company?.name && (
                            <div className="text-[11px] text-slate-400 line-clamp-1">{j.company.name}</div>
                          )}
                          <div className="mt-0.5 text-[10px] text-slate-500">
                            {j.location?.label ? String(j.location.label) : "-"} • {formatDate(j.publishedAt || j.createdAt)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* ====== HIZLI İŞLEMLER (desktop: gizli sidebar'da var, mobilde göster) ====== */}
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                <Link
                  href="/jobs"
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 hover:border-sky-700/40 hover:bg-slate-900/50 transition-all group"
                >
                  <div className="text-lg mb-1">🔍</div>
                  <div className="text-sm font-semibold text-slate-100 group-hover:text-sky-300 transition-colors">İlanlara Gözat</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Açık ilanları incele, başvuru yap</div>
                </Link>

                <Link
                  href="/driver/applications"
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 hover:border-emerald-700/40 hover:bg-slate-900/50 transition-all group"
                >
                  <div className="text-lg mb-1">📋</div>
                  <div className="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">Başvurularım</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Durum takibi, puanlar, notlar</div>
                </Link>

                <Link
                  href="/cv"
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 hover:border-amber-700/40 hover:bg-slate-900/50 transition-all group col-span-2 md:col-span-1"
                >
                  <div className="text-lg mb-1">📝</div>
                  <div className="text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">Profil & CV</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">CV alanlarını düzenle, güncel tut</div>
                </Link>
              </div>

            </main>
          </div>
        </div>

        {/* ============ MOBİL ALT NAVİGASYON — KALDIRILMAYACAK ============ */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <Link
                href="/driver/dashboard"
                className="rounded-xl border border-sky-600/40 bg-sky-950/30 px-2 py-2 text-center text-[11px] font-medium text-sky-300"
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
                className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors"
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
