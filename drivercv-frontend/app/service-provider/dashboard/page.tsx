"use client";

// PATH: drivercv-frontend/app/service-provider/dashboard/page.tsx
// ----------------------------------------------------------
// Service Provider Dashboard — modern kart tabanlı tasarım
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ServiceProviderOnly from "@/components/ServiceProviderOnly";
import { fetchMyServiceListings } from "@/lib/api/serviceListings";

type ListingItem = {
  _id: string;
  title?: string;
  category?: string;
  status?: string;
  createdAt?: string;
  location?: { label?: string };
  deliveryMethods?: string[];
};

type CategoryItem = { key: string; label: string; description?: string; icon?: string };

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active:  { label: "Aktif",   cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  passive: { label: "Pasif",   cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  draft:   { label: "Taslak",  cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
};

const WORKFLOW_CARDS = [
  {
    title: "Yeni Hizmet Ekle",
    desc: "Kurs, eğitim veya belge hizmeti ekleyin",
    href: "/service-provider/services/new",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "Hizmetlerim",
    desc: "Tüm hizmet ilanlarınızı yönetin",
    href: "/service-provider/services",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    accent: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  {
    title: "Profil",
    desc: "Firma bilgilerinizi güncelleyin",
    href: "/service-provider/profile",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    accent: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  },
];

export default function ServiceProviderDashboardPage() {
  const [list, setList] = useState<ListingItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [dataList, dataCats] = await Promise.all([
        fetchMyServiceListings(),
        fetch("/api/public/service-categories?country=TR").then((r) => r.json()).catch(() => ({ categories: [] })),
      ]);
      setList(Array.isArray(dataList?.list) ? dataList.list : []);
      setCategories(Array.isArray(dataCats?.categories) ? dataCats.categories : []);
    } catch (e: any) {
      setErr(e?.message || "Hizmetler alınamadı");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const catMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of categories) m[c.key] = c.label;
    return m;
  }, [categories]);

  const stats = useMemo(() => {
    const active = list.filter((x) => x.status === "active").length;
    const passive = list.filter((x) => x.status === "passive").length;
    const draft = list.filter((x) => x.status === "draft").length;
    return { active, passive, draft, total: list.length };
  }, [list]);

  const last5 = useMemo(() => list.slice(0, 5), [list]);

  return (
    <ServiceProviderOnly>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-bold text-slate-50">Hizmet Veren Paneli</h1>
                <p className="text-xs text-slate-400 mt-0.5">Kurs, eğitim ve belge hizmetlerinizi yönetin</p>
              </div>
              <Link href="/service-provider/profile" className="hidden md:inline-flex rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors">
                Profil
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Toplam</div>
              <div className="mt-1 text-2xl font-bold text-slate-50">{loading ? "—" : stats.total}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/70">Aktif</div>
              <div className="mt-1 text-2xl font-bold text-emerald-300">{loading ? "—" : stats.active}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pasif</div>
              <div className="mt-1 text-2xl font-bold text-slate-300">{loading ? "—" : stats.passive}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500/70">Taslak</div>
              <div className="mt-1 text-2xl font-bold text-amber-300">{loading ? "—" : stats.draft}</div>
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
                  <div className="text-sm font-semibold text-slate-100 group-hover:text-white transition-colors">{card.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{card.desc}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Listings */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Son Hizmetler</div>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-6">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-teal-400" />
                Yükleniyor…
              </div>
            )}

            {!loading && last5.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
                <div className="text-4xl mb-3">🎓</div>
                <div className="text-slate-400 text-sm">Henüz hizmet eklenmemiş.</div>
                <Link href="/service-provider/services/new" className="mt-3 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
                  İlk Hizmeti Ekle
                </Link>
              </div>
            )}

            {!loading && last5.length > 0 && (
              <div className="space-y-3">
                {last5.map((x) => {
                  const badge = STATUS_MAP[x.status || "draft"] || STATUS_MAP.draft;
                  return (
                    <Link
                      key={x._id}
                      href={`/service-provider/services/${x._id}`}
                      className="block rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-800/30 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-100">{x.title || "Hizmet"}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                        </div>
                        <span className="text-xs text-slate-500">{catMap[x.category || ""] || x.category}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                        {x.location?.label && <span>📍 {x.location.label}</span>}
                        {x.deliveryMethods && x.deliveryMethods.length > 0 && (
                          <span>{x.deliveryMethods.map((m) => m === "yuz_yuze" ? "Yüzyüze" : m === "online" ? "Online" : m === "uygulamali" ? "Uygulamalı" : "Karma").join(", ")}</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
                <Link href="/service-provider/services" className="inline-flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 transition-colors">
                  Tüm hizmetleri görüntüle
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
              <Link href="/service-provider/dashboard" className="rounded-xl border border-teal-600/40 bg-teal-950/30 px-2 py-2 text-center text-[11px] font-medium text-teal-300">Panel</Link>
              <Link href="/service-provider/services" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Hizmetler</Link>
              <Link href="/service-provider/services/new" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Ekle</Link>
              <Link href="/service-provider/profile" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Profil</Link>
            </div>
          </div>
        </nav>
      </div>
    </ServiceProviderOnly>
  );
}
