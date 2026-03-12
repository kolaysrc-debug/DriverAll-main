"use client";

// PATH: drivercv-frontend/app/dashboard/page.tsx
// ----------------------------------------------------------
// Dashboard Router
// - localStorage'daki user.role'a göre doğru dashboard'a yönlendirir
// ----------------------------------------------------------

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/session";

export default function DashboardRouter() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();

    // ✅ MINIMAL FIX: role normalize (Driver/DRIVER/ driver  -> driver)
    const role = String(user?.role || "").trim().toLowerCase();

    if (!role) {
      router.replace("/register/auth");
      return;
    }

    if (role === "admin") {
      router.replace("/admin/dashboard");
      return;
    }

    if (role === "employer") {
      router.replace("/employer/dashboard");
      return;
    }

    if (role === "advertiser") {
      router.replace("/advertiser/dashboard");
      return;
    }

    // ✅ default: driver (driver dahil tüm diğerleri)
    router.replace("/driver/dashboard");
  }, [router]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-slate-200">
      <h1 className="text-xl font-semibold">Yönlendiriliyor…</h1>
      <p className="mt-2 text-sm text-slate-400">
        Rolünüze göre dashboard açılıyor.
      </p>
    </div>
  );
}
