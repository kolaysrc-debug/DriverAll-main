"use client";

// PATH: drivercv-frontend/app/driver/dashboard/page.tsx
// ----------------------------------------------------------
// Driver Dashboard
// - Başvurularım linki eklendi: /driver/applications
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import RoleGate from "@/components/RoleGate";
import Link from "next/link";

type User = { name?: string; email?: string; role?: string };

export default function DriverDashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  return (
    <RoleGate allowRoles={["driver", "admin"]}>
      <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold">Sürücü Paneli</h1>
                <p className="text-sm text-slate-400 mt-1">
                  İlanlara başvur, başvurularını takip et, CV’ni güncelle.
                </p>
              </div>
              {user?.email ? (
                <div className="text-xs text-slate-400">
                  Oturum:{" "}
                  <span className="text-slate-100 font-semibold">
                    {user.name || user.email}
                  </span>
                  {user.role ? <span className="text-slate-500"> • {user.role}</span> : null}
                </div>
              ) : null}
            </div>
          </header>

          <section className="grid gap-3 md:grid-cols-3">
            <Link
              href="/jobs"
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/50 transition"
            >
              <div className="text-sm font-semibold">İlanlara Gözat</div>
              <div className="text-xs text-slate-400 mt-1">
                Açık ilanları incele ve başvuru yap.
              </div>
            </Link>

            <Link
              href="/driver/applications"
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/50 transition"
            >
              <div className="text-sm font-semibold">Başvurularım</div>
              <div className="text-xs text-slate-400 mt-1">
                Durum/puan/etiket ve işveren görüşlerini takip et.
              </div>
            </Link>

            <Link
              href="/profile"
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/50 transition"
            >
              <div className="text-sm font-semibold">Profil & CV</div>
              <div className="text-xs text-slate-400 mt-1">
                CV alanlarını düzenle, güncel tut.
              </div>
            </Link>
          </section>
        </div>
      </div>
    </RoleGate>
  );
}
