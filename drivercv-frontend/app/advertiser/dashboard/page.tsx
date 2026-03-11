"use client";

// PATH: drivercv-frontend/app/advertiser/dashboard/page.tsx
// ----------------------------------------------------------
// Advertiser Dashboard — modern kart tabanlı tasarım
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdvertiserOnly from "@/components/AdvertiserOnly";
import { fetchMyAdRequests } from "@/lib/api/ads";

type ReqItem = {
  _id: string;
  title?: string;
  packageName?: string;
  placementKey?: string;
  requestedDays?: number;
  status?: "pending" | "approved" | "rejected" | string;
  createdAt?: string;
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Bekliyor",   cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  approved: { label: "Onaylandı",  cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  rejected: { label: "Reddedildi", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
};

const WORKFLOW_CARDS = [
  {
    title: "Yeni Reklam Talebi",
    desc: "Paket ve yerleşim seçerek talep oluşturun",
    href: "/advertiser/ads/new",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "Taleplerim",
    desc: "Tüm reklam taleplerinizi görün",
    href: "/advertiser/ads",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    accent: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  {
    title: "Reklamveren Profili",
    desc: "Firma bilgilerinizi güncelleyin",
    href: "/advertiser/profile",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    accent: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  {
    title: "İşveren Paneli",
    desc: "İlanlar ve ilan talepleri tarafına geç",
    href: "/employer/dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    accent: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  },
];

export default function AdvertiserDashboardPage() {
  const [list, setList] = useState<ReqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchMyAdRequests();
      setList(Array.isArray(data?.list) ? (data.list as ReqItem[]) : []);
    } catch (e: any) {
      setErr(e?.message || "Reklam talepleri alınamadı");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const pending = list.filter((x) => x.status === "pending").length;
    const approved = list.filter((x) => x.status === "approved").length;
    const rejected = list.filter((x) => x.status === "rejected").length;
    return { pending, approved, rejected, total: list.length };
  }, [list]);

  const last5 = useMemo(() => list.slice(0, 5), [list]);

  return (
    <AdvertiserOnly>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-bold text-slate-50">Reklam & Sponsor Paneli</h1>
                <p className="text-xs text-slate-400 mt-0.5">Reklam taleplerini oluşturun, takip edin; admin onayından sonra yayına girer</p>
              </div>
              <Link href="/advertiser/profile" className="hidden md:inline-flex rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors">
                Profil
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Toplam</div>
              <div className="mt-1 text-2xl font-bold text-slate-50">{loading ? "—" : stats.total}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500/70">Beklemede</div>
              <div className="mt-1 text-2xl font-bold text-amber-300">{loading ? "—" : stats.pending}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/70">Onaylandı</div>
              <div className="mt-1 text-2xl font-bold text-emerald-300">{loading ? "—" : stats.approved}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500/70">Reddedildi</div>
              <div className="mt-1 text-2xl font-bold text-rose-300">{loading ? "—" : stats.rejected}</div>
            </div>
          </div>

          {/* Error */}
          {err && (
            <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
              <span className="text-rose-400">✕</span> {err}
            </div>
          )}

          {/* Workflow Cards */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">İş Akışları</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {WORKFLOW_CARDS.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-800/40 hover:border-slate-700 transition-colors"
                >
                  <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl border ${card.accent}`}>
                    {card.icon}
                  </div>
                  <div className="text-sm font-semibold text-slate-100 group-hover:text-white transition-colors">{card.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{card.desc}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Requests */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Son Talepler</div>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-6">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-violet-400" />
                Yükleniyor…
              </div>
            )}

            {!loading && last5.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
                <div className="text-4xl mb-3">📢</div>
                <div className="text-slate-400 text-sm">Henüz reklam talebiniz yok.</div>
                <Link href="/advertiser/ads/new" className="mt-3 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
                  İlk Talebi Oluştur
                </Link>
              </div>
            )}

            {!loading && last5.length > 0 && (
              <div className="space-y-3">
                {last5.map((x) => {
                  const statusKey = String(x.status || "pending").toLowerCase();
                  const badge = STATUS_MAP[statusKey] || STATUS_MAP.pending;
                  return (
                    <div key={x._id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-800/30 hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-100">{x.title || x.packageName || "Reklam"}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                        <span>Yer: {x.placementKey || "-"}</span>
                        <span>{x.requestedDays ?? "-"} gün</span>
                        {x.createdAt && <span className="text-slate-500">{new Date(x.createdAt).toLocaleDateString("tr-TR")}</span>}
                      </div>
                    </div>
                  );
                })}
                <Link href="/advertiser/ads" className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                  Tüm talepleri görüntüle
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobil Alt Navigasyon */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <Link href="/advertiser/dashboard" className="rounded-xl border border-violet-600/40 bg-violet-950/30 px-2 py-2 text-center text-[11px] font-medium text-violet-300">Panel</Link>
              <Link href="/advertiser/ads" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Reklamlar</Link>
              <Link href="/advertiser/ads/new" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Yeni Talep</Link>
              <Link href="/advertiser/profile" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Profil</Link>
            </div>
          </div>
        </nav>
      </div>
    </AdvertiserOnly>
  );
}
