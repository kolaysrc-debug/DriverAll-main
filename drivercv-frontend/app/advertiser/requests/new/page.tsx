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
import { fetchPublicAdPackages } from "@/lib/api/ads";

type Placement = { key: string; label?: string; maxDays?: number; notes?: string };
type AdPackage = {
  _id: string;
  name: string;
  country?: string;
  geoLevel?: string;
  placements?: Placement[];
  price?: number;
  currency?: string;
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

  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [packageId, setPackageId] = useState("");
  const selectedPackage = useMemo(
    () => packages.find((p) => p._id === packageId) || null,
    [packages, packageId]
  );

  const [placementKey, setPlacementKey] = useState("");
  const placements = useMemo(() => selectedPackage?.placements || [], [selectedPackage]);

  // “Görsel link” = banner görsel URL'i (MVP)
  const [creativeUrl, setCreativeUrl] = useState("");
  // Reklama tıklanınca gidecek hedef
  const [targetUrl, setTargetUrl] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchPublicAdPackages(country); // { success, list }
      const list = Array.isArray(data?.list) ? (data.list as AdPackage[]) : [];
      setPackages(list);

      // İlk aktif paketi otomatik seç
      const first = list.find((x) => x && x.active !== false) || list[0] || null;
      setPackageId(first?._id || "");
      const firstPlacement = (first?.placements || [])[0]?.key || "";
      setPlacementKey(firstPlacement);
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

  async function submit() {
    setErr(null);
    try {
      if (!packageId) throw new Error("Paket seçmelisiniz.");
      if (!placementKey) throw new Error("Yerleşim seçmelisiniz.");
      if (!creativeUrl.trim()) throw new Error("Görsel URL gerekli.");
      if (!targetUrl.trim()) throw new Error("Hedef URL gerekli.");

      const body = {
        packageId,
        country: String(country || "TR").toUpperCase(),
        placementKey,
        creativeUrl: creativeUrl.trim(),
        targetUrl: targetUrl.trim(),
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
                  const pk = (p?.placements || [])[0]?.key || "";
                  setPlacementKey(pk);
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
                {placements.length === 0 ? (
                  <option value="">(Paketin yerleşimi yok)</option>
                ) : (
                  placements.map((pl) => (
                    <option key={pl.key} value={pl.key}>
                      {pl.label || pl.key} {pl.maxDays ? `(${pl.maxDays} gün)` : ""}
                    </option>
                  ))
                )}
              </select>
              <div className="mt-1 text-[11px] text-slate-500">
                Yerleşimler paketten gelir. Admin paket motorundan yönetir.
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
