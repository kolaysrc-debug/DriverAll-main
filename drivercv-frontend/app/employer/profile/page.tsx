"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/profile/page.tsx
// ----------------------------------------------------------
// Employer Profile (Firma Profili)
// - GET  /api/profile/me
// - PUT  /api/profile/me
// - Firma adı: profile.fullName
// - Lokasyon: /api/locations/list (TR -> il/ilçe dropdown)
//   employer için: il zorunlu, ilçe opsiyonel
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RoleGate from "@/components/RoleGate";
import { getToken } from "@/lib/session";
import { authHeaders as coreAuthHeaders } from "@/lib/api/_core";

type Profile = any;

type LocItem = {
  code: string;
  name: string;
  parentCode?: string | null;
  level?: string;
};

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

export default function EmployerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  // Firma alanları
  const [companyName, setCompanyName] = useState(""); // ilanlarda görünen ad
  const [brandName, setBrandName] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [sector, setSector] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("TR");

  // Lokasyon (standard)
  const [stateCode, setStateCode] = useState(""); // il kodu (TR-xx)
  const [districtCode, setDistrictCode] = useState(""); // ilçe kodu (opsiyonel)
  const [states, setStates] = useState<LocItem[]>([]);
  const [districts, setDistricts] = useState<LocItem[]>([]);
  const [locLoading, setLocLoading] = useState(false);

  const [address, setAddress] = useState("");
  const [aboutCompany, setAboutCompany] = useState("");

  // Yetkili/iletişim
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const headersAuth = useMemo(() => coreAuthHeaders(), []);

  async function load() {
    setLoading(true);
    setErr(null);
    setOk(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error(
          "Oturum bulunamadı (token yok). Aynı portta tekrar giriş yapın (hangi portta açıksa o portta /login)."
        );
      }

      const res = await fetch("/api/profile/me", { headers: headersAuth });
      if (!res.ok) throw new Error("Profil bilgileri alınamadı.");
      const json = await res.json();
      const p: Profile = json.profile || {};

      const dyn = p.dynamicValues || {};
      const cn = String(p.fullName || dyn.companyName || "").trim();

      setProfile(p);

      setCompanyName(cn);
      setBrandName(String(dyn.brandName || "").trim());
      setTaxNumber(String(dyn.taxNumber || "").trim());
      setSector(String(dyn.sector || "").trim());
      setWebsite(String(dyn.website || "").trim());
      setPhone(String(p.phone || dyn.phone || "").trim());
      setCountry(normalizeCountryCode(String(p.country || dyn.country || "TR"), "TR"));

      // Lokasyon (öncelik: p.location)
      const loc = p.location || dyn.location || {};
      setStateCode(String(loc.cityCode || "").trim());
      setDistrictCode(String(loc.districtCode || "").trim());

      setAddress(String(dyn.address || "").trim());
      setAboutCompany(String(p.about || dyn.aboutCompany || "").trim());

      setContactName(String(dyn.contactName || "").trim());
      setContactEmail(String(dyn.contactEmail || p.email || "").trim());
    } catch (e: any) {
      setErr(e?.message || "Profil yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  // states yükle
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
        // isim sıralaması
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

  // district yükle
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

        // il değişince, seçili ilçe o ilin içinde yoksa sıfırla
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

      // employer için TR’de il zorunlu
      if (effectiveCountry === "TR" && !stateCode) {
        throw new Error("İl seçimi zorunludur.");
      }

      const stateObj = states.find((x) => String(x.code) === String(stateCode));
      const districtObj = districts.find((x) => String(x.code) === String(districtCode));

      const label =
        effectiveCountry === "TR"
          ? [stateObj?.name, districtObj?.name].filter(Boolean).join(" / ")
          : "";

      const body: Profile = {
        ...(profile || {}),
        role: "employer",

        fullName: companyName.trim(),
        phone: phone.trim(),
        country: effectiveCountry,

        // Legacy alanlar (ekranlarda hızlı görünsün)
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
          taxNumber: taxNumber.trim(),
          sector: sector.trim(),
          website: website.trim(),
          address: address.trim(),
          aboutCompany: aboutCompany.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),

          // aynı veriyi dinamikte de kopyalayalım (geri uyumluluk)
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
      if (!res.ok || !j?.success) {
        throw new Error(j?.message || "Profil kaydetme hatası.");
      }

      const p2: Profile = j.profile || body;
      setProfile(p2);
      setOk("Firma profili kaydedildi.");
    } catch (e: any) {
      setErr(e?.message || "Profil kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  // Auto-close success message
  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => setOk(null), 3000);
    return () => clearTimeout(t);
  }, [ok]);

  const inputCls = "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-600/50 focus:ring-1 focus:ring-emerald-600/30 transition-colors";
  const labelCls = "text-xs text-slate-400 font-medium";

  return (
    <RoleGate allowRoles={["employer", "admin"]}>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-50">Firma Profili</h1>
                <p className="text-xs text-slate-400 mt-0.5">İlanlarda görünen firma bilgilerinizi güncelleyin</p>
              </div>
              <Link href="/employer/dashboard" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors">← Panel</Link>
            </div>
          </div>

          {/* Alerts */}
          {err && (
            <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
              <span className="text-rose-400">✕</span> {err}
            </div>
          )}
          {ok && (
            <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2">
              <span className="text-emerald-400">✓</span> {ok}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
              Yükleniyor…
            </div>
          ) : (
            <form onSubmit={onSave} className="grid gap-4 md:grid-cols-12">
              {/* Sol: Firma Bilgileri */}
              <div className="md:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                <div className="text-sm font-semibold text-slate-100">Firma Bilgileri</div>

                <div>
                  <label className={labelCls}>Firma adı (ilanlarda görünen) *</label>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} placeholder="Örn: ADRTÜRK Danışmanlık" />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>Marka / Ticari ad</label>
                    <input value={brandName} onChange={(e) => setBrandName(e.target.value)} className={inputCls} placeholder="Opsiyonel" />
                  </div>
                  <div>
                    <label className={labelCls}>Vergi no</label>
                    <input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} className={inputCls} placeholder="Opsiyonel" />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>Sektör</label>
                    <input value={sector} onChange={(e) => setSector(e.target.value)} className={inputCls} placeholder="Opsiyonel" />
                  </div>
                  <div>
                    <label className={labelCls}>Web sitesi</label>
                    <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="https://..." />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>Telefon</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="0xxx..." />
                  </div>
                  <div>
                    <label className={labelCls}>Ülke</label>
                    <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls} placeholder="TR" />
                  </div>
                </div>

                {/* İl / İlçe */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>İl (zorunlu) *</label>
                    <select value={stateCode} onChange={(e) => setStateCode(e.target.value)} className={inputCls} disabled={locLoading || normalizeCountryCode(country, "TR") !== "TR"}>
                      <option value="">{locLoading ? "Yükleniyor..." : "Seçiniz"}</option>
                      {states.map((s) => (<option key={s.code} value={s.code}>{s.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>İlçe (opsiyonel)</label>
                    <select value={districtCode} onChange={(e) => setDistrictCode(e.target.value)} className={inputCls} disabled={locLoading || !stateCode || normalizeCountryCode(country, "TR") !== "TR"}>
                      <option value="">{!stateCode ? "Önce il seçiniz" : locLoading ? "Yükleniyor..." : "Seçiniz"}</option>
                      {districts.map((d) => (<option key={d.code} value={d.code}>{d.name}</option>))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Adres (opsiyonel)</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} rows={2} placeholder="İleride detaylandıracağız" />
                </div>

                <div>
                  <label className={labelCls}>Firma açıklaması</label>
                  <textarea value={aboutCompany} onChange={(e) => setAboutCompany(e.target.value)} className={inputCls} rows={4} placeholder="Kısa tanıtım..." />
                </div>
              </div>

              {/* Sağ: Yetkili + Kaydet */}
              <div className="md:col-span-5 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                  <div className="text-sm font-semibold text-slate-100">Yetkili / İletişim</div>

                  <div>
                    <label className={labelCls}>Yetkili adı</label>
                    <input value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>Yetkili e-posta</label>
                    <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputCls} />
                  </div>

                  <button
                    disabled={saving}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>

                  <div className="text-[11px] text-slate-500">
                    Not: Bu sayfada sokak/kapı no zorunlu değil. İK sistemi standardımız il/ilçe kodlarıdır.
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Mobil Alt Navigasyon */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <Link href="/employer/dashboard" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Panel</Link>
              <Link href="/employer/jobs" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">İlanlar</Link>
              <Link href="/employer/applications" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Başvurular</Link>
              <Link href="/employer/profile" className="rounded-xl border border-emerald-600/40 bg-emerald-950/30 px-2 py-2 text-center text-[11px] font-medium text-emerald-300">Profil</Link>
            </div>
          </div>
        </nav>
      </div>
    </RoleGate>
  );
}
