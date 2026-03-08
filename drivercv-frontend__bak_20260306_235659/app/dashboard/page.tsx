"use client";

// PATH: drivercv-frontend/app/dashboard/page.tsx
// ----------------------------------------------------------
// Dashboard Router
// - localStorage'daki user.role'a göre doğru dashboard'a yönlendirir
// ----------------------------------------------------------

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

type SafeUser = {
  role?: "admin" | "employer" | "advertiser" | "driver" | string;
};

function readUserFromStorage(): SafeUser | null {
  try {
    // Token varsa HER ZAMAN token payload'ını esas al (user kaydı bozuk kalmasın)
    const token = window.localStorage.getItem("token");
    if (token) {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
          atob(b64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(json);

        const userFromToken: any = {
          _id: payload.userId,
          email: payload.email,
          role: payload.role,
        };

        if (userFromToken.role) {
          window.localStorage.setItem("user", JSON.stringify(userFromToken));
          return userFromToken as SafeUser;
        }
      }
    }

    // Token yoksa user'a düş
    const raw = window.localStorage.getItem("user");
    if (!raw) return null;

    const u = JSON.parse(raw);
    if (u?.role) return u as SafeUser;

    return null;
  } catch {
    return null;
  }
}

export default function DashboardRouter() {
  const router = useRouter();

  useEffect(() => {
    const user = readUserFromStorage();

    // ✅ MINIMAL FIX: role normalize (Driver/DRIVER/ driver  -> driver)
    const role = String(user?.role || "").trim().toLowerCase();

    if (!role) {
      router.replace("/login");
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
