"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authHeaders, getApiBase } from "@/lib/authHeaders";

type Profile = {
  fullName?: string;
  country?: string;
  city?: string;
  role?: string;
};

export default function DriverDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : {};

    if (!token) {
      router.replace("/login");
      return;
    }

    // Driver olmayan burada durmasın; merkez yönlendirmeye geri
    if (user?.role && user.role !== "driver" && user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/profile/me`, {
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || `Profil alınamadı (status: ${res.status})`);
        setProfile(json?.profile || null);
      } catch (e: any) {
        setErr(e?.message || "Profil bilgileri alınırken hata oluştu.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-slate-100">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Sürücü Dashboard</h1>
        <div className="mt-2 text-sm text-slate-400">
          Profil/CV ve başvurularını buradan yönetebilirsin.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 md:col-span-2">
          <div className="mb-2 text-sm text-slate-400">Özet</div>

          {loading ? (
            <div className="text-sm text-slate-300">Yükleniyor…</div>
          ) : err ? (
            <div className="rounded-md border border-rose-700 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
              {err}
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-slate-400">Ad Soyad:</span>{" "}
                <span className="text-slate-100">{profile?.fullName || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400">Konum:</span>{" "}
                <span className="text-slate-100">
                  {(profile?.country || "-") + " / " + (profile?.city || "-")}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="mb-2 text-sm text-slate-400">Hızlı İşlemler</div>

          <div className="flex flex-col gap-2">
            <a
              href="/profile"
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Profil / CV
            </a>
            <a
              href="/jobs"
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
            >
              İlanları Gör
            </a>
            <a
              href="/drivers/apply"
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Başvuru Yap
            </a>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Not: Başvuru geçmişi/puanlama kartlarını bir sonraki fazda ekleriz.
          </div>
        </div>
      </div>
    </div>
  );
}
