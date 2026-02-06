"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/dashboard/page.tsx
// ----------------------------------------------------------
// Employer Dashboard (verimli düzen)
// - Sol: firma/profil özeti
// - Orta: iş akış kartları
// - Sağ: reklam slotu (DASHBOARD_RIGHT)
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import Link from "next/link";
import EmployerOnly from "@/components/EmployerOnly";
import AdSlot from "@/components/AdSlot";

type StoredUser = {
  name?: string;
  email?: string;
  role?: string;
};

export default function EmployerDashboardPage() {
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("user");
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <EmployerOnly>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-slate-50">İşveren Dashboard</h1>
          <div className="text-xs text-slate-400">İlanlar ve başvurular için hızlı kontrol paneli</div>
        </div>

        <div className="grid gap-4 md:grid-cols-12">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 md:col-span-3">
            <div className="text-sm font-semibold text-slate-100">Profil</div>
            <div className="mt-2 text-sm text-slate-200">{user?.name || "(isim yok)"}</div>
            <div className="text-xs text-slate-400">{user?.email || "-"}</div>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/employer/profile"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
              >
                Firma profili
              </Link>

              <Link
                href="/jobs/new"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/25"
              >
                Yeni ilan oluştur
              </Link>

              <Link
                href="/employer/job-requests/new"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
              >
                İlan talebi oluştur (paket)
              </Link>

              <Link
                href="/employer/job-requests"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
              >
                İlan taleplerim
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 md:col-span-6">
            <div className="mb-3 text-sm font-semibold text-slate-100">İş Akışları</div>

            <div className="grid gap-3 md:grid-cols-2">
              <Link href="/jobs/new" className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40">
                <div className="text-sm font-semibold text-slate-50">İlan Oluştur</div>
                <div className="mt-1 text-xs text-slate-400">Yeni pozisyon aç, kriterleri belirle</div>
              </Link>

              <Link
                href="/employer/job-requests/new"
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
              >
                <div className="text-sm font-semibold text-slate-50">İlan Talebi Gönder</div>
                <div className="mt-1 text-xs text-slate-400">Paket seç → admin onayı → yayın</div>
              </Link>

              <Link
                href="/employer/applications"
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40"
              >
                <div className="text-sm font-semibold text-slate-50">Başvurular</div>
                <div className="mt-1 text-xs text-slate-400">Gelen başvuruları incele ve yönet</div>
              </Link>

              <Link href="/jobs" className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900/40">
                <div className="text-sm font-semibold text-slate-50">İlan Akışı</div>
                <div className="mt-1 text-xs text-slate-400">Platformdaki ilanları gözlemle</div>
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 md:col-span-3">
            <div className="text-sm font-semibold text-slate-100">Reklam</div>
            <div className="mt-3">
              <AdSlot placement="DASHBOARD_RIGHT" country="TR" />
            </div>
          </div>
        </div>
      </div>
    </EmployerOnly>
  );
}
