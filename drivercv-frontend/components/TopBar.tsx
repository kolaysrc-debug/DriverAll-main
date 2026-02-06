"use client";

// PATH: DriverAll-main/drivercv-frontend/components/TopBar.tsx
// ----------------------------------------------------------
// TopBar (revize)
// - Rol bazlı menüler
// - Admin menüsü: İlan / Reklam başlıkları kapalı -> hover ile sağa açılan (flyout)
// - Admin "Ana motorlar": Groups + Criteria + Fields
// - Auth state'i localStorage'dan okur
// - Login/Logout sonrası sayfa yenilemeye gerek kalmadan güncellenir (custom event)
// - Route değişince menüler kapanır
// ----------------------------------------------------------

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type UserLike = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  isApproved?: boolean;
  isActive?: boolean;
};

const AUTH_CHANGED_EVENT = "driverall-auth-changed";

function getStoredUser(): UserLike | null {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem("user") : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as UserLike;
  } catch {
    return null;
  }
}

function hasStoredToken(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage.getItem("token");
  } catch {
    return false;
  }
}

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserLike | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [open, setOpen] = useState(false);

  const loadAuthFromStorage = useCallback(() => {
    setHasToken(hasStoredToken());
    setUser(getStoredUser());
  }, []);

  // Route değişince auth'ı oku + menüleri kapat
  useEffect(() => {
    if (typeof window === "undefined") return;
    loadAuthFromStorage();
    setOpen(false);
  }, [pathname, loadAuthFromStorage]);

  // Login/Logout gibi "storage değişti" durumlarında anında güncelle
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => loadAuthFromStorage();
    window.addEventListener(AUTH_CHANGED_EVENT, handler);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handler);
  }, [loadAuthFromStorage]);

  const role = (user?.role || "").toLowerCase();
  const isAdmin = role === "admin";
  const isEmployer = role === "employer" || role === "company";
  const isAdvertiser = role === "advertiser";
  const isDriver = role === "driver" || (!isAdmin && !isEmployer && !isAdvertiser);

  const dashboardHref = useMemo(() => {
    if (isAdmin) return "/admin/dashboard";
    if (isEmployer) return "/employer/dashboard";
    if (isAdvertiser) return "/advertiser/dashboard";
    return "/driver/dashboard";
  }, [isAdmin, isEmployer, isAdvertiser]);

  const displayName = useMemo(() => {
    const name = (user?.name || "").trim();
    if (name) return name;
    const email = (user?.email || "").trim();
    if (email) return email;
    return "Hesabım";
  }, [user]);

  const roleLabel = useMemo(() => {
    const r = (user?.role || "").toLowerCase();
    if (!r) return "";
    if (r === "admin") return "Admin";
    if (r === "employer" || r === "company") return "İşveren";
    if (r === "advertiser") return "Reklamveren";
    if (r === "driver") return "Sürücü";
    return r;
  }, [user]);

  const handleLogout = () => {
    try {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    } catch {}
    setOpen(false);
    router.replace("/login");
  };

  // Menü açıkken dışarı tıklanınca kapat
  useEffect(() => {
    if (!open) return;

    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const root = document.querySelector("[data-topbar-root='1']");
      if (root && root.contains(target)) return;

      setOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const handleMenuLinkClick = () => setOpen(false);

  // ----------------------------------------------------------
  // Üst menü kısayolları (rol bazlı) - kısa tutuldu
  // ----------------------------------------------------------
  const topShortcuts = useMemo(() => {
    const items: { href: string; label: string }[] = [{ href: dashboardHref, label: "Dashboard" }];

    if (isAdmin) {
      items.push(
        // Ana motorlar (kısa menüde en azından Fields görünür olsun)
        { href: "/admin/fields", label: "Fields" },

        // Operasyon
        { href: "/admin/job-approvals", label: "İlan" },
        { href: "/admin/ad-requests", label: "Reklam" },
        { href: "/admin/users", label: "Kullanıcılar" }
      );
    } else if (isEmployer) {
      items.push(
        { href: "/employer/jobs", label: "İlanlarım" },
        { href: "/employer/job-requests", label: "Taleplerim" }
      );
    } else if (isAdvertiser) {
      items.push(
        { href: "/advertiser/ads", label: "Reklamlarım" },
        { href: "/advertiser/requests", label: "Taleplerim" }
      );
    } else if (isDriver) {
      // şimdilik ekstra kısa yol eklemiyoruz (sade kalsın)
    }

    const seen = new Set<string>();
    return items.filter((it) => {
      if (seen.has(it.href)) return false;
      seen.add(it.href);
      return true;
    });
  }, [dashboardHref, isAdmin, isEmployer, isAdvertiser, isDriver]);

  // ----------------------------------------------------------
  // Admin flyout menüler (hover ile sağa açılır)
  // ----------------------------------------------------------
  const adminFlyouts = useMemo(() => {
    if (!isAdmin) return null;

    return {
      engines: {
        title: "Ana motorlar",
        links: [
          { href: "/admin/groups", label: "Grup Hiyerarşisi" },
          { href: "/admin/criteria", label: "Kriter Motoru" },
          { href: "/admin/fields", label: "Fields Motoru" },
          { href: "/admin/profile-roles", label: "Profil Roller" },
          { href: "/admin/profile-sections", label: "Profil Bölümler" },
          { href: "/admin/profile-fields", label: "Profil Alanları" },
          { href: "/admin/profile-overrides", label: "Profil Override'lar" },
        ],
      },
      jobs: {
        title: "İlan Yönetimi",
        links: [
          { href: "/admin/job-approvals", label: "İlan Onay" },
          { href: "/admin/job-requests", label: "İlan Talepleri" },
          { href: "/admin/job-packages", label: "İlan Paketleri" },
          { href: "/admin/jobs", label: "İlanlar" },
        ],
      },
      ads: {
        title: "Reklam Yönetimi",
        links: [
          { href: "/admin/ad-packages", label: "Reklam Paketleri" },
          { href: "/admin/ad-requests", label: "Reklam Talepleri" },
        ],
      },
    };
  }, [isAdmin]);

  return (
    <header
      data-topbar-root="1"
      className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-slate-100">
            DriverAll
          </Link>

          <nav className="hidden items-center gap-4 text-sm text-slate-300 md:flex">
            {topShortcuts.map((it) => (
              <Link key={it.href} href={it.href} className="hover:text-white">
                {it.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="relative flex items-center gap-2">
          {!user && hasToken ? (
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100 hover:bg-slate-800"
            >
              Çıkış
            </button>
          ) : !hasToken ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100 hover:bg-slate-800"
              >
                Giriş
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-sky-500/20 px-3 py-1 text-sm font-semibold text-sky-200 hover:bg-sky-500/25"
              >
                Kayıt
              </Link>
            </div>
          ) : (
            <>
              <button
                onClick={() => setOpen((v) => !v)}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-left text-sm text-slate-100 hover:bg-slate-800"
              >
                <div className="leading-tight">
                  <div className="font-medium">{displayName}</div>
                  {roleLabel ? <div className="text-[11px] text-slate-400">{roleLabel}</div> : null}
                </div>
              </button>

              {open && (
                <div className="absolute right-0 top-11 w-72 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-xl">
                  <div className="px-2 pb-2 pt-1">
                    <div className="text-xs text-slate-400">Hızlı Menü</div>
                  </div>

                  <Link
                    href={dashboardHref}
                    onClick={handleMenuLinkClick}
                    className="block rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-slate-900"
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/advertiser/profile"
                    onClick={handleMenuLinkClick}
                    className="block rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-slate-900"
                  >
                    Profili düzenle
                  </Link>

                  {/* Employer menü */}
                  {isEmployer && (
                    <>
                      <div className="mt-2 px-2 pb-1 text-xs font-semibold text-slate-400">İlan</div>
                      <Link
                        href="/employer/jobs"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-slate-900"
                      >
                        İlanlarım
                      </Link>
                      <Link
                        href="/employer/job-requests"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-slate-900"
                      >
                        İlan Taleplerim
                      </Link>
                    </>
                  )}

                  {/* Advertiser menü */}
                  {isAdvertiser && (
                    <>
                      <div className="mt-2 px-2 pb-1 text-xs font-semibold text-slate-400">Reklam</div>
                      <Link
                        href="/advertiser/ads"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-slate-900"
                      >
                        Reklamlarım
                      </Link>
                      <Link
                        href="/advertiser/requests"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-slate-900"
                      >
                        Reklam Taleplerim
                      </Link>
                    </>
                  )}

                  {/* Admin menü */}
                  {isAdmin && adminFlyouts && (
                    <>
                      <div className="mt-2 h-px bg-slate-800" />

                      {/* Flyout: Ana motorlar */}
                      <div className="relative group">
                        <div className="mt-2 px-2 pb-1 text-xs font-semibold text-slate-400">Motorlar</div>

                        <div className="rounded-md hover:bg-slate-900">
                          <div className="flex items-center justify-between px-2 py-2 text-sm text-slate-200">
                            <span>{adminFlyouts.engines.title}</span>
                            <span className="text-xs text-slate-400">›</span>
                          </div>
                        </div>

                        <div className="absolute left-full top-7 ml-2 hidden w-72 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-xl group-hover:block">
                          <div className="px-2 pb-2 pt-1">
                            <div className="text-xs font-semibold text-slate-200">{adminFlyouts.engines.title}</div>
                            <div className="text-[11px] text-slate-400">Projenin omurgası.</div>
                          </div>
                          {adminFlyouts.engines.links.map((l) => (
                            <Link
                              key={`eng-${l.href}`}
                              href={l.href}
                              onClick={handleMenuLinkClick}
                              className="block rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-slate-900"
                            >
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Flyout: İlan Yönetimi */}
                      <div className="relative group">
                        <div className="rounded-md hover:bg-slate-900">
                          <div className="flex items-center justify-between px-2 py-2 text-sm text-slate-200">
                            <span>{adminFlyouts.jobs.title}</span>
                            <span className="text-xs text-slate-400">›</span>
                          </div>
                        </div>

                        <div className="absolute left-full top-0 ml-2 hidden w-72 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-xl group-hover:block">
                          <div className="px-2 pb-2 pt-1">
                            <div className="text-xs font-semibold text-slate-200">{adminFlyouts.jobs.title}</div>
                            <div className="text-[11px] text-slate-400">Üzerine gelince açılır (flyout).</div>
                          </div>
                          {adminFlyouts.jobs.links.map((l) => (
                            <Link
                              key={`jobs-${l.href}`}
                              href={l.href}
                              onClick={handleMenuLinkClick}
                              className="block rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-slate-900"
                            >
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Flyout: Reklam Yönetimi */}
                      <div className="relative group">
                        <div className="rounded-md hover:bg-slate-900">
                          <div className="flex items-center justify-between px-2 py-2 text-sm text-slate-200">
                            <span>{adminFlyouts.ads.title}</span>
                            <span className="text-xs text-slate-400">›</span>
                          </div>
                        </div>

                        <div className="absolute left-full top-0 ml-2 hidden w-72 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-xl group-hover:block">
                          <div className="px-2 pb-2 pt-1">
                            <div className="text-xs font-semibold text-slate-200">{adminFlyouts.ads.title}</div>
                            <div className="text-[11px] text-slate-400">Üzerine gelince açılır (flyout).</div>
                          </div>
                          {adminFlyouts.ads.links.map((l) => (
                            <Link
                              key={`ads-${l.href}`}
                              href={l.href}
                              onClick={handleMenuLinkClick}
                              className="block rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-slate-900"
                            >
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div className="my-2 h-px bg-slate-800" />

                      <div className="px-2 pb-1 text-xs font-semibold text-slate-400">Kullanıcı / Sistem</div>
                      <Link
                        href="/admin/users"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-slate-900"
                      >
                        Kullanıcılar
                      </Link>
                      <Link
                        href="/admin/approvals"
                        onClick={handleMenuLinkClick}
                        className="block rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-slate-900"
                      >
                        Onaylar
                      </Link>
                    </>
                  )}

                  <div className="my-2 h-px bg-slate-800" />

                  <button
                    onClick={handleLogout}
                    className="w-full rounded-md px-2 py-2 text-left text-sm text-rose-200 hover:bg-rose-950/30"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
