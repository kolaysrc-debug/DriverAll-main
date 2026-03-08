"use client";

// PATH: DriverAll-main/drivercv-frontend/app/advertiser/requests/new/page.tsx
// ----------------------------------------------------------
// Advertiser - Yeni Reklam Talebi
// - Paketleri PUBLIC endpoint'ten çeker: /api/public/ad-packages
// - Talebi oluşturur: POST /api/ads/requests
// Not: Paket oluşturma admin işidir. Advertiser sadece paket seçip talep açar.
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import AdvertiserOnly from "@/components/AdvertiserOnly";

type Package = {
  _id: string;
  type?: string;
  name: string;
  code?: string;
  country?: string;
  currency?: string;
  price?: number;
  rules?: {
    allowedPlacements?: string[];
    maxDurationDaysByPlacement?: Record<string, number>;
  };
  active?: boolean;
};

function token() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

function authHeaders(): HeadersInit {
  const t = token();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function AdvertiserNewRequestPage() {
  const [country, setCountry] = useState("TR");

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [packageId, setPackageId] = useState("");
  const [placementKey, setPlacementKey] = useState("");
  const [requestedDays, setRequestedDays] = useState(3);

  const selectedPackage = useMemo(
    () => packages.find((p) => p._id === packageId) || null,
    [packages, packageId]
  );

  const allowedPlacements = useMemo(
    () => (Array.isArray(selectedPackage?.rules?.allowedPlacements) ? selectedPackage!.rules!.allowedPlacements! : []),
    [selectedPackage]
  );

  const maxDaysForPlacement = useMemo(() => {
    const key = String(placementKey || "").trim();
    if (!key) return 0;
    const m = selectedPackage?.rules?.maxDurationDaysByPlacement || {};
    const n = Number((m as any)?.[key] || 0);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [selectedPackage, placementKey]);

  const hasPlacements = allowedPlacements.length > 0;

  const placementOptions = useMemo(() => {
    const map = selectedPackage?.rules?.maxDurationDaysByPlacement || {};
    return allowedPlacements.map((key) => {
      const maxDays = Number((map as any)?.[key] || 0) || 0;
      return { key, maxDays };
    });
  }, [allowedPlacements, selectedPackage]);

  // “Görsel link” = banner görsel URL'i (MVP)
  const [creativeUrl, setCreativeUrl] = useState("");
  // Reklama tıklanınca gidecek hedef
  const [targetUrl, setTargetUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  const [geoLevel, setGeoLevel] = useState<"country" | "province" | "district" | "geoGroup">("country");
  const [geoTargetsText, setGeoTargetsText] = useState("");
  const [resolved, setResolved] = useState<{ mode: string; geoLevel: string; geoTargets: string[] } | null>(null);

  const targetingLocked = resolved != null && resolved.mode !== "free";

  async function previewTargeting(next?: { country?: string; geoLevel?: string; geoTargetsText?: string }) {
    try {
      const cc = String(next?.country || country || "TR").toUpperCase();
      const gl = String(next?.geoLevel || geoLevel || "country");
      const gt = String(next?.geoTargetsText ?? geoTargetsText ?? "");

      const qs = new URLSearchParams();
      qs.set("country", cc);
      qs.set("geoLevel", gl);
      if (gt.trim()) qs.set("geoTargets", gt);

      const res = await fetch(`/api/ads/requests/targeting-preview?${qs.toString()}`, {
        headers: { ...authHeaders() },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "preview failed");

      setResolved({
        mode: String(data?.mode || "free"),
        geoLevel: String(data?.geoLevel || "country"),
        geoTargets: Array.isArray(data?.geoTargets) ? data.geoTargets : [],
      });
    } catch {
      setResolved(null);
    }
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams();
      qs.set("type", "AD");
      qs.set("country", String(country || "TR").toUpperCase());

      const res = await fetch(`/api/packages?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Paketler alınamadı.");

      const list = Array.isArray(data?.packages) ? (data.packages as Package[]) : [];
      setPackages(list);

      const first =
        list.find((x) => x && x.active !== false && Array.isArray(x?.rules?.allowedPlacements) && x.rules!.allowedPlacements!.length > 0) ||
        list.find((x) => x && x.active !== false) ||
        list[0] ||
        null;
      setPackageId(first?._id || "");
      const firstPlacement = Array.isArray(first?.rules?.allowedPlacements) ? first!.rules!.allowedPlacements![0] : "";
      setPlacementKey(firstPlacement || "");
    } catch (e: any) {
      setPackages([]);
      setPackageId("");
      setPlacementKey("");
      setErr(e?.message || "Paketler alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  useEffect(() => {
    // Paket değişince placement ilk elemana sıfırlansın
    const first = Array.isArray(selectedPackage?.rules?.allowedPlacements)
      ? selectedPackage!.rules!.allowedPlacements![0]
      : "";
    setPlacementKey(String(first || ""));
  }, [selectedPackage?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // max gün kısıtı varsa clamp et
    if (maxDaysForPlacement > 0 && requestedDays > maxDaysForPlacement) setRequestedDays(maxDaysForPlacement);
    if (requestedDays < 1) setRequestedDays(1);
  }, [maxDaysForPlacement, requestedDays]);

  useEffect(() => {
    previewTargeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, geoLevel, geoTargetsText]);

  useEffect(() => {
    if (!resolved) return;
    if (resolved.mode === "free") return;

    const gl = String(resolved.geoLevel || "country") as any;
    const gt = Array.isArray(resolved.geoTargets) ? resolved.geoTargets : [];
    setGeoLevel(gl);
    setGeoTargetsText(gt.join(", "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved?.mode, resolved?.geoLevel, (resolved?.geoTargets || []).join(",")]);

  async function submit() {
    setErr(null);
    try {
      if (!packageId) throw new Error("Paket seçmelisiniz.");
      if (!placementKey) throw new Error("Yerleşim seçmelisiniz.");
      if (!hasPlacements) throw new Error("Seçilen pakette yerleşim yok. (Admin paket motorunda rules.allowedPlacements girmeli)");
      if (allowedPlacements.length && !allowedPlacements.includes(placementKey)) {
        throw new Error("Bu yerleşim seçilen paket için uygun değil.");
      }
      if (!creativeUrl.trim()) throw new Error("Görsel URL gerekli.");
      if (!targetUrl.trim()) throw new Error("Hedef URL gerekli.");

      const geoTargets = geoTargetsText
        ? geoTargetsText
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : [];

      const finalGeoLevel = targetingLocked && resolved?.geoLevel ? String(resolved.geoLevel) : geoLevel;
      const finalGeoTargets = targetingLocked && Array.isArray(resolved?.geoTargets) ? resolved!.geoTargets : geoTargets;

      // 1) Paket satın al -> order oluştur
      const buyRes = await fetch(`/api/packages/${encodeURIComponent(packageId)}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({}),
      });
      const buyData = await buyRes.json().catch(() => ({}));
      if (!buyRes.ok) throw new Error(buyData?.message || `Paket satın alma başarısız (HTTP ${buyRes.status})`);
      const orderId = String(buyData?.order?._id || "");
      if (!orderId) throw new Error("Sipariş (order) oluşturulamadı.");

      const body = {
        packageOrderId: orderId,
        countryTargets: [String(country || "TR").toUpperCase()],
        placementKey,
        requestedDays: Number(requestedDays || 0) || 1,
        creativeUrl: creativeUrl.trim(),
        clickUrl: targetUrl.trim(),
        title: title.trim(),
        geoLevel: finalGeoLevel,
        geoTargets: finalGeoTargets,
        note: note.trim(),
      };

      const res = await fetch("/api/ads/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 403 ise genelde “advertiser onay bekliyor” ya da role/policy sebebi
        throw new Error(data?.message || `İstek başarısız (HTTP ${res.status})`);
      }

      // başarı
      setCreativeUrl("");
      setTargetUrl("");
      setTitle("");
      setNote("");
      alert("Talep oluşturuldu. Admin onayı bekleniyor.");
    } catch (e: any) {
      setErr(e?.message || "Talep oluşturulamadı.");
    }
  }

  return (
    <AdvertiserOnly>
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-50">Yeni Reklam Talebi</h1>
          <div className="text-xs text-slate-400">
            Paket seç → yer seç → görsel/hedef gir → talep gönder
          </div>
        </div>

        {err && (
          <div className="mb-3 rounded-lg border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {err}
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs text-slate-400">Ülke</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
              >
                <option value="TR">TR</option>
                <option value="DE">DE</option>
                <option value="NL">NL</option>
                <option value="NO">NO</option>
                <option value="FI">FI</option>
                <option value="ES">ES</option>
                <option value="IT">IT</option>
                <option value="HU">HU</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400">Paket</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                value={packageId}
                onChange={(e) => {
                  const id = e.target.value;
                  setPackageId(id);
                  const p = packages.find((x) => x._id === id);
                  const pk = Array.isArray(p?.rules?.allowedPlacements) ? p!.rules!.allowedPlacements![0] : "";
                  setPlacementKey(pk || "");
                }}
                disabled={loading}
              >
                {loading ? (
                  <option>Yükleniyor…</option>
                ) : packages.length === 0 ? (
                  <option value="">Paket yok</option>
                ) : (
                  packages
                    .filter((p) => p.active !== false)
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} {p.price != null ? `- ${p.price} ${p.currency || ""}` : ""}
                      </option>
                    ))
                )}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-slate-400">Yerleşim</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                value={placementKey}
                onChange={(e) => setPlacementKey(e.target.value)}
                disabled={!selectedPackage}
              >
                {placementOptions.length === 0 ? (
                  <option value="">(Paketin yerleşimi yok)</option>
                ) : (
                  placementOptions.map((pl) => (
                    <option key={pl.key} value={pl.key}>
                      {pl.key} {pl.maxDays ? `(${pl.maxDays} gün)` : ""}
                    </option>
                  ))
                )}
              </select>
              <div className="mt-1 text-[11px] text-slate-500">
                Yerleşimler paketten gelir. Admin paket motorundan yönetir.
              </div>
              {!loading && selectedPackage && placementOptions.length === 0 && (
                <div className="mt-2 rounded-lg border border-amber-800 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
                  Bu paket için yerleşim tanımı yok. Lütfen admin panelden <span className="font-semibold">Reklam Paketleri</span>
                  sayfasında placements ekleyin.
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400">Süre (Gün)</label>
              <input
                type="number"
                min={1}
                max={maxDaysForPlacement > 0 ? maxDaysForPlacement : undefined}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                value={requestedDays}
                onChange={(e) => setRequestedDays(Number(e.target.value || 1))}
              />
              {maxDaysForPlacement > 0 && (
                <div className="mt-1 text-[11px] text-slate-500">Bu yerleşimde maksimum: {maxDaysForPlacement} gün</div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-slate-400">Başlık (opsiyonel)</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                placeholder="kısa başlık"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">Hedefleme Seviyesi</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                value={geoLevel}
                onChange={(e) => setGeoLevel(e.target.value as any)}
                disabled={targetingLocked}
              >
                <option value="country">country</option>
                <option value="province">province</option>
                <option value="district">district</option>
                <option value="geoGroup">geoGroup</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400">Hedefler (virgülle)</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                placeholder={geoLevel === "geoGroup" ? "ISTANBUL_EUROPE" : "TR-34, TR-06"}
                value={geoTargetsText}
                onChange={(e) => setGeoTargetsText(e.target.value)}
                disabled={targetingLocked}
              />
              <div className="mt-1 text-[11px] text-slate-500">
                Kısıtlı sektörlerde sistem otomatik kilitleyebilir. Sonuç aşağıda görünür.
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
                {resolved ? (
                  <>
                    <div>
                      Sistem hedefleme önizlemesi: <span className="text-slate-100 font-semibold">{resolved.geoLevel}</span>
                      {resolved.geoTargets.length ? `: ${resolved.geoTargets.join(", ")}` : ""}
                    </div>
                    <div className="text-[11px] text-slate-500">Kaynak: {resolved.mode === "policy" ? "BusinessPolicy" : resolved.mode === "override" ? "Firma İstisnası" : "Serbest"}</div>
                  </>
                ) : (
                  <div className="text-[11px] text-slate-500">Hedefleme önizlemesi yok.</div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-slate-400">Görsel URL (banner)</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                placeholder="https://..."
                value={creativeUrl}
                onChange={(e) => setCreativeUrl(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-slate-400">Hedef URL</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                placeholder="https://..."
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-slate-400">Not (opsiyonel)</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                placeholder="kısa not"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <button
                onClick={load}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
              >
                Paketleri yenile
              </button>
              <button
                onClick={submit}
                className="rounded-lg bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/25"
              >
                Talebi Gönder
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdvertiserOnly>
  );
}
