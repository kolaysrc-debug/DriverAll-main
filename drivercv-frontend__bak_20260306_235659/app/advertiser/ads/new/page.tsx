"use client";

// PATH: drivercv-frontend/app/advertiser/ads/new/page.tsx
// BUILD_MARK: DA-FIX-2026-01-13

import React, { useEffect, useMemo, useState } from "react";
import { createAdRequest, fetchPublicAdPackages } from "@/lib/api/ads";
import { useRouter } from "next/navigation";
import AdvertiserOnly from "@/components/AdvertiserOnly";

export default function NewAdRequestPage() {
  const router = useRouter();

  const [country, setCountry] = useState("TR");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [packageId, setPackageId] = useState("");
  const pkg = useMemo(() => list.find((x) => String(x._id) === String(packageId)), [list, packageId]);

  const [placementKey, setPlacementKey] = useState("");
  const maxDays = useMemo(() => {
    const p = (pkg?.placements || []).find((x: any) => String(x.key) === String(placementKey));
    return Number(p?.maxDays || 3) || 3;
  }, [pkg, placementKey]);

  const [requestedDays, setRequestedDays] = useState(3);
  const [title, setTitle] = useState("");
  const [clickUrl, setClickUrl] = useState("");
  const [creativeUrl, setCreativeUrl] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchPublicAdPackages(country);
      const arr = Array.isArray(data.list) ? data.list : [];
      setList(arr);
      if (arr.length && !packageId) setPackageId(String(arr[0]._id));
    } catch (e: any) {
      setErr(e?.message || "Paketler alınamadı");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  useEffect(() => {
    // package değişince placement seçimini sıfırla
    const firstPlacement = (pkg?.placements || [])[0]?.key || "";
    setPlacementKey(String(firstPlacement));
  }, [pkg?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (requestedDays > maxDays) setRequestedDays(maxDays);
    if (requestedDays < 1) setRequestedDays(1);
  }, [maxDays, requestedDays]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);

    try {
      const payload = {
        packageId,
        placementKey,
        requestedDays,
        title,
        clickUrl,
        creativeUrl,
        countryTargets: [country],
        geoLevel: "country",
        geoTargets: [],
      };

      const data = await createAdRequest(payload);
      if (!data?.success) throw new Error(data?.message || "Talep oluşturulamadı");

      router.replace("/advertiser/ads?created=1");
    } catch (e: any) {
      setErr(e?.message || "Talep oluşturulamadı");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdvertiserOnly>
      <div className="mx-auto max-w-2xl p-4 text-slate-100">
        <h1 className="text-xl font-semibold">Yeni Reklam Talebi</h1>

        {err && (
          <div className="mt-4 rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {loading ? (
          <div className="mt-4 text-sm text-slate-400">Yükleniyor…</div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm text-slate-300">Ülke</label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-slate-100"
                  value={country}
                  onChange={(e) => setCountry(String(e.target.value || "TR").toUpperCase())}
                >
                  <option value="TR">TR</option>
                  <option value="DE">DE</option>
                  <option value="NL">NL</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-300">Paket</label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-slate-100"
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                >
                  {list.map((x) => (
                    <option key={String(x._id)} value={String(x._id)}>
                      {x.name} ({x.price} {x.currency || "TRY"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm text-slate-300">Yerleşim (Placement)</label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-slate-100"
                  value={placementKey}
                  onChange={(e) => setPlacementKey(e.target.value)}
                >
                  {(pkg?.placements || []).map((p: any) => (
                    <option key={String(p.key)} value={String(p.key)}>
                      {p.label || p.key} (max {p.maxDays || 3} gün)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-300">Süre (Gün)</label>
                <input
                  type="number"
                  min={1}
                  max={maxDays}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-slate-100"
                  value={requestedDays}
                  onChange={(e) => setRequestedDays(Number(e.target.value || 1))}
                />
                <div className="mt-1 text-xs text-slate-500">Bu yerleşimde maksimum: {maxDays} gün</div>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300">Başlık</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-slate-100"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Kış Lastiği Kampanyası"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">Tıklama URL (opsiyonel)</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-slate-100"
                value={clickUrl}
                onChange={(e) => setClickUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">Görsel URL (zorunlu)</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-slate-100"
                value={creativeUrl}
                onChange={(e) => setCreativeUrl(e.target.value)}
                placeholder="https://.../banner.jpg"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={saving}
                className="rounded-md border border-slate-700 px-3 py-2 hover:bg-slate-900 disabled:opacity-60"
              >
                {saving ? "Gönderiliyor..." : "Talep Gönder"}
              </button>

              <a
                href="/advertiser/ads"
                className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
              >
                Vazgeç
              </a>
            </div>
          </form>
        )}
      </div>
    </AdvertiserOnly>
  );
}
