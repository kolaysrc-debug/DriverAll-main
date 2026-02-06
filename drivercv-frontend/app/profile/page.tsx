"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  GroupNode,
  Reason,
  resolveGroupSelection,
  isAutoAdded,
} from "@/lib/groupCriteriaEngine";

type Profile = {
  role?: string;
  fullName?: string;
  phone?: string;
  country?: string;
  city?: string;
  cityCode?: string;
  district?: string;
  districtCode?: string;
  about?: string;
  experienceYears?: number | null;
  dynamicValues?: Record<string, any>;
  location?: {
    countryCode?: string;
    cityCode?: string;
    districtCode?: string;
    label?: string;
  };
};

type CvDoc = {
  _id?: string;
  userId: string;
  values: Record<string, any>;
};

type FieldDefinition = {
  _id: string;
  key: string;
  label: string;
  description?: string;
  groupKey?: string | null;
  groupLabelOverride?: string | null;
  category?: string | null;
  showInCv?: boolean;
  showInJob?: boolean;
  showInProfile?: boolean;
  country?: string | null;
  valueType?: "boolean" | "enum" | "multiEnum" | "string" | "number" | "date";
  enumValues?: string[];
  coversKeys?: string[];
  requiresKeys?: string[];
  active?: boolean;
};

type CvFieldGroup = {
  groupKey: string;
  groupLabel: string;
  fields: FieldDefinition[];
};

type LocationItem = {
  code: string;
  name: string;
  level: string;
  countryCode?: string;
  parentCode?: string | null;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

function normalizeCountryCode(input: any, fallback: string): string {
  const raw = typeof input === "string" ? input : input == null ? "" : String(input);
  const s = raw.trim().toUpperCase();
  if (!s) return fallback;
  const alias: Record<string, string> = { TURKEY: "TR", TURKIYE: "TR", "TÜRKİYE": "TR" };
  return alias[s] || (s.length === 2 ? s : fallback);
}

const CV_MANUAL_META_KEY = "__cvManualKeys";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileInfo, setProfileInfo] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("TR");
  const [city, setCity] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [district, setDistrict] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [about, setAbout] = useState("");
  const [experienceYears, setExperienceYears] = useState<string>("");

  const [cityOptions, setCityOptions] = useState<LocationItem[]>([]);
  const [districtOptions, setDistrictOptions] = useState<LocationItem[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [cvDoc, setCvDoc] = useState<CvDoc | null>(null);
  const [cvValues, setCvValues] = useState<Record<string, any>>({});
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [savingCv, setSavingCv] = useState(false);
  const [cvInfo, setCvInfo] = useState<string | null>(null);
  const [cvLocked, setCvLocked] = useState<boolean>(true);
  const [cvDirty, setCvDirty] = useState(false);
  
  const savingCvRef = useRef(false);
  const autoSaveTimerRef = useRef<any>(null);

  const [cvManualKeys, setCvManualKeys] = useState<string[]>([]);
  const [cvReasons, setCvReasons] = useState<Record<string, Reason>>({});
  const initDepsRef = useRef(false);
  const [depsInitialized, setDepsInitialized] = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        const token = getToken();
        if (!token) throw new Error("Oturum bulunamadı.");
        const headers = { Authorization: `Bearer ${token}` };

        const [pRes, cvRes, fRes] = await Promise.all([
          fetch("/api/profile/me", { headers }),
          fetch("/api/cv", { headers }),
          fetch("/api/admin/fields", { headers }),
        ]);

        const pJson = await pRes.json();
        const cvJson = await cvRes.json();
        const fJson = await fRes.json();

        if (pJson.profile) {
          const p = pJson.profile;
          setProfile(p);
          setFullName(p.fullName || "");
          setPhone(p.phone || "");
          setCountry(normalizeCountryCode(p.country || p.location?.countryCode, "TR"));
          
          // GÖKHAN BURASI KRİTİK: Açılışta yeni location objesine bakıyoruz
          const savedCityCode = p.location?.cityCode || p.cityCode || "";
          const savedDistrictCode = p.location?.districtCode || p.districtCode || "";
          
          setCityCode(savedCityCode);
          setDistrictCode(savedDistrictCode);
          
          // Etiketi parçalayarak veya ana alanlardan isimleri alıyoruz
          setCity(p.city || p.location?.label?.split(" / ")[0] || "");
          setDistrict(p.district || p.location?.label?.split(" / ")[1] || "");

          setAbout(p.about || "");
          setExperienceYears(p.experienceYears != null ? String(p.experienceYears) : "");
        }

        const cvData = cvJson.cv || { values: {} };
        setCvDoc(cvData);
        setCvValues(cvData.values || {});
        setFields(fJson.fields || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  useEffect(() => {
    if (normalizeCountryCode(country, "TR") !== "TR") return;
    async function loadCities() {
      setLoadingCities(true);
      try {
        const res = await fetch("/api/locations/list?country=TR&level=city");
        const data = await res.json();
        setCityOptions(data.list || []);
      } finally {
        setLoadingCities(false);
      }
    }
    loadCities();
  }, [country]);

  useEffect(() => {
    if (!cityCode) { setDistrictOptions([]); return; }
    async function loadDistricts() {
      setLoadingDistricts(true);
      try {
        const res = await fetch(`/api/locations/list?country=TR&level=district&parentCode=${cityCode}`);
        const data = await res.json();
        setDistrictOptions(data.list || []);
      } finally {
        setLoadingDistricts(false);
      }
    }
    loadDistricts();
  }, [cityCode]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setProfileInfo(null);

    try {
      const token = getToken();
      const locLabel = city ? (district ? `${city} / ${district}` : city) : "";
      const locationObj = {
        countryCode: normalizeCountryCode(country, "TR"),
        cityCode: cityCode || null,
        districtCode: districtCode || null,
        label: locLabel,
      };

      const body = {
        role: profile?.role || "driver",
        fullName: fullName.trim(),
        phone: phone.trim(),
        about: about.trim(),
        experienceYears: experienceYears.trim() === "" ? null : Number(experienceYears.trim()),
        location: locationObj,
        country: locationObj.countryCode,
        city: city || null,
        cityCode: cityCode || null,
        district: district || null,
        districtCode: districtCode || null,
        dynamicValues: {
          ...(profile?.dynamicValues || {}),
          location: locationObj
        }
      };

      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Kaydedilemedi.");

      setProfile(data.profile || body);
      setProfileInfo("Profil başarıyla güncellendi! ✅");
      setTimeout(() => setProfileInfo(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  const cvFieldGroups: CvFieldGroup[] = useMemo(() => {
    const map = new Map<string, CvFieldGroup>();
    fields.filter(f => f.active !== false && (f.showInCv ?? true)).forEach(f => {
      const gk = f.groupKey || "GENEL";
      const gl = f.groupLabelOverride || (gk === "GENEL" ? "Genel" : gk);
      if (!map.has(gk)) map.set(gk, { groupKey: gk, groupLabel: gl, fields: [] });
      map.get(gk)!.fields.push(f);
    });
    return Array.from(map.values()).sort((a,b) => a.groupLabel.localeCompare(b.groupLabel, "tr"));
  }, [fields]);

  const cvDepNodes: GroupNode[] = useMemo(() => 
    fields.filter(f => (f.valueType || "boolean") === "boolean").map(f => ({
      key: f.key, label: f.label, coverage: f.coversKeys || [],
      requiredWith: f.requiresKeys || [], active: f.active !== false
    })), [fields]);

  useEffect(() => {
    if (initDepsRef.current || loading || !cvDepNodes.length) return;
    const stored = (cvValues as any)?.[CV_MANUAL_META_KEY];
    const initial = Array.isArray(stored) ? stored : cvDepNodes.filter(n => !!cvValues[n.key]).map(n => n.key);
    setCvManualKeys(initial);
    initDepsRef.current = true;
    setDepsInitialized(true);
  }, [loading, cvDepNodes, cvValues]);

  const cvResolved = useMemo(() => resolveGroupSelection(cvManualKeys, cvDepNodes), [cvManualKeys, cvDepNodes]);

  useEffect(() => {
    if (!depsInitialized) return;
    const eff = new Set(cvResolved.effectiveKeys);
    setCvReasons(cvResolved.reasons);
    setCvValues(prev => {
      const next = { ...prev };
      cvDepNodes.forEach(n => { next[n.key] = eff.has(n.key); });
      return next;
    });
  }, [cvResolved, cvDepNodes, depsInitialized]);

  async function saveCv(options?: { silent?: boolean, lockAfter?: boolean }) {
    if (savingCvRef.current) return;
    savingCvRef.current = true;
    setSavingCv(true);
    try {
      const token = getToken();
      const valuesToSave = { ...cvValues, [CV_MANUAL_META_KEY]: cvManualKeys };
      const res = await fetch("/api/cv", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ values: valuesToSave }),
      });
      if (!res.ok) throw new Error("CV Kaydedilemedi.");
      setCvDirty(false);
      if (!options?.silent) setCvInfo("CV Güncellendi.");
      if (options?.lockAfter) setCvLocked(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingCv(false);
      savingCvRef.current = false;
    }
  }

  useEffect(() => {
    if (cvLocked || !cvDirty) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => saveCv({ silent: true }), 1500);
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [cvDirty, cvLocked]);

  function renderCvFieldInput(field: FieldDefinition) {
    const val = cvValues[field.key];
    const vt = field.valueType || "boolean";
    if (vt === "boolean") {
      const auto = isAutoAdded(cvReasons, field.key);
      return (
        <label className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${val ? 'border-sky-500 bg-sky-500/10' : 'border-slate-800'}`}>
          <input type="checkbox" disabled={cvLocked || auto} checked={!!val} onChange={e => {
            setCvDirty(true);
            const next = e.target.checked;
            setCvManualKeys(prev => {
              const s = new Set(prev);
              next ? s.add(field.key) : s.delete(field.key);
              return Array.from(s);
            });
          }} />
          <span>{field.label} {auto && <em className="text-[9px] text-sky-400">(Oto)</em>}</span>
        </label>
      );
    }
    return (
      <div className="space-y-1">
        <label className="text-[10px] text-slate-400">{field.label}</label>
        <input 
          className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs outline-none focus:border-sky-500"
          value={val || ""} 
          disabled={cvLocked}
          onChange={e => { setCvDirty(true); setCvValues(p => ({...p, [field.key]: e.target.value})); }}
        />
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Yükleniyor...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Profil & CV Yönetimi</h1>
          <button onClick={() => setCvLocked(!cvLocked)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs transition">
            {cvLocked ? "CV Düzenle" : "Düzenlemeyi Bitir"}
          </button>
        </div>

        {error && <div className="p-3 bg-rose-500/10 border border-rose-500/50 text-rose-400 rounded-lg text-xs">{error}</div>}
        {profileInfo && <div className="p-3 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 rounded-lg text-xs">{profileInfo}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-4 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-sm font-semibold mb-4 border-b border-slate-800 pb-2">Kişisel Bilgiler</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Ad Soyad</label>
                <input placeholder="Ad Soyad" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-sky-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Telefon</label>
                <input placeholder="Telefon" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-sky-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">İl</label>
                  <select value={cityCode} onChange={e => {
                    const s = cityOptions.find(c => c.code === e.target.value);
                    setCityCode(e.target.value); setCity(s?.name || ""); setDistrictCode(""); setDistrict("");
                  }} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs outline-none">
                    <option value="">İl Seçin</option>
                    {cityOptions.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">İlçe</label>
                  <select value={districtCode} onChange={e => {
                    const s = districtOptions.find(d => d.code === e.target.value);
                    setDistrictCode(e.target.value); setDistrict(s?.name || "");
                  }} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs outline-none">
                    <option value="">İlçe Seçin</option>
                    {districtOptions.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Hakkımda</label>
                <textarea placeholder="Hakkımda" value={about} onChange={e => setAbout(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none min-h-[100px]" />
              </div>
              
              <button type="submit" disabled={savingProfile} className="w-full bg-sky-600 hover:bg-sky-500 py-3 rounded-xl font-bold text-slate-950 transition disabled:opacity-50">
                {savingProfile ? "Güncelleniyor..." : "Profili Kaydet"}
              </button>
            </form>
          </section>

          <section className="lg:col-span-8 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-sm font-semibold mb-4 border-b border-slate-800 pb-2">CV Kriterleri ve Yetkinlikler</h2>
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {cvFieldGroups.map(group => (
                <div key={group.groupKey} className="space-y-3">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">{group.groupLabel}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.fields.map(field => (
                      <div key={field._id}>{renderCvFieldInput(field)}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {!cvLocked && (
              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                <span>* Değişiklikler otomatik kaydedilir.</span>
                <button onClick={() => saveCv()} disabled={savingCv} className="bg-sky-500/20 text-sky-400 px-4 py-1.5 rounded-lg hover:bg-sky-500/30 transition">
                  {savingCv ? "Kaydediliyor..." : "Manuel Kaydet"}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}