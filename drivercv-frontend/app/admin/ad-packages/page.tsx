"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/ad-packages/page.tsx

import React, { useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/api/_core";

type Placement = {
  key: string;        // HOME_TOP, DASHBOARD_RIGHT
  label?: string;     // UI label (opsiyonel)
  maxDays?: number;   // slot max gün
  notes?: string;
};

type Row = {
  _id: string;
  name: string;
  country?: string;
  geoLevel?: "country" | "state" | "city" | "district" | string;
  placements?: Placement[];
  price?: number;
  currency?: string;
  maxAds?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function parseCsv(csv: string) {
  return String(csv || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * placements edit format:
 * - "HOME_TOP:3,DASHBOARD_RIGHT:5"
 * - "HOME_TOP,DASHBOARD_RIGHT"  -> defaultDays kullanılır
 */
function parsePlacementsCsv(csv: string, defaultDays: number): Placement[] {
  const parts = parseCsv(csv);
  const out: Placement[] = [];

  for (const part of parts) {
    const [rawKey, rawDays] = part.split(":").map((x) => String(x || "").trim());
    const key = rawKey;
    if (!key) continue;

    const n = Number(rawDays);
    const maxDays = Number.isFinite(n) && n > 0 ? n : defaultDays;

    out.push({ key, label: key, maxDays });
  }

  return out;
}

function placementsToCsv(p: Placement[] | undefined) {
  const arr = Array.isArray(p) ? p : [];
  if (!arr.length) return "";
  return arr
    .map((x) => {
      const k = String(x?.key || "").trim();
      const d = Number(x?.maxDays || 0);
      if (!k) return "";
      return d > 0 ? `${k}:${d}` : k;
    })
    .filter(Boolean)
    .join(",");
}

export default function AdminAdPackagesPage() {
  const router = useRouter();
  const [redirecting] = useState(true);

  useEffect(() => {
    router.replace("/admin/packages");
  }, [router]);

  if (redirecting) {
    return (
      <AdminOnly>
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
          <div className="text-slate-200">Yönlendiriliyor…</div>
        </div>
      </AdminOnly>
    );
  }

  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // create form
  const [pkgName, setPkgName] = useState("");
  const [country, setCountry] = useState("ALL");
  const [geoLevel, setGeoLevel] = useState<"country" | "state" | "city" | "district">("country");
  const [durationDays, setDurationDays] = useState(3);
  const [placementsCsv, setPlacementsCsv] = useState("HOME_TOP:3,HOME_RIGHT:3,DASHBOARD_RIGHT:3");
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState("EUR");
  const [maxAds, setMaxAds] = useState(1);

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eCountry, setECountry] = useState("ALL");
  const [eGeo, setEGeo] = useState<"country" | "state" | "city" | "district">("country");
  const [ePlacements, setEPlacements] = useState("");
  const [ePrice, setEPrice] = useState(0);
  const [eCurrency, setECurrency] = useState("EUR");
  const [eMaxAds, setEMaxAds] = useState(1);
  const [eActive, setEActive] = useState(true);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/ad-packages", {
        headers: { ...authHeaders() },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Liste alınamadı.");

      // bazı yerlerde list, bazı yerlerde packages dönebiliyor: ikisine de tolerans
      const arr = Array.isArray(data.packages)
        ? data.packages
        : Array.isArray(data.list)
          ? data.list
          : [];

      setList(arr);
    } catch (e: any) {
      setErr(e?.message || "Hata");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    if (saving) return;
    setErr(null);

    const name = String(pkgName || "").trim();
    if (!name) {
      setErr("Paket adı (İsim) gerekli.");
      return;
    }

    const placements = parsePlacementsCsv(placementsCsv, Number(durationDays || 0) || 3);
    if (!placements.length) {
      setErr("Placements boş olamaz. Örn: HOME_TOP:3,DASHBOARD_RIGHT:5");
      return;
    }

    const body = {
      name,
      country: String(country || "ALL").toUpperCase(),
      geoLevel,
      placements,
      price: Number(price || 0),
      currency: String(currency || "EUR").toUpperCase(),
      maxAds: Number(maxAds || 1),
      active: true,
    };

    setSaving(true);
    try {
      const res = await fetch("/api/admin/ad-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "Create failed");

      // temizle
      setPkgName("");
      setCountry("ALL");
      setGeoLevel("country");
      setDurationDays(3);
      setPlacementsCsv("HOME_TOP:3,DASHBOARD_RIGHT:3");
      setPrice(0);
      setCurrency("EUR");
      setMaxAds(1);

      await load();
    } catch (e: any) {
      setErr(e?.message || "Create error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(r: Row) {
    setEditingId(r._id);
    setEName(String(r.name || ""));
    setECountry(String(r.country || "ALL").toUpperCase());
    setEGeo((r.geoLevel as any) || "country");
    setEPlacements(placementsToCsv(r.placements));
    setEPrice(Number(r.price || 0));
    setECurrency(String(r.currency || "EUR").toUpperCase());
    setEMaxAds(Number(r.maxAds || 1));
    setEActive(r.active !== false);
    setErr(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setErr(null);

    const name = String(eName || "").trim();
    if (!name) {
      setErr("İsim boş olamaz.");
      return;
    }

    const placements = parsePlacementsCsv(ePlacements, 3);
    if (!placements.length) {
      setErr("Placements boş olamaz. Örn: HOME_TOP:3,DASHBOARD_RIGHT:5");
      return;
    }

    const payload = {
      name,
      country: String(eCountry || "ALL").toUpperCase(),
      geoLevel: eGeo,
      placements,
      price: Number(ePrice || 0),
      currency: String(eCurrency || "EUR").toUpperCase(),
      maxAds: Number(eMaxAds || 1),
      active: Boolean(eActive),
    };

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/ad-packages/${encodeURIComponent(editingId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "Update failed");

      setEditingId(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Update error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActiveQuick(id: string, nextActive: boolean) {
    setErr(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/ad-packages/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ active: nextActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "Update failed");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Update error");
    } finally {
      setSaving(false);
    }
  }

  const activeCount = useMemo(() => list.filter((x) => x.active !== false).length, [list]);

  return (
    <AdminOnly>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">Reklam Paketleri</h1>
            <div className="text-xs text-slate-400">Aktif: {activeCount}</div>
          </div>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 hover:bg-slate-800"
          >
            Yenile
          </button>
        </div>

        {err && (
          <div className="mb-3 rounded-lg border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {err}
          </div>
        )}

        {/* Create */}
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-100">Yeni Paket</div>

          <div className="grid gap-2 md:grid-cols-6">
            <input
              className="md:col-span-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="İsim"
              value={pkgName}
              onChange={(e) => setPkgName(e.target.value)}
            />

            <input
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="ALL/TR/DE"
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
            />

            <select
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={geoLevel}
              onChange={(e) => setGeoLevel(e.target.value as any)}
            >
              <option value="country">country</option>
              <option value="state">state</option>
              <option value="city">city</option>
              <option value="district">district</option>
            </select>

            <input
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="Gün (default)"
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value || 0))}
            />

            <input
              className="md:col-span-6 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="Placements: HOME_TOP:3,DASHBOARD_RIGHT:5"
              value={placementsCsv}
              onChange={(e) => setPlacementsCsv(e.target.value)}
            />

            <input
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="Fiyat"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value || 0))}
            />

            <input
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="EUR"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            />

            <input
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="maxAds"
              type="number"
              value={maxAds}
              onChange={(e) => setMaxAds(Number(e.target.value || 1))}
            />

            <button
              type="button"
              onClick={create}
              disabled={saving}
              className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/25 disabled:opacity-60"
            >
              Kaydet
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/60 text-slate-200">
              <tr>
                <th className="px-3 py-2">İsim</th>
                <th className="px-3 py-2">Ülke</th>
                <th className="px-3 py-2">Geo</th>
                <th className="px-3 py-2">Yerler</th>
                <th className="px-3 py-2">Fiyat</th>
                <th className="px-3 py-2">Durum</th>
                <th className="px-3 py-2 text-right">İşlem</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-slate-400">
                    Yükleniyor…
                  </td>
                </tr>
              )}

              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-slate-500">
                    Paket yok.
                  </td>
                </tr>
              )}

              {!loading &&
                list.map((r) => {
                  const isEdit = editingId === r._id;

                  if (!isEdit) {
                    return (
                      <tr key={r._id} className="border-t border-slate-800 text-slate-100 hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 py-2 font-semibold">{r.name}</td>
                        <td className="px-3 py-2">{r.country || "ALL"}</td>
                        <td className="px-3 py-2 text-xs text-slate-300">{r.geoLevel || "country"}</td>
                        <td className="px-3 py-2 text-xs text-slate-300">
                          {(r.placements || []).map((p) => (p.maxDays ? `${p.key}:${p.maxDays}` : p.key)).join(", ")}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {Number(r.price || 0)} {r.currency || "EUR"}
                        </td>
                        <td className="px-3 py-2">
                          {r.active === false ? (
                            <span className="text-rose-300">Pasif</span>
                          ) : (
                            <span className="text-emerald-300">Aktif</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => startEdit(r)}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-100 hover:bg-slate-800"
                          >
                            Düzenle
                          </button>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => toggleActiveQuick(r._id, r.active === false)}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-100 hover:bg-slate-800 disabled:opacity-60"
                          >
                            Aktif/Pasif
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  // edit row
                  return (
                    <tr key={r._id} className="border-t border-slate-800 text-slate-100 bg-amber-950/30 ring-1 ring-amber-500/30">
                      <td className="px-3 py-2">
                        <input
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                          value={eName}
                          onChange={(e) => setEName(e.target.value)}
                        />
                      </td>

                      <td className="px-3 py-2">
                        <input
                          className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                          value={eCountry}
                          onChange={(e) => setECountry(e.target.value.toUpperCase())}
                        />
                      </td>

                      <td className="px-3 py-2">
                        <select
                          className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                          value={eGeo}
                          onChange={(e) => setEGeo(e.target.value as any)}
                        >
                          <option value="country">country</option>
                          <option value="state">state</option>
                          <option value="city">city</option>
                          <option value="district">district</option>
                        </select>
                      </td>

                      <td className="px-3 py-2">
                        <input
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                          value={ePlacements}
                          onChange={(e) => setEPlacements(e.target.value)}
                          placeholder="HOME_TOP:3,DASHBOARD_RIGHT:5"
                        />
                        <div className="mt-1 text-[11px] text-slate-500">
                          Format: <span className="font-mono">KEY:days</span> virgülle.
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <input
                            className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                            type="number"
                            value={ePrice}
                            onChange={(e) => setEPrice(Number(e.target.value || 0))}
                          />
                          <input
                            className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                            value={eCurrency}
                            onChange={(e) => setECurrency(e.target.value.toUpperCase())}
                          />
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">maxAds</span>
                          <input
                            className="w-16 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                            type="number"
                            value={eMaxAds}
                            onChange={(e) => setEMaxAds(Number(e.target.value || 1))}
                          />
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        <label className="inline-flex items-center gap-2 text-xs text-slate-200">
                          <input
                            type="checkbox"
                            checked={eActive}
                            onChange={(e) => setEActive(e.target.checked)}
                          />
                          Aktif
                        </label>
                      </td>

                      <td className="px-3 py-2 text-right space-x-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={saveEdit}
                          className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-60"
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={cancelEdit}
                          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-100 hover:bg-slate-800 disabled:opacity-60"
                        >
                          Vazgeç
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminOnly>
  );
}
