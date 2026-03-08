"use client";

// PATH: DriverAll-main/drivercv-frontend/app/advertiser/profile/page.tsx
// ----------------------------------------------------------
// Advertiser Profile (Reklamveren Profili)
// - Employer profiline çok benzer
// - Lokasyon: /api/locations/list (TR -> il/ilçe dropdown)
//   advertiser için: il zorunlu, ilçe opsiyonel
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RoleGate from "@/components/RoleGate";

type Profile = any;

type LocItem = {
  code: string;
  name: string;
  parentCode?: string | null;
  level?: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

function normalizeCountryCode(value: string, fallback = "TR") {
  const v = String(value || "").trim().toUpperCase();
  if (!v) return fallback;
  if (v.length === 2) return v;
  return fallback;
}

async function fetchLocations(params: { country: string; level: "state" | "district"; parentCode?: string }) {
  const qs = new URLSearchParams();
  qs.set("country", params.country);
  qs.set("level", params.level);
  if (params.parentCode) qs.set("parentCode", params.parentCode);

  const res = await fetch(`/api/locations/list?${qs.toString()}`, { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || "Locations alınamadı.");
  }
  const list: LocItem[] = json.list || [];
  return list;
}

export default function AdvertiserProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  // Reklamveren alanları (employer’a benzer)
  const [companyName, setCompanyName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("TR");

  // Lokasyon
  const [stateCode, setStateCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [states, setStates] = useState<LocItem[]>([]);
  const [districts, setDistricts] = useState<LocItem[]>([]);
  const [locLoading, setLocLoading] = useState(false);

  const [aboutCompany, setAboutCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const headersAuth = useMemo(() => {
    const token = getToken();
    return token ? ({ Authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    setOk(null);

    try {
      const token = getToken();
      if (!token) throw new Error("Oturum bulunamadı (token yok). Aynı portta tekrar giriş yapın.");

      const res = await fetch("/api/profile/me", { headers: headersAuth });
      if (!res.ok) throw new Error("Profil bilgileri alınamadı.");
      const json = await res.json();
      const p: Profile = json.profile || {};

      const dyn = p.dynamicValues || {};
      const cn = String(p.fullName || dyn.companyName || "").trim();

      setProfile(p);

      setCompanyName(cn);
      setBrandName(String(dyn.brandName || "").trim());
      setWebsite(String(dyn.website || "").trim());
      setPhone(String(p.phone || dyn.phone || "").trim());
      setCountry(normalizeCountryCode(String(p.country || dyn.country || "TR"), "TR"));

      const loc = p.location || dyn.location || {};
      setStateCode(String(loc.cityCode || "").trim());
      setDistrictCode(String(loc.districtCode || "").trim());

      setAboutCompany(String(p.about || dyn.aboutCompany || "").trim());
      setContactName(String(dyn.contactName || "").trim());
      setContactEmail(String(dyn.contactEmail || p.email || "").trim());
    } catch (e: any) {
      setErr(e?.message || "Profil yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadStates() {
      try {
        setLocLoading(true);
        const c = normalizeCountryCode(country, "TR");
        if (c !== "TR") {
          setStates([]);
          setDistricts([]);
          return;
        }
        const s = await fetchLocations({ country: "TR", level: "state" });
        s.sort((a, b) => (a.name || "").localeCompare(b.name || "", "tr"));
        setStates(s);
      } catch (e: any) {
        setErr(e?.message || "İller yüklenemedi.");
      } finally {
        setLocLoading(false);
      }
    }
    loadStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  useEffect(() => {
    async function loadDistricts() {
      try {
        const c = normalizeCountryCode(country, "TR");
        if (c !== "TR" || !stateCode) {
          setDistricts([]);
          return;
        }
        setLocLoading(true);
        const d = await fetchLocations({ country: "TR", level: "district", parentCode: stateCode });
        d.sort((a, b) => (a.name || "").localeCompare(b.name || "", "tr"));
        setDistricts(d);

        if (districtCode) {
          const exists = d.some((x) => String(x.code) === String(districtCode));
          if (!exists) setDistrictCode("");
        }
      } catch (e: any) {
        setErr(e?.message || "İlçeler yüklenemedi.");
      } finally {
        setLocLoading(false);
      }
    }
    loadDistricts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, stateCode]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setOk(null);

    try {
      const token = getToken();
      if (!token) throw new Error("Giriş gerekli (token yok). Lütfen tekrar giriş yapın.");

      if (!companyName.trim()) throw new Error("Firma adı zorunludur.");

      const effectiveCountry = normalizeCountryCode(country, "TR");
      if (effectiveCountry === "TR" && !stateCode) throw new Error("İl seçimi zorunludur.");

      const stateObj = states.find((x) => String(x.code) === String(stateCode));
      const districtObj = districts.find((x) => String(x.code) === String(districtCode));

      const label =
        effectiveCountry === "TR"
          ? [stateObj?.name, districtObj?.name].filter(Boolean).join(" / ")
          : "";

      const body: Profile = {
        ...(profile || {}),
        role: "advertiser",

        fullName: companyName.trim(),
        phone: phone.trim(),
        country: effectiveCountry,

        city: stateObj?.name || "",
        district: districtObj?.name || "",

        location: {
          countryCode: effectiveCountry,
          cityCode: stateCode || "",
          districtCode: districtCode || "",
          label,
        },

        about: aboutCompany.trim(),

        dynamicValues: {
          ...(profile?.dynamicValues || {}),
          companyName: companyName.trim(),
          brandName: brandName.trim(),
          website: website.trim(),
          aboutCompany: aboutCompany.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          location: {
            countryCode: effectiveCountry,
            cityCode: stateCode || "",
            districtCode: districtCode || "",
            label,
          },
        },
      };

      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...headersAuth,
        },
        body: JSON.stringify(body),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.success) throw new Error(j?.message || "Profil kaydetme hatası.");

      const p2: Profile = j.profile || body;
      setProfile(p2);
      setOk("Reklamveren profili kaydedildi.");
    } catch (e: any) {
      setErr(e?.message || "Profil kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RoleGate allowRoles={["advertiser", "admin"]}>
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">Reklamveren Profili</h1>
            <div className="text-xs text-slate-400">
              Reklam lokasyon kırılımı için il/ilçe kodlarını standart tutuyoruz.
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/advertiser/dashboard"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {err ? (
          <div className="mb-4 rounded-lg border border-red-900/40 bg-red-950/40 p-3 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        {ok ? (
          <div className="mb-4 rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3 text-sm text-emerald-200">
            {ok}
          </div>
        ) : null}

        {loading ? (
          <div className="text-sm text-slate-300">Yükleniyor...</div>
        ) : (
          <form onSubmit={onSave} className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-7 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="text-sm font-semibold text-slate-100">Reklamveren Bilgileri</div>

              <div className="mt-3 grid gap-3">
                <div>
                  <label className="text-xs text-slate-400">Firma adı</label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                    placeholder="Örn: Marka / Firma"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-slate-400">Marka adı</label>
                    <input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                      placeholder="Opsiyonel"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Web sitesi</label>
                    <input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-slate-400">Telefon</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Ülke</label>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                      placeholder="TR"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-slate-400">İl (zorunlu)</label>
                    <select
                      value={stateCode}
                      onChange={(e) => setStateCode(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                      disabled={locLoading || normalizeCountryCode(country, "TR") !== "TR"}
                    >
                      <option value="">{locLoading ? "Yükleniyor..." : "Seçiniz"}</option>
                      {states.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">İlçe (opsiyonel)</label>
                    <select
                      value={districtCode}
                      onChange={(e) => setDistrictCode(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                      disabled={locLoading || !stateCode || normalizeCountryCode(country, "TR") !== "TR"}
                    >
                      <option value="">{!stateCode ? "Önce il seçiniz" : locLoading ? "Yükleniyor..." : "Seçiniz"}</option>
                      {districts.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Hakkımızda</label>
                  <textarea
                    value={aboutCompany}
                    onChange={(e) => setAboutCompany(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="text-sm font-semibold text-slate-100">Yetkili / İletişim</div>

              <div className="mt-3 grid gap-3">
                <div>
                  <label className="text-xs text-slate-400">Yetkili adı</label>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400">Yetkili e-posta</label>
                  <input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    disabled={saving}
                    className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </RoleGate>
  );
}
