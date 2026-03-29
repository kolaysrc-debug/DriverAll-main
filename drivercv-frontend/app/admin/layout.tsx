"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";
import { apiFetch } from "@/lib/api/_core";
import AdminOnly from "@/components/AdminOnly";
import {
  MENU_CATALOG,
  DEFAULT_TOP_BAR,
  DEFAULT_BOTTOM_BAR,
  type NavBarItem,
  type DashboardItem,
} from "@/lib/dashboardCatalog";

function resolveBarItems(items: NavBarItem[]): (DashboardItem & { order: number })[] {
  return items
    .map((ni) => {
      const meta = MENU_CATALOG[ni.itemId];
      if (!meta) return null;
      return { ...meta, order: ni.order };
    })
    .filter(Boolean)
    .sort((a, b) => a!.order - b!.order) as (DashboardItem & { order: number })[];
}

const ALL_MENU_IDS = Object.keys(MENU_CATALOG);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [topBar, setTopBar] = useState<NavBarItem[]>(DEFAULT_TOP_BAR);
  const [bottomBar, setBottomBar] = useState<NavBarItem[]>(DEFAULT_BOTTOM_BAR);
  const [origTopBar, setOrigTopBar] = useState<NavBarItem[]>(DEFAULT_TOP_BAR);
  const [origBottomBar, setOrigBottomBar] = useState<NavBarItem[]>(DEFAULT_BOTTOM_BAR);

  const loadLayout = useCallback(async () => {
    try {
      const data = await apiFetch("/api/admin/dashboard-layout/my");
      if (data?.layout) {
        if (data.layout.topBar?.length) {
          setTopBar(data.layout.topBar);
          setOrigTopBar(data.layout.topBar);
        }
        if (data.layout.bottomBar?.length) {
          setBottomBar(data.layout.bottomBar);
          setOrigBottomBar(data.layout.bottomBar);
        }
      }
    } catch { /* defaults */ }
  }, []);

  useEffect(() => { loadLayout(); }, [loadLayout]);

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch("/api/admin/dashboard-layout/my", {
        method: "PUT",
        body: JSON.stringify({ topBar, bottomBar }),
      });
      setOrigTopBar([...topBar]);
      setOrigBottomBar([...bottomBar]);
      setEditMode(false);
    } catch (e: unknown) {
      alert((e as Error)?.message || "Kayıt hatası");
    } finally { setSaving(false); }
  }

  function handleCancel() {
    setTopBar([...origTopBar]);
    setBottomBar([...origBottomBar]);
    setEditMode(false);
  }

  async function resetMenusToDefault() {
    if (!confirm("Menüleri varsayılana döndürmek istediğinize emin misiniz?")) return;
    try {
      await apiFetch("/api/admin/dashboard-layout/my", { method: "DELETE" });
      setTopBar([...DEFAULT_TOP_BAR]);
      setBottomBar([...DEFAULT_BOTTOM_BAR]);
      setOrigTopBar([...DEFAULT_TOP_BAR]);
      setOrigBottomBar([...DEFAULT_BOTTOM_BAR]);
      setEditMode(false);
    } catch (e: unknown) {
      alert((e as Error)?.message || "Sıfırlama hatası");
    }
  }

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href);
  }

  function toggleBarItem(bar: "top" | "bottom", itemId: string) {
    const setter = bar === "top" ? setTopBar : setBottomBar;
    setter((prev) => {
      const exists = prev.some((i) => i.itemId === itemId);
      if (exists) return prev.filter((i) => i.itemId !== itemId);
      return [...prev, { itemId, order: prev.length }];
    });
  }

  function moveBarItem(bar: "top" | "bottom", itemId: string, dir: -1 | 1) {
    const setter = bar === "top" ? setTopBar : setBottomBar;
    setter((prev) => {
      const arr = [...prev];
      const idx = arr.findIndex((i) => i.itemId === itemId);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return prev;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr.map((item, i) => ({ ...item, order: i }));
    });
  }

  const topLinks = resolveBarItems(topBar);
  const bottomLinks = resolveBarItems(bottomBar);

  return (
    <AdminOnly>
      <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
        {/* ═══ STICKY TOP BAR ═══ */}
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-3 md:px-6">
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center gap-1 md:gap-2 overflow-x-auto scrollbar-none">
                <Link
                  href="/admin"
                  className="shrink-0 text-sm font-bold text-slate-200 hover:text-white mr-2 md:mr-4 transition-colors"
                >
                  🏠
                </Link>

                <nav className="hidden md:flex items-center gap-0.5">
                  {topLinks.map((link) => (
                    <Link
                      key={link.id}
                      href={link.href}
                      className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                        isActive(link.href)
                          ? "bg-slate-800 text-white font-semibold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <span className="mr-1">{link.icon}</span>
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-2.5 py-1.5 text-[11px] rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/40 transition-colors"
                    title="Menü düzenle"
                  >
                    ✏️ Menü
                  </button>
                ) : (
                  <>
                    <button onClick={handleSave} disabled={saving}
                      className="px-2.5 py-1.5 text-[11px] rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors disabled:opacity-50">
                      {saving ? "..." : "💾 Kaydet"}
                    </button>
                    <button onClick={handleCancel}
                      className="px-2 py-1.5 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
                      İptal
                    </button>
                  </>
                )}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Çıkış
                </button>
              </div>
            </div>
          </div>

          {mobileMenuOpen && !editMode && (
            <div className="md:hidden border-t border-slate-800 bg-slate-950/98 backdrop-blur-md px-3 pb-3 pt-2">
              <nav className="grid grid-cols-3 gap-1.5">
                {topLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-2 py-2 text-xs rounded-lg text-center transition-colors ${
                      isActive(link.href)
                        ? "bg-slate-800 text-white font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="text-base">{link.icon}</div>
                    <div className="mt-0.5">{link.label}</div>
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {editMode && (
            <div className="border-t border-amber-800/30 bg-amber-950/10 backdrop-blur-md px-3 py-3 max-h-[70vh] overflow-y-auto">
              <div className="mx-auto max-w-5xl space-y-4">
                <div className="text-[11px] text-amber-300 flex items-center justify-between">
                  <span>💡 Menü öğelerini ekle/çıkar ve sırasını değiştir. Kaydet ile kalıcı olur.</span>
                  <button onClick={resetMenusToDefault}
                    className="text-[10px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/40 transition-colors whitespace-nowrap ml-3">
                    ↩ Varsayılana Dön
                  </button>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-300 mb-2">Üst Menü (Header)</h3>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {topBar.map((ni) => {
                      const meta = MENU_CATALOG[ni.itemId];
                      if (!meta) return null;
                      return (
                        <div key={ni.itemId} className="flex items-center gap-0.5 bg-slate-800 rounded-lg pl-2 pr-1 py-1 text-[11px]">
                          <button onClick={() => moveBarItem("top", ni.itemId, -1)}
                            className="text-slate-500 hover:text-slate-200 px-0.5">◀</button>
                          <span className="mx-1">{meta.icon} {meta.label}</span>
                          <button onClick={() => moveBarItem("top", ni.itemId, 1)}
                            className="text-slate-500 hover:text-slate-200 px-0.5">▶</button>
                          <button onClick={() => toggleBarItem("top", ni.itemId)}
                            className="text-rose-400 hover:text-rose-300 px-1 ml-1">✕</button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ALL_MENU_IDS.filter((id) => !topBar.some((i) => i.itemId === id)).map((id) => {
                      const meta = MENU_CATALOG[id];
                      return (
                        <button key={id} onClick={() => toggleBarItem("top", id)}
                          className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors">
                          + {meta.icon} {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-300 mb-2">Alt Menü (Footer)</h3>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {bottomBar.map((ni) => {
                      const meta = MENU_CATALOG[ni.itemId];
                      if (!meta) return null;
                      return (
                        <div key={ni.itemId} className="flex items-center gap-0.5 bg-slate-800 rounded-lg pl-2 pr-1 py-1 text-[11px]">
                          <button onClick={() => moveBarItem("bottom", ni.itemId, -1)}
                            className="text-slate-500 hover:text-slate-200 px-0.5">◀</button>
                          <span className="mx-1">{meta.icon} {meta.label}</span>
                          <button onClick={() => moveBarItem("bottom", ni.itemId, 1)}
                            className="text-slate-500 hover:text-slate-200 px-0.5">▶</button>
                          <button onClick={() => toggleBarItem("bottom", ni.itemId)}
                            className="text-rose-400 hover:text-rose-300 px-1 ml-1">✕</button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ALL_MENU_IDS.filter((id) => !bottomBar.some((i) => i.itemId === id)).map((id) => {
                      const meta = MENU_CATALOG[id];
                      return (
                        <button key={id} onClick={() => toggleBarItem("bottom", id)}
                          className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors">
                          + {meta.icon} {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 pb-16 md:pb-14">
          {children}
        </main>

        {!editMode && (
          <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-1 md:px-4">
              <nav className="flex items-center justify-around md:justify-center md:gap-1 h-13 md:h-11">
                <Link
                  href="/admin"
                  className={`flex flex-col md:flex-row items-center gap-0 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg transition-colors min-w-0 ${
                    pathname === "/admin"
                      ? "text-white bg-slate-800"
                      : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <span className="text-sm md:text-xs">🏠</span>
                  <span className="text-[10px] md:text-xs leading-tight">Panel</span>
                </Link>
                {bottomLinks.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex flex-col md:flex-row items-center gap-0 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg transition-colors min-w-0 ${
                      isActive(item.href)
                        ? "text-white bg-slate-800"
                        : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/40"
                    }`}
                  >
                    <span className="text-sm md:text-xs">{item.icon}</span>
                    <span className="text-[10px] md:text-xs leading-tight truncate">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </footer>
        )}
      </div>
    </AdminOnly>
  );
}
