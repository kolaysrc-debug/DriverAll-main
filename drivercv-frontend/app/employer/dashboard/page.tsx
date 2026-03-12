"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/dashboard/page.tsx
// ----------------------------------------------------------
// Employer Dashboard — modern kart tabanlı tasarım
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import Link from "next/link";
import EmployerOnly from "@/components/EmployerOnly";
import AdSlot from "@/components/AdSlot";
import { getToken } from "@/lib/session";

type StoredUser = { name?: string; email?: string; role?: string };

type OrderCredits = {
  jobPostCount: number;
  cvViewCount: number;
  cvSaveCount: number;
  jobCount: number;
  adCount: number;
};

type PackageOrder = {
  _id: string;
  packageSnapshot: {
    name?: string;
    code?: string;
    type?: string;
    price?: number;
    currency?: string;
    credits?: Partial<OrderCredits>;
    rules?: { listingDays?: number; homeDays?: number };
  };
  paymentStatus: string;
  orderStatus: string;
  creditsRemaining: Partial<OrderCredits>;
  paidAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
};

const WORKFLOW_CARDS = [
  {
    title: "İlan Oluştur",
    desc: "Yeni pozisyon aç, kriterleri belirle",
    href: "/employer/jobs/new",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "İlan Talebi Gönder",
    desc: "Paket seç → admin onayı → yayın",
    href: "/employer/job-requests/new",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    accent: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  {
    title: "Başvuruları İncele",
    desc: "Gelen başvuruları değerlendir",
    href: "/employer/applications",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    accent: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    title: "İlanlarım",
    desc: "Mevcut ilanlarını yönet",
    href: "/employer/jobs",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    accent: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  {
    title: "Şubeler",
    desc: "Şube kayıtlarını yönet",
    href: "/employer/branches",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    accent: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  {
    title: "Ekibim",
    desc: "Alt kullanıcıları yönet, rol ata",
    href: "/employer/team",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    accent: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  },
  {
    title: "İlan Akışı",
    desc: "Platformdaki tüm ilanları gözlemle",
    href: "/jobs",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    accent: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  },
];

const QUICK_LINKS = [
  { label: "Firma Profili", href: "/employer/profile" },
  { label: "İlan Taleplerim", href: "/employer/job-requests" },
  { label: "Hesap Ayarları", href: "/account" },
];

export default function EmployerDashboardPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [jobCount, setJobCount] = useState<number | null>(null);
  const [appCount, setAppCount] = useState<number | null>(null);
  const [orders, setOrders] = useState<PackageOrder[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("user");
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }

    // İlan ve başvuru sayılarını çek
    const token = getToken();
    if (!token) return;

    fetch("/api/jobs/mine", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d?.jobs)) setJobCount(d.jobs.length); })
      .catch(() => {});

    fetch("/api/applications/employer", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d?.applications)) setAppCount(d.applications.length); })
      .catch(() => {});

    fetch("/api/orders/mine", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d?.orders)) setOrders(d.orders); })
      .catch(() => {});
  }, []);

  const displayName = user?.name || "İşveren";

  return (
    <EmployerOnly>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8">

          {/* ─── Header Card ─── */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 text-lg font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-50">Hoş geldin, {displayName}</h1>
                  <p className="text-xs text-slate-400">{user?.email || "İşveren Paneli"}</p>
                </div>
              </div>
              <Link
                href="/employer/profile"
                className="hidden md:inline-flex rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Firma Profili
              </Link>
            </div>
          </div>

          {/* ─── Stats Row ─── */}
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">İlanlar</div>
              <div className="mt-1 text-2xl font-bold text-slate-50">{jobCount ?? "—"}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Başvurular</div>
              <div className="mt-1 text-2xl font-bold text-slate-50">{appCount ?? "—"}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Durum</div>
              <div className="mt-1 text-sm font-semibold text-emerald-400">Aktif</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reklam</div>
              <div className="mt-1"><AdSlot placement="DASHBOARD_RIGHT" country="TR" /></div>
            </div>
          </div>

          {/* ─── Aktif Paket & Kredi Bilgisi ─── */}
          {(() => {
            const activeOrders = orders.filter((o) => o.orderStatus === "active" && o.paymentStatus === "paid");
            const pendingOrders = orders.filter((o) => o.paymentStatus === "unpaid");

            // Toplam kalan krediler
            const totalCredits = activeOrders.reduce(
              (acc, o) => ({
                jobPostCount: acc.jobPostCount + (o.creditsRemaining?.jobPostCount || 0),
                cvViewCount: acc.cvViewCount + (o.creditsRemaining?.cvViewCount || 0),
                cvSaveCount: acc.cvSaveCount + (o.creditsRemaining?.cvSaveCount || 0),
              }),
              { jobPostCount: 0, cvViewCount: 0, cvSaveCount: 0 }
            );

            const hasAnyCredit = totalCredits.jobPostCount > 0 || totalCredits.cvViewCount > 0 || totalCredits.cvSaveCount > 0;

            return (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-100">💳 Paketlerim & Krediler</div>
                  <Link
                    href="/packages"
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
                  >
                    Paket Satın Al
                  </Link>
                </div>

                {activeOrders.length === 0 && pendingOrders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-center">
                    <div className="text-2xl">📦</div>
                    <div className="mt-2 text-sm text-slate-400">Henüz aktif bir paketiniz yok</div>
                    <Link
                      href="/packages"
                      className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
                    >
                      Paketleri İncele
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Kalan Krediler */}
                    {hasAnyCredit && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-emerald-600/30 bg-emerald-950/20 p-3 text-center">
                          <div className="text-2xl font-bold text-emerald-400">{totalCredits.jobPostCount}</div>
                          <div className="text-[10px] font-medium text-slate-400 mt-1">İlan Hakkı</div>
                        </div>
                        <div className="rounded-xl border border-sky-600/30 bg-sky-950/20 p-3 text-center">
                          <div className="text-2xl font-bold text-sky-400">{totalCredits.cvViewCount}</div>
                          <div className="text-[10px] font-medium text-slate-400 mt-1">CV Görüntüleme</div>
                        </div>
                        <div className="rounded-xl border border-amber-600/30 bg-amber-950/20 p-3 text-center">
                          <div className="text-2xl font-bold text-amber-400">{totalCredits.cvSaveCount}</div>
                          <div className="text-[10px] font-medium text-slate-400 mt-1">CV Kaydetme</div>
                        </div>
                      </div>
                    )}

                    {/* Aktif Paketler */}
                    {activeOrders.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Aktif Paketler</div>
                        {activeOrders.map((o) => (
                          <div key={o._id} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-slate-100">{o.packageSnapshot?.name || "Paket"}</div>
                              <div className="text-[11px] text-slate-400">
                                İlan: {o.creditsRemaining?.jobPostCount ?? 0} hak kaldı
                                {o.expiresAt && ` • Son: ${new Date(o.expiresAt).toLocaleDateString("tr-TR")}`}
                              </div>
                            </div>
                            <span className="rounded-full border border-emerald-600/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                              Aktif
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ödeme Bekleyen Siparişler */}
                    {pendingOrders.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Ödeme Bekleyen</div>
                        {pendingOrders.map((o) => (
                          <div key={o._id} className="flex items-center justify-between rounded-xl border border-amber-700/30 bg-amber-950/10 px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-slate-100">{o.packageSnapshot?.name || "Paket"}</div>
                              <div className="text-[11px] text-slate-400">
                                {o.packageSnapshot?.price != null
                                  ? `${o.packageSnapshot.price.toLocaleString("tr-TR")} ${o.packageSnapshot.currency || "TRY"}`
                                  : ""}
                                {" • "}{new Date(o.createdAt).toLocaleDateString("tr-TR")}
                              </div>
                            </div>
                            <span className="rounded-full border border-amber-600/40 bg-amber-950/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                              Ödeme Bekleniyor
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })()}

          {/* ─── Main Grid: Workflows + Sidebar ─── */}
          <div className="mt-4 grid gap-4 md:grid-cols-12">
            {/* Workflow Cards */}
            <div className="md:col-span-8 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">İş Akışları</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {WORKFLOW_CARDS.map((card) => (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-800/40 hover:border-slate-700 transition-colors"
                  >
                    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl border ${card.accent}`}>
                      {card.icon}
                    </div>
                    <div className="text-sm font-semibold text-slate-100 group-hover:text-white transition-colors">
                      {card.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{card.desc}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar — Quick Links */}
            <div className="md:col-span-4 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hızlı Erişim</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:bg-slate-900/50 hover:border-slate-700 transition-colors"
                  >
                    <span>{link.label}</span>
                    <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Mobil Alt Navigasyon ─── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <Link href="/employer/dashboard" className="rounded-xl border border-emerald-600/40 bg-emerald-950/30 px-2 py-2 text-center text-[11px] font-medium text-emerald-300">Panel</Link>
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
