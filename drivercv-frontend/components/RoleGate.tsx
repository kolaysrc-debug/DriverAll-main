"use client";

// PATH: drivercv-frontend/components/RoleGate.tsx
// ----------------------------------------------------------
// RoleGate
// - localStorage token/user kontrolü
// - allowRoles verilirse rol kontrolü
// - advertiser ise (opsiyonel) isApproved kontrolü
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken, getUser } from "@/lib/session";

type Role = "admin" | "employer" | "advertiser" | "driver" | "service_provider";

function normalizeRoleForGate(input: string): Role {
  const v = String(input || "").trim().toLowerCase();
  if (v === "admin") return "admin";
  if (v === "employer" || v === "company") return "employer";
  if (v === "advertiser") return "advertiser";
  if (v === "service_provider") return "service_provider";
  return "driver";
}

export default function RoleGate({
  children,
  allowRoles,
  redirectTo = "/login",
  redirectNoAccessTo = "/dashboard",
  requireAdvertiserApproved = true,
}: {
  children: React.ReactNode;
  allowRoles?: Role[];
  redirectTo?: string;
  redirectNoAccessTo?: string;
  requireAdvertiserApproved?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      router.replace(redirectTo);
      return;
    }

    if (user.isActive === false) {
      setReason("Bu hesap pasif/bloklu görünüyor.");
      setReady(true);
      return;
    }

    const role = normalizeRoleForGate(String(user.role || ""));

    if (allowRoles && allowRoles.length > 0) {
      const allowed = allowRoles.map((r) => String(r).trim().toLowerCase() as Role);
      if (!allowed.includes(role)) {
        if (redirectNoAccessTo === "/dashboard" && (pathname === "/dashboard" || pathname?.startsWith("/driver"))) {
          setReason("Bu sayfaya erişim yetkiniz yok.");
          setReady(true);
          return;
        }
        router.replace(redirectNoAccessTo);
        return;
      }
    }
    if (requireAdvertiserApproved && role === "advertiser" && user.isApproved === false) {
      setReason("Reklamveren hesabınız admin onayı bekliyor.");
      setReady(true);
      return;
    }

    setReady(true);
  }, [router, pathname, allowRoles, redirectTo, redirectNoAccessTo, requireAdvertiserApproved]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-sm text-slate-300">
        Yükleniyor...
      </div>
    );
  }

  if (reason) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
          <div className="text-sm text-slate-200">{reason}</div>
          <div className="mt-3 flex gap-2">
            <button
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
              onClick={() => router.replace("/dashboard")}
            >
              Dashboard
            </button>
            <button
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
              onClick={() => router.replace("/login")}
            >
              Giriş
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
