"use client";

// PATH: drivercv-frontend/components/RoleGate.tsx
// ----------------------------------------------------------
// RoleGate
// - localStorage token/user kontrolü
// - allowRoles verilirse rol kontrolü
// - advertiser ise (opsiyonel) isApproved kontrolü
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "admin" | "employer" | "advertiser" | "driver" | "service_provider";

type StoredUser = {
  _id?: string;
  name?: string;
  email?: string;
  role?: Role | string;
  isApproved?: boolean;
  isActive?: boolean;
};

function readStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readToken(): string | null {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
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
  const [ready, setReady] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const token = readToken();
    const user = readStoredUser();

    if (!token || !user) {
      router.replace(redirectTo);
      return;
    }

    if (user.isActive === false) {
      setReason("Bu hesap pasif/bloklu görünüyor.");
      setReady(true);
      return;
    }

    const role = String(user.role || "").trim().toLowerCase() as Role;

    if (allowRoles && allowRoles.length > 0) {
  const allowed = allowRoles.map((r) => String(r).trim().toLowerCase() as Role);
  if (!allowed.includes(role)) {
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
  }, [router, allowRoles, redirectTo, redirectNoAccessTo, requireAdvertiserApproved]);

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
