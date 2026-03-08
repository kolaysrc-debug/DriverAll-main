"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import RoleGate from "@/components/RoleGate";

type MenuItem = {
  href: string;
  label: string;
  roles?: string[];
};

function readRole(): string {
  try {
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;
    return String(user?.role || "").trim().toLowerCase();
  } catch {
    return "";
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setRole(readRole());
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const items: MenuItem[] = useMemo(() => {
    const r = String(role || "").toLowerCase();

    const common: MenuItem[] = [{ href: "/profile", label: "Profil" }];

    if (r === "admin") {
      return [
        ...common,
        { href: "/admin/dashboard", label: "Admin" },
        { href: "/profile/cv", label: "CV" },
      ];
    }

    if (r === "employer" || r === "company") {
      return [
        ...common,
        { href: "/employer/profile", label: "Firma Profili" },
        { href: "/employer/branches", label: "Şubeler" },
        { href: "/employer/jobs", label: "İlanlarım" },
        { href: "/employer/jobs/new", label: "Yeni İlan" },
        { href: "/employer/applications", label: "Başvurular" },
      ];
    }

    if (r === "advertiser") {
      return [
        ...common,
        { href: "/advertiser/profile", label: "Firma Profili" },
        { href: "/advertiser/requests", label: "Taleplerim" },
        { href: "/advertiser/requests/new", label: "Yeni Talep" },
      ];
    }

    return [
      ...common,
      { href: "/profile/cv", label: "CV" },
      { href: "/jobs", label: "İlanlar" },
      { href: "/driver/applications", label: "Başvurularım" },
      { href: "/orders", label: "Kurs / Hizmet Al" },
    ];
  }, [role]);

  useEffect(() => {
    if (pathname === "/profile") {
      const r = String(role || "").toLowerCase();
      const target = r === "driver" || r === "admin" ? "/profile/cv" : "/profile";
      if (target !== "/profile") router.replace(target);
    }
  }, [pathname, role, router]);

  return (
    <RoleGate>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* ── Üst Navigasyon ── */}
        <nav className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex h-12 items-center justify-between">
              {/* Hamburger — sadece mobil */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                aria-label="Menü"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              {/* Desktop yatay menü */}
              <div className="hidden lg:flex items-center gap-1">
                {items.map((it) => {
                  const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href + "/"));
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={[
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition",
                        active
                          ? "bg-slate-800 text-slate-50"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60",
                      ].join(" ")}
                    >
                      {it.label}
                    </Link>
                  );
                })}
              </div>

              {/* Mobilde: aktif sayfa adı */}
              <span className="lg:hidden text-sm font-medium text-slate-200">
                {items.find((it) => pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href + "/")))?.label || "Profil"}
              </span>

              <div className="w-8 lg:hidden" />
            </div>
          </div>

          {/* Mobil açılır menü */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 pb-3 pt-2 space-y-1">
              {items.map((it) => {
                const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href + "/"));
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={[
                      "block px-3 py-2 rounded-lg text-sm transition",
                      active
                        ? "bg-slate-800 text-slate-50 font-medium"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60",
                    ].join(" ")}
                  >
                    {it.label}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* ── İçerik ── */}
        <div className="mx-auto max-w-7xl px-4 py-4 lg:py-6">
          {children}
        </div>
      </div>
    </RoleGate>
  );
}
