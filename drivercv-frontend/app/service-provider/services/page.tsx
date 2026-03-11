"use client";

// PATH: drivercv-frontend/app/service-provider/services/page.tsx
// ----------------------------------------------------------
// Service Provider — Hizmetlerim (liste + tab filtre)
// Kariyer.net tarzı tab'lı listeleme: Aktif / Pasif / Taslak
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ServiceProviderOnly from "@/components/ServiceProviderOnly";
import { fetchMyServiceListings, deleteServiceListing } from "@/lib/api/serviceListings";

type CategoryItem = { key: string; label: string; description?: string; icon?: string };

const DELIVERY_LABELS: Record<string, string> = {
  yuz_yuze: "Yüzyüze",
  online: "Online",
  uygulamali: "Uygulamalı",
  karma: "Karma",
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active:  { label: "Aktif",  cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  passive: { label: "Pasif",  cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  draft:   { label: "Taslak", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
};

type Tab = "all" | "active" | "passive" | "draft";

function fmtDate(iso?: string) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("tr-TR"); } catch { return iso; }
}

export default function ServiceProviderServicesPage() {
  const [list, setList] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");

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
      setErr(e?.message || "Hizmetler alınamadı.");
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

  // Auto-close info
  useEffect(() => {
    if (!info) return;
    const t = setTimeout(() => setInfo(null), 3000);
    return () => clearTimeout(t);
  }, [info]);

  const filtered = useMemo(() => {
    let arr = list;
    if (tab !== "all") arr = arr.filter((x) => x.status === tab);
    if (q.trim()) {
      const lower = q.toLowerCase();
      arr = arr.filter((x) =>
        (x.title || "").toLowerCase().includes(lower) ||
        (x.category || "").toLowerCase().includes(lower) ||
        (x.location?.label || "").toLowerCase().includes(lower)
      );
    }
    return arr;
  }, [list, tab, q]);

  const tabCounts = useMemo(() => ({
    all: list.length,
    active: list.filter((x) => x.status === "active").length,
    passive: list.filter((x) => x.status === "passive").length,
    draft: list.filter((x) => x.status === "draft").length,
  }), [list]);

  async function onDelete(id: string) {
    if (!confirm("Bu hizmeti silmek istediğinize emin misiniz?")) return;
    try {
      await deleteServiceListing(id);
      setInfo("Hizmet silindi.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Silinemedi.");
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: "Tümü" },
    { key: "active", label: "Aktif" },
    { key: "passive", label: "Pasif" },
    { key: "draft", label: "Taslak" },
  ];

  return (
    <ServiceProviderOnly>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-50">Hizmetlerim</h1>
                <p className="text-xs text-slate-400 mt-0.5">Kurs, eğitim ve belge hizmetlerinizi yönetin</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/service-provider/dashboard" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors">← Panel</Link>
                <Link href="/service-provider/services/new" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition-colors">+ Hizmet Ekle</Link>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {err && (
            <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
              <span className="text-rose-400">✕</span> {err}
            </div>
          )}
          {info && (
            <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2">
              <span className="text-emerald-400">✓</span> {info}
            </div>
          )}

          {/* Tabs (kariyer.net tarzı) */}
          <div className="flex items-center gap-1 border-b border-slate-800 pb-0">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  tab === t.key
                    ? "border-teal-400 text-teal-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.label} ({tabCounts[t.key]})
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hizmet adı veya kategori ara…"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-teal-600/50 focus:ring-1 focus:ring-teal-600/30 transition-colors"
          />

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-teal-400" />
              Yükleniyor…
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
              <div className="text-4xl mb-3">🎓</div>
              <div className="text-slate-400 text-sm">
                {q || tab !== "all" ? "Filtreye uygun hizmet bulunamadı." : "Henüz hizmet eklenmemiş."}
              </div>
              {!q && tab === "all" && (
                <Link href="/service-provider/services/new" className="mt-3 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
                  İlk Hizmeti Ekle
                </Link>
              )}
            </div>
          )}

          {/* Service Cards */}
          {!loading && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((item: any) => {
                const badge = STATUS_MAP[item.status || "draft"] || STATUS_MAP.draft;
                const catLabel = catMap[item.category || ""] || item.category || "—";
                return (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-800/30 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-100 truncate">{item.title || "Hizmet"}</span>
                          <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">{catLabel}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          {item.location?.label && <span>📍 {item.location.label}</span>}
                          {item.deliveryMethods?.length > 0 && (
                            <span>🎯 {item.deliveryMethods.map((m: string) => DELIVERY_LABELS[m] || m).join(", ")}</span>
                          )}
                          {item.price?.displayText && <span>💰 {item.price.displayText}</span>}
                          {item.price?.amount && !item.price?.displayText && <span>💰 {item.price.amount} {item.price.currency || "TRY"}</span>}
                          {item.duration?.displayText && <span>⏱️ {item.duration.displayText}</span>}
                          {item.createdAt && <span className="text-slate-500">{fmtDate(item.createdAt)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/service-provider/services/${item._id}`}
                          className="rounded-lg border border-sky-600/40 bg-sky-950/30 px-3 py-1.5 text-xs text-sky-300 hover:bg-sky-900/30 transition-colors"
                        >
                          Düzenle
                        </Link>
                        <button
                          onClick={() => onDelete(item._id)}
                          className="rounded-lg border border-rose-800/40 bg-rose-950/20 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-900/30 transition-colors"
                        >
                          Sil
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
              <Link href="/service-provider/dashboard" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Panel</Link>
              <Link href="/service-provider/services" className="rounded-xl border border-teal-600/40 bg-teal-950/30 px-2 py-2 text-center text-[11px] font-medium text-teal-300">Hizmetler</Link>
              <Link href="/service-provider/services/new" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Ekle</Link>
              <Link href="/service-provider/profile" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Profil</Link>
            </div>
          </div>
        </nav>
      </div>
    </ServiceProviderOnly>
  );
}
