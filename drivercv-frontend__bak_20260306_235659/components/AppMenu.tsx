"use client";

// PATH: DriverAll-main/drivercv-frontend/components/AppMenu.tsx
// ----------------------------------------------------------
// Sayfa üstü menü (TopBar'ın alt satırı)
// - Scrollable pill menü
// - drivers yerine users: /admin/users
// ----------------------------------------------------------

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = { role: string };

type MenuItem = { href: string; label: string };

function pillClass(active: boolean) {
  return [
    "inline-flex items-center whitespace-nowrap rounded-full px-3 py-2 text-xs border",
    active
      ? "bg-slate-800 border-slate-600 text-slate-50"
      : "bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-900",
  ].join(" ");
}

export default function AppMenu({ role }: Props) {
  const pathname = usePathname();

  const items: MenuItem[] = useMemo(() => {
    const r = String(role || "").toLowerCase();

    // Ortak
    const common: MenuItem[] = [{ href: "/profile", label: "Profil" }];

    if (r === "admin") {
      return [
        ...common,
        { href: "/admin/dashboard", label: "Admin" },
        { href: "/admin/job-approvals", label: "İlan Onayları" },
        { href: "/admin/approvals", label: "Reklamveren Onay" },
        { href: "/admin/ad-campaigns", label: "Reklam Kampanyaları" },
        { href: "/admin/placements", label: "Ad Placements" },
        { href: "/admin/geo-groups", label: "Geo Groups" },
        { href: "/admin/users", label: "Kullanıcılar" }, // drivers değil
        { href: "/admin/groups", label: "Gruplar" },
        { href: "/admin/criteria", label: "Kriterler" },
      ];
    }

    if (r === "employer") {
      return [
        ...common,
        { href: "/employer/dashboard", label: "Employer" },
        { href: "/employer/branches", label: "Şubeler" },
        { href: "/employer/jobs", label: "İlanlarım" },
        { href: "/employer/jobs/new", label: "Yeni İlan" },
      ];
    }

    if (r === "advertiser") {
      return [
        ...common,
        { href: "/advertiser/dashboard", label: "Advertiser" },
        { href: "/advertiser/requests", label: "Taleplerim" },
        { href: "/advertiser/requests/new", label: "Yeni Talep" },
      ];
    }

    // driver default
    return [
      ...common,
      { href: "/driver/dashboard", label: "Driver" },
      { href: "/profile/cv", label: "CV" },
      { href: "/jobs", label: "İlanlar" },
    ];
  }, [role]);

  return (
    <nav className="flex items-center gap-2">
      {items.map((it) => {
        const active =
          pathname === it.href ||
          (it.href !== "/" && pathname.startsWith(it.href + "/"));

        return (
          <Link key={it.href} href={it.href} className={pillClass(active)}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
