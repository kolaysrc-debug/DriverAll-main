"use client";

// PATH: drivercv-frontend/app/service-provider/profile/page.tsx
// ----------------------------------------------------------
// Service Provider Profile — modern form tasarımı
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RoleGate from "@/components/RoleGate";
import { getToken } from "@/lib/session";
import { authHeaders as coreAuthHeaders } from "@/lib/api/_core";

type Profile = any;
type LocItem = { code: string; name: string };

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
  const res = await fetch(`/api/locations/list?${qs.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.list) ? data.list : [];
}

export default function ServiceProviderProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("TR");
  const [stateCode, setStateCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [states, setStates] = useState<LocItem[]>([]);
  const [districts, setDistricts] = useState<LocItem[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const [aboutCompany, setAboutCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Hizmet verene özel alanlar
  const [serviceTypes, setServiceTypes] = useState("");       // "SRC Eğitimi, Ehliyet Kursu"
  const [experienceYears, setExperienceYears] = useState("");

  // Alt roller
  const [availableSubRoles, setAvailableSubRoles] = useState<{ key: string; label: string; description?: string }[]>([]);
  const [selectedSubRoles, setSelectedSubRoles] = useState<string[]>([]);

  const headersAuth = useMemo(() => coreAuthHeaders(), []);

  async function load() {
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const token = getToken();
      if (!token) throw new Error("Oturum bulunamadı.");
      const res = await fetch("/api/profile/me", { headers: headersAuth });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const p: Profile = data.profile || data;
      setProfile(p);
      setCompanyName(p?.companyName || "");
      setBrandName(p?.brandName || "");
      setWebsite(p?.website || "");
      setPhone(p?.phone || "");
      setCountry(p?.country || "TR");
      setStateCode(p?.stateCode || "");
      setDistrictCode(p?.districtCode || "");
      setAboutCompany(p?.aboutCompany || "");
      setContactName(p?.contactName || "");
      setContactEmail(p?.contactEmail || "");
      setServiceTypes(p?.serviceTypes || "");
      setExperienceYears(p?.experienceYears || "");

      // Alt rolleri yükle
      setSelectedSubRoles(Array.isArray(p.subRoles) ? p.subRoles : []);
      try {
        const srRes = await fetch("/api/public/roles/subroles?category=service_provider");
        const srData = await srRes.json();
        if (srRes.ok && Array.isArray(srData.subRoles)) {
          setAvailableSubRoles(srData.subRoles);
        }
      } catch { /* alt roller opsiyonel */ }
    } catch (e: any) {
      setErr(e?.message || "Profil yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Locations
  useEffect(() => {
    const cc = normalizeCountryCode(country, "TR");
    if (cc !== "TR") { setStates([]); setDistricts([]); return; }
    setLocLoading(true);
    fetchLocations({ country: "TR", level: "state" })
      .then((s) => setStates(s))
      .finally(() => setLocLoading(false));
  }, [country]);

  useEffect(() => {
    if (!stateCode || normalizeCountryCode(country, "TR") !== "TR") { setDistricts([]); return; }
    setLocLoading(true);
    fetchLocations({ country: "TR", level: "district", parentCode: stateCode })
      .then((d) => setDistricts(d))
      .finally(() => setLocLoading(false));
  }, [stateCode, country]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      const body = {
        companyName, brandName, website, phone, country,
        stateCode, districtCode, aboutCompany,
        contactName, contactEmail,
        serviceTypes, experienceYears,
        subRoles: selectedSubRoles,
      };
      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { ...headersAuth as Record<string, string>, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setProfile(data.profile || data);
      setOk("Profil kaydedildi.");
    } catch (e: any) {
      setErr(e?.message || "Profil kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  // Auto-close success
  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => setOk(null), 3000);
    return () => clearTimeout(t);
  }, [ok]);

  const inputCls = "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-teal-600/50 focus:ring-1 focus:ring-teal-600/30 transition-colors";
  const labelCls = "text-xs text-slate-400 font-medium";

  return (
    <RoleGate allowRoles={["service_provider", "admin"]}>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-50">Hizmet Veren Profili</h1>
                <p className="text-xs text-slate-400 mt-0.5">Firma ve iletişim bilgilerinizi güncelleyin</p>
              </div>
              <Link href="/service-provider/dashboard" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors">← Panel</Link>
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
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-teal-400" />
              Yükleniyor…
            </div>
          ) : (
            <form onSubmit={onSave} className="grid gap-4 md:grid-cols-12">
              {/* Sol: Firma Bilgileri */}
              <div className="md:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                <div className="text-sm font-semibold text-slate-100">Firma Bilgileri</div>

                <div>
                  <label className={labelCls}>Firma adı *</label>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} placeholder="Örn: ABC Sürücü Kursu" />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>Marka adı</label>
                    <input value={brandName} onChange={(e) => setBrandName(e.target.value)} className={inputCls} placeholder="Opsiyonel" />
                  </div>
                  <div>
                    <label className={labelCls}>Web sitesi</label>
                    <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="https://..." />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>Telefon</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Ülke</label>
                    <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls} placeholder="TR" />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>İl *</label>
                    <select value={stateCode} onChange={(e) => setStateCode(e.target.value)} className={inputCls} disabled={locLoading || normalizeCountryCode(country, "TR") !== "TR"}>
                      <option value="">{locLoading ? "Yükleniyor..." : "Seçiniz"}</option>
                      {states.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>İlçe</label>
                    <select value={districtCode} onChange={(e) => setDistrictCode(e.target.value)} className={inputCls} disabled={locLoading || !stateCode}>
                      <option value="">{!stateCode ? "Önce il seçiniz" : locLoading ? "Yükleniyor..." : "Seçiniz"}</option>
                      {districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Hakkımızda</label>
                  <textarea value={aboutCompany} onChange={(e) => setAboutCompany(e.target.value)} className={inputCls} rows={4} placeholder="Firmanız hakkında kısa tanıtım…" />
                </div>
              </div>

              {/* Sağ: Alt Roller + Hizmet Detay + Yetkili */}
              <div className="md:col-span-5 space-y-4">
                {/* Alt Roller */}
                {availableSubRoles.length > 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
                    <div className="text-sm font-semibold text-slate-100">Hizmet Türü / Alt Rol</div>
                    <p className="text-[11px] text-slate-400">Verdiğiniz hizmet alanını seçin (birden fazla seçilebilir)</p>
                    <div className="space-y-2">
                      {availableSubRoles.map((sr) => (
                        <label key={sr.key} className="flex items-start gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedSubRoles.includes(sr.key)}
                            onChange={() => {
                              setSelectedSubRoles((prev) =>
                                prev.includes(sr.key)
                                  ? prev.filter((k) => k !== sr.key)
                                  : [...prev, sr.key]
                              );
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-950 text-teal-500 focus:ring-teal-600/30"
                          />
                          <div>
                            <div className="text-sm text-slate-200 group-hover:text-teal-300 transition-colors">{sr.label}</div>
                            {sr.description && <div className="text-[11px] text-slate-500">{sr.description}</div>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                  <div className="text-sm font-semibold text-slate-100">Hizmet Bilgileri</div>

                  <div>
                    <label className={labelCls}>Verilen hizmet türleri</label>
                    <input value={serviceTypes} onChange={(e) => setServiceTypes(e.target.value)} className={inputCls} placeholder="Örn: SRC Eğitimi, Ehliyet Kursu, Psikoteknik" />
                    <div className="text-[10px] text-slate-500 mt-1">Virgülle ayırarak yazın</div>
                  </div>

                  <div>
                    <label className={labelCls}>Sektör deneyimi (yıl)</label>
                    <input value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className={inputCls} placeholder="Örn: 10" type="number" />
                  </div>
                </div>

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
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Mobil Alt Navigasyon */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <Link href="/service-provider/dashboard" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Panel</Link>
              <Link href="/service-provider/services" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Hizmetler</Link>
              <Link href="/service-provider/services/new" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Ekle</Link>
              <Link href="/service-provider/profile" className="rounded-xl border border-teal-600/40 bg-teal-950/30 px-2 py-2 text-center text-[11px] font-medium text-teal-300">Profil</Link>
            </div>
          </div>
        </nav>
      </div>
    </RoleGate>
  );
}
