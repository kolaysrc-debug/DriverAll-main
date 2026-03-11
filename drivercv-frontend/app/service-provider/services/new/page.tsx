"use client";

// PATH: drivercv-frontend/app/service-provider/services/new/page.tsx
// ----------------------------------------------------------
// Hizmet Ekleme — Adım adımlı form (kariyer.net tarzı)
// Step 1: Temel Bilgiler (kategori, başlık, açıklama)
// Step 2: Detaylar (yöntem, süre, fiyat, kontenjan)
// Step 3: Lokasyon & İletişim
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ServiceProviderOnly from "@/components/ServiceProviderOnly";
import { createServiceListing } from "@/lib/api/serviceListings";

type LocItem = { code: string; name: string };
type CategoryItem = { key: string; label: string; description?: string; icon?: string };

const DELIVERY_OPTIONS = [
  { value: "yuz_yuze",   label: "Yüzyüze" },
  { value: "online",     label: "Online" },
  { value: "uygulamali", label: "Uygulamalı" },
  { value: "karma",      label: "Karma" },
];

const DURATION_UNITS = [
  { value: "saat",  label: "Saat" },
  { value: "gun",   label: "Gün" },
  { value: "hafta", label: "Hafta" },
  { value: "ay",    label: "Ay" },
];

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

export default function ServiceProviderNewServicePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dynamicCategories, setDynamicCategories] = useState<CategoryItem[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  // Load dynamic categories
  useEffect(() => {
    setCatLoading(true);
    fetch("/api/public/service-categories?country=TR")
      .then((r) => r.json())
      .then((data) => setDynamicCategories(Array.isArray(data?.categories) ? data.categories : []))
      .catch(() => setDynamicCategories([]))
      .finally(() => setCatLoading(false));
  }, []);

  // Step 1
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Step 2
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>([]);
  const [durationValue, setDurationValue] = useState<string>("");
  const [durationUnit, setDurationUnit] = useState("gun");
  const [priceAmount, setPriceAmount] = useState<string>("");
  const [priceText, setPriceText] = useState("");
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState<string>("");
  const [tags, setTags] = useState("");

  // Step 3
  const [stateCode, setStateCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [states, setStates] = useState<LocItem[]>([]);
  const [districts, setDistricts] = useState<LocItem[]>([]);
  const [locLoading, setLocLoading] = useState(false);

  // Load states
  useEffect(() => {
    setLocLoading(true);
    fetchLocations({ country: "TR", level: "state" })
      .then((s) => setStates(s))
      .finally(() => setLocLoading(false));
  }, []);

  // Load districts
  useEffect(() => {
    if (!stateCode) { setDistricts([]); return; }
    setLocLoading(true);
    fetchLocations({ country: "TR", level: "district", parentCode: stateCode })
      .then((d) => setDistricts(d))
      .finally(() => setLocLoading(false));
  }, [stateCode]);

  function toggleDelivery(val: string) {
    setDeliveryMethods((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
    );
  }

  function canNext(): boolean {
    if (step === 1) return !!category && !!title.trim();
    if (step === 2) return deliveryMethods.length > 0;
    return true;
  }

  async function onPublish(status: "active" | "draft") {
    setSaving(true);
    setErr(null);

    const stateName = states.find((s) => s.code === stateCode)?.name || "";
    const districtName = districts.find((d) => d.code === districtCode)?.name || "";
    const locationLabel = [stateName, districtName].filter(Boolean).join(" / ");

    const body: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      category,
      deliveryMethods,
      price: {
        amount: priceAmount ? Number(priceAmount) : null,
        currency: "TRY",
        displayText: priceText,
        isNegotiable: priceNegotiable,
      },
      duration: {
        value: durationValue ? Number(durationValue) : null,
        unit: durationUnit,
        displayText: durationValue ? `${durationValue} ${DURATION_UNITS.find((u) => u.value === durationUnit)?.label || durationUnit}` : "",
      },
      location: {
        countryCode: "TR",
        stateCode,
        stateName,
        districtCode,
        districtName,
        address,
        label: locationLabel,
      },
      contact: { phone, email, website, whatsapp },
      status,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      maxCapacity: maxCapacity ? Number(maxCapacity) : null,
    };

    try {
      await createServiceListing(body);
      router.push("/service-provider/services");
    } catch (e: any) {
      setErr(e?.message || "Kayıt başarısız.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-teal-600/50 focus:ring-1 focus:ring-teal-600/30 transition-colors";
  const labelCls = "text-xs text-slate-400 font-medium";

  const STEPS = [
    { n: 1, label: "Temel Bilgiler" },
    { n: 2, label: "Detaylar" },
    { n: 3, label: "Lokasyon & İletişim" },
  ];

  return (
    <ServiceProviderOnly>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-4xl px-4 py-5 md:px-8 space-y-4">

          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-50">Hizmet Ekle</h1>
                <p className="text-xs text-slate-400 mt-0.5">Adaylara yönelik kurs / eğitim hizmeti oluşturun</p>
              </div>
              <Link href="/service-provider/services" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors">← Hizmetler</Link>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.n}>
                <button
                  onClick={() => s.n < step && setStep(s.n)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    step === s.n
                      ? "bg-teal-600/20 text-teal-300 border border-teal-500/30"
                      : step > s.n
                      ? "bg-emerald-600/15 text-emerald-300 border border-emerald-500/20 cursor-pointer"
                      : "bg-slate-800/50 text-slate-500 border border-slate-700"
                  }`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    step === s.n ? "bg-teal-600 text-white" : step > s.n ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-400"
                  }`}>{step > s.n ? "✓" : s.n}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <div className="h-px flex-1 bg-slate-800" />}
              </React.Fragment>
            ))}
          </div>

          {/* Error */}
          {err && (
            <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
              <span className="text-rose-400">✕</span> {err}
            </div>
          )}

          {/* Step 1: Temel Bilgiler */}
          {step === 1 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
              <div className="text-sm font-semibold text-slate-100">Hizmet Kategorisi *</div>
              {catLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-600 border-t-teal-400" />
                  Kategoriler yükleniyor…
                </div>
              ) : dynamicCategories.length === 0 ? (
                <div className="text-xs text-slate-500 py-3">Henüz kategori tanımlanmamış. Admin panelinden ekleyin.</div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {dynamicCategories.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setCategory(c.key)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        category === c.key
                          ? "border-teal-500/50 bg-teal-950/30 ring-1 ring-teal-500/20"
                          : "border-slate-700 bg-slate-950 hover:bg-slate-900 hover:border-slate-600"
                      }`}
                    >
                      <div className={`text-xs font-semibold ${category === c.key ? "text-teal-300" : "text-slate-200"}`}>{c.icon ? `${c.icon} ` : ""}{c.label}</div>
                      {c.description && <div className="text-[10px] text-slate-500 mt-0.5">{c.description}</div>}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className={labelCls}>Hizmet Başlığı *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Örn: SRC1 Belgesi Eğitimi - Hızlandırılmış Program" />
              </div>

              <div>
                <label className={labelCls}>Açıklama</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} rows={4} placeholder="Hizmetiniz hakkında detaylı bilgi verin…" />
              </div>
            </div>
          )}

          {/* Step 2: Detaylar */}
          {step === 2 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
              <div className="text-sm font-semibold text-slate-100">Hizmet Verme Yöntemi *</div>
              <div className="flex flex-wrap gap-2">
                {DELIVERY_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDelivery(d.value)}
                    className={`rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
                      deliveryMethods.includes(d.value)
                        ? "border-teal-500/50 bg-teal-950/30 text-teal-300"
                        : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={labelCls}>Süre</label>
                  <div className="flex gap-2 mt-1">
                    <input value={durationValue} onChange={(e) => setDurationValue(e.target.value)} className={`${inputCls} mt-0 flex-1`} placeholder="Örn: 40" type="number" />
                    <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)} className={`${inputCls} mt-0 w-24`}>
                      {DURATION_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Fiyat (TL)</label>
                  <input value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)} className={inputCls} placeholder="Örn: 2500" type="number" />
                </div>
                <div>
                  <label className={labelCls}>Kontenjan</label>
                  <input value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} className={inputCls} placeholder="Örn: 20" type="number" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Fiyat Açıklaması</label>
                  <input value={priceText} onChange={(e) => setPriceText(e.target.value)} className={inputCls} placeholder="Örn: 2.500 TL'den başlayan fiyatlarla" />
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <input
                    type="checkbox"
                    checked={priceNegotiable}
                    onChange={(e) => setPriceNegotiable(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-teal-500"
                  />
                  <label className="text-xs text-slate-300">Fiyat pazarlığa açık</label>
                </div>
              </div>

              <div>
                <label className={labelCls}>Etiketler (virgülle ayırın)</label>
                <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="Örn: acil, kampanya, garantili" />
              </div>
            </div>
          )}

          {/* Step 3: Lokasyon & İletişim */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                <div className="text-sm font-semibold text-slate-100">Lokasyon</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>İl</label>
                    <select value={stateCode} onChange={(e) => { setStateCode(e.target.value); setDistrictCode(""); }} className={inputCls} disabled={locLoading}>
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
                  <label className={labelCls}>Açık Adres</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} rows={2} placeholder="Hizmet verilen adres" />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                <div className="text-sm font-semibold text-slate-100">İletişim</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>Telefon</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="05xx xxx xx xx" />
                  </div>
                  <div>
                    <label className={labelCls}>E-posta</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="iletisim@firma.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Web sitesi</label>
                    <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="https://..." />
                  </div>
                  <div>
                    <label className={labelCls}>WhatsApp</label>
                    <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputCls} placeholder="05xx xxx xx xx" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Bar (kariyer.net tarzı) */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div>
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 transition-colors">
                  ← Geri
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {step === 3 && (
                <button
                  onClick={() => onPublish("draft")}
                  disabled={saving}
                  className="rounded-lg border border-amber-700/40 bg-amber-950/20 px-4 py-2.5 text-xs font-medium text-amber-300 hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                >
                  Taslak Kaydet
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canNext()}
                  className="rounded-lg bg-teal-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-teal-500 transition-colors disabled:opacity-50"
                >
                  Devam Et →
                </button>
              ) : (
                <button
                  onClick={() => onPublish("active")}
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor…" : "Yayınla"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobil Alt Navigasyon */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <Link href="/service-provider/dashboard" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Panel</Link>
              <Link href="/service-provider/services" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Hizmetler</Link>
              <Link href="/service-provider/services/new" className="rounded-xl border border-teal-600/40 bg-teal-950/30 px-2 py-2 text-center text-[11px] font-medium text-teal-300">Ekle</Link>
              <Link href="/service-provider/profile" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Profil</Link>
            </div>
          </div>
        </nav>
      </div>
    </ServiceProviderOnly>
  );
}
