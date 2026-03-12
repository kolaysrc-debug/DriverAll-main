"use client";

// PATH: drivercv-frontend/app/account/page.tsx
// ----------------------------------------------------------
// Account / Profile Editor (employer + advertiser + driver + admin)
// - Basit ortak alanlar (fullName, phone, country, city, about)
// - CV değil, sadece profil bilgileri
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import Link from "next/link";
import RoleGate from "@/components/RoleGate";
import { getToken, getUser } from "@/lib/session";

type Profile = {
  fullName?: string;
  phone?: string;
  country?: string;
  city?: string;
  about?: string;
};

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  const [form, setForm] = useState<Profile>({
    fullName: "",
    phone: "",
    country: "TR",
    city: "",
    about: "",
  });

  useEffect(() => {
    const u = getUser();
    if (u?.role) setUserRole(String(u.role));

    const token = getToken();
    if (!token) return;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch("/api/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Profil alınamadı.");
        const json = await res.json();
        const p = (json?.profile || {}) as Profile;
        setForm({
          fullName: p.fullName || "",
          phone: p.phone || "",
          country: p.country || "TR",
          city: p.city || "",
          about: p.about || "",
        });
      } catch (e: any) {
        setErr(e?.message || "Profil alınamadı.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSave() {
    const token = getToken();
    if (!token) return;

    setSaving(true);
    setErr(null);
    setOk(null);

    try {
      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Kaydedilemedi.");
      setOk("Bilgiler başarıyla kaydedildi.");
      setTimeout(() => setOk(null), 4000);
    } catch (e: any) {
      setErr(e?.message || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  const isDriver = userRole === "driver" || userRole === "admin";

  return (
    <RoleGate allowRoles={["admin", "driver", "employer", "advertiser"]}>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-3xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600/20 text-sky-400 text-base font-bold">
                  {(form.fullName || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-50">Hesap Ayarları</h1>
                  <p className="text-xs text-slate-400 mt-0.5">Profil bilgilerini güncelle</p>
                </div>
              </div>
              {isDriver && (
                <Link
                  href="/driver/dashboard"
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  ← Panel
                </Link>
              )}
            </div>
          </div>

          {/* Mesajlar */}
          {err && (
            <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
              <span className="text-rose-400">✕</span> {err}
            </div>
          )}
          {ok && (
            <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2">
              <span className="text-emerald-400">✓</span> {ok}
            </div>
          )}

          {/* Form */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
              Yükleniyor…
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ad Soyad / Firma Yetkilisi</span>
                <input
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-600/50 focus:ring-1 focus:ring-sky-600/30 transition-colors"
                  value={form.fullName || ""}
                  onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                  placeholder="Adınız Soyadınız"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Telefon</span>
                <input
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-600/50 focus:ring-1 focus:ring-sky-600/30 transition-colors"
                  value={form.phone || ""}
                  onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="+90 5XX XXX XX XX"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ülke</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-600/50 focus:ring-1 focus:ring-sky-600/30 transition-colors"
                    value={form.country || ""}
                    onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))}
                    placeholder="TR"
                  />
                </label>

                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Şehir</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-600/50 focus:ring-1 focus:ring-sky-600/30 transition-colors"
                    value={form.city || ""}
                    onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
                    placeholder="İstanbul"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hakkında</span>
                <textarea
                  className="mt-1.5 w-full min-h-[120px] rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-600/50 focus:ring-1 focus:ring-sky-600/30 transition-colors resize-y"
                  value={form.about || ""}
                  onChange={(e) => setForm((s) => ({ ...s, about: e.target.value }))}
                  placeholder="Kendinizi kısaca tanıtın…"
                />
              </label>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60 transition-colors"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
                {isDriver && (
                  <Link
                    href="/cv"
                    className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    CV Düzenle →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MOBİL ALT NAVİGASYON (driver ise) */}
        {isDriver && (
          <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
            <div className="mx-auto max-w-6xl px-3 py-2">
              <div className="grid grid-cols-4 gap-2">
                <Link href="/driver/dashboard" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Panel</Link>
                <Link href="/jobs" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">İlanlar</Link>
                <Link href="/driver/applications" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Başvurular</Link>
                <Link href="/cv" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">CV</Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </RoleGate>
  );
}
