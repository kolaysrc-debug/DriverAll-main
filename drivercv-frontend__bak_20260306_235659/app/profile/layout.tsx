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

function pillClass(active: boolean) {
  return [
    "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm border",
    active
      ? "bg-slate-900 border-slate-700 text-slate-50"
      : "bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-900",
  ].join(" ");
}

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

  useEffect(() => {
    setRole(readRole());
  }, []);

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
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
            <aside className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-fit">
              <div className="text-xs uppercase tracking-widest text-slate-400 px-1 mb-2">Menü</div>
              <nav className="space-y-2">
                {items.map((it) => {
                  const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href + "/"));
                  return (
                    <Link key={it.href} href={it.href} className={pillClass(active)}>
                      <span>{it.label}</span>
                      <span className="text-slate-600">›</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>

            <section className="min-w-0">{children}</section>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
