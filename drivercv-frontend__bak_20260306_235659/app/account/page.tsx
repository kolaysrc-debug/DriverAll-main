"use client";

// PATH: drivercv-frontend/app/account/page.tsx
// ----------------------------------------------------------
// Account / Profile Editor (employer + advertiser + driver + admin)
// - Basit ortak alanlar (fullName, phone, country, city, about)
// - CV değil, sadece profil bilgileri
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import RoleGate from "@/components/RoleGate";

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

  const [form, setForm] = useState<Profile>({
    fullName: "",
    phone: "",
    country: "TR",
    city: "",
    about: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
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
    const token = localStorage.getItem("token");
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
      setOk("Kaydedildi.");
    } catch (e: any) {
      setErr(e?.message || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RoleGate allowedRoles={["admin", "driver", "employer", "advertiser"]}>
      <div className="mx-auto max-w-3xl p-4 text-slate-100">
        <h1 className="mb-4 text-xl font-semibold">Hesap Bilgileri</h1>

        {loading ? (
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">Yükleniyor…</div>
        ) : (
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
            {err && <div className="mb-3 rounded-md border border-red-800 bg-red-950 p-2 text-sm">{err}</div>}
            {ok && <div className="mb-3 rounded-md border border-emerald-800 bg-emerald-950 p-2 text-sm">{ok}</div>}

            <div className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-sm text-slate-300">Ad Soyad / Firma Yetkilisi</span>
                <input
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
                  value={form.fullName || ""}
                  onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-slate-300">Telefon</span>
                <input
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
                  value={form.phone || ""}
                  onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm text-slate-300">Ülke</span>
                  <input
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
                    value={form.country || ""}
                    onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))}
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm text-slate-300">Şehir</span>
                  <input
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
                    value={form.city || ""}
                    onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-sm text-slate-300">Hakkında</span>
                <textarea
                  className="min-h-[110px] rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
                  value={form.about || ""}
                  onChange={(e) => setForm((s) => ({ ...s, about: e.target.value }))}
                />
              </label>

              <button
                onClick={onSave}
                disabled={saving}
                className="mt-2 w-fit rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
}
