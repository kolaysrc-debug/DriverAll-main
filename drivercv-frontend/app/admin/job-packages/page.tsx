"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/job-packages/page.tsx

import React, { useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/api/_core";

type Placement = { key: string; label?: string; maxDays?: number; notes?: string };

type Row = {
  _id: string;
  name: string;
  country?: string;
  geoLevel?: "country" | "state" | "city" | "district" | string;
  placements?: Placement[];
  durationDays?: number;
  maxJobs?: number;
  price?: number;
  currency?: string;
  requiresAdminApproval?: boolean;
  restrictedBusinessTypes?: string[];
  active?: boolean;
  sortOrder?: number;
  note?: string;
};

function parseCsv(csv: string) {
  return String(csv || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

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

export default function AdminJobPackagesPage() {
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

  // create
  const [name, setName] = useState("");
  const [country, setCountry] = useState("ALL");
  const [geoLevel, setGeoLevel] = useState<"country" | "state" | "city" | "district">("country");
  const [durationDays, setDurationDays] = useState(7);
  const [maxJobs, setMaxJobs] = useState(1);
  const [placementsCsv, setPlacementsCsv] = useState("JOB_LIST_TOP:7,HOME_JOB_TOP:3");
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState("EUR");
  const [requiresAdminApproval, setRequiresAdminApproval] = useState(true);
  const [restrictedTypesCsv, setRestrictedTypesCsv] = useState("SRC,DRIVING_SCHOOL,PSYCHOTECH"); // opsiyonel
  const [sortOrder, setSortOrder] = useState(0);
  const [note, setNote] = useState("");

  // edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eCountry, setECountry] = useState("ALL");
  const [eGeo, setEGeo] = useState<"country" | "state" | "city" | "district">("country");
  const [eDurationDays, setEDurationDays] = useState(7);
  const [eMaxJobs, setEMaxJobs] = useState(1);
  const [ePlacements, setEPlacements] = useState("");
  const [ePrice, setEPrice] = useState(0);
  const [eCurrency, setECurrency] = useState("EUR");
  const [eRequiresApproval, setERequiresApproval] = useState(true);
  const [eRestrictedTypes, setERestrictedTypes] = useState("");
  const [eActive, setEActive] = useState(true);
  const [eSortOrder, setESortOrder] = useState(0);
  const [eNote, setENote] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/job-packages", {
        headers: { ...authHeaders() },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Liste alınamadı.");

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

    const nm = String(name || "").trim();
    if (!nm) {
      setErr("name required");
      return;
    }

    const placements = parsePlacementsCsv(placementsCsv, Number(durationDays || 0) || 7);
    if (!placements.length) {
      setErr("placements required (örn: JOB_LIST_TOP:7,HOME_JOB_TOP:3)");
      return;
    }

    const body = {
      name: nm,
      country: String(country || "ALL").toUpperCase(),
      geoLevel,
      placements,
      durationDays: Number(durationDays || 0) || 7,
      maxJobs: Number(maxJobs || 0) || 1,
      price: Number(price || 0) || 0,
      currency: String(currency || "EUR").toUpperCase(),
      requiresAdminApproval: Boolean(requiresAdminApproval),
      restrictedBusinessTypes: parseCsv(restrictedTypesCsv),
      active: true,
      sortOrder: Number(sortOrder || 0) || 0,
      note: String(note || ""),
    };

    setSaving(true);
    try {
      const res = await fetch("/api/admin/job-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "create failed");

      setName("");
      setNote("");
      await load();
    } catch (e: any) {
      setErr(e?.message || "create error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(r: Row) {
    setEditingId(r._id);
    setEName(String(r.name || ""));
    setECountry(String(r.country || "ALL").toUpperCase());
    setEGeo((r.geoLevel as any) || "country");
    setEDurationDays(Number(r.durationDays || 7));
    setEMaxJobs(Number(r.maxJobs || 1));
    setEPlacements(placementsToCsv(r.placements));
    setEPrice(Number(r.price || 0));
    setECurrency(String(r.currency || "EUR").toUpperCase());
    setERequiresApproval(r.requiresAdminApproval !== false);
    setERestrictedTypes((r.restrictedBusinessTypes || []).join(","));
    setEActive(r.active !== false);
    setESortOrder(Number(r.sortOrder || 0));
    setENote(String(r.note || ""));
    setErr(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setErr(null);

    const nm = String(eName || "").trim();
    if (!nm) {
      setErr("name required");
      return;
    }

    const placements = parsePlacementsCsv(ePlacements, Number(eDurationDays || 0) || 7);
    if (!placements.length) {
      setErr("placements required");
      return;
    }

    const payload = {
      name: nm,
      country: String(eCountry || "ALL").toUpperCase(),
      geoLevel: eGeo,
      placements,
      durationDays: Number(eDurationDays || 0) || 7,
      maxJobs: Number(eMaxJobs || 0) || 1,
      price: Number(ePrice || 0) || 0,
      currency: String(eCurrency || "EUR").toUpperCase(),
      requiresAdminApproval: Boolean(eRequiresApproval),
      restrictedBusinessTypes: parseCsv(eRestrictedTypes),
      active: Boolean(eActive),
      sortOrder: Number(eSortOrder || 0) || 0,
      note: String(eNote || ""),
    };

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/job-packages/${encodeURIComponent(editingId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "update failed");

      setEditingId(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || "update error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActiveQuick(id: string, nextActive: boolean) {
    setErr(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/job-packages/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ active: nextActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "update failed");
      await load();
    } catch (e: any) {
      setErr(e?.message || "update error");
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
            <h1 className="text-xl font-bold text-slate-50">İlan Paketleri</h1>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              placeholder="Süre (gün)"
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value || 0))}
            />

            <input
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="maxJobs"
              type="number"
              value={maxJobs}
              onChange={(e) => setMaxJobs(Number(e.target.value || 1))}
            />

            <input
              className="md:col-span-6 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="Placements: JOB_LIST_TOP:7,HOME_JOB_TOP:3"
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

            <label className="md:col-span-2 flex items-center gap-2 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={requiresAdminApproval}
                onChange={(e) => setRequiresAdminApproval(e.target.checked)}
              />
              Admin onayı gerekir
            </label>

            <input
              className="md:col-span-4 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="Kısıtlı business types (CSV) örn: SRC,DRIVING_SCHOOL"
              value={restrictedTypesCsv}
              onChange={(e) => setRestrictedTypesCsv(e.target.value)}
            />

            <input
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value || 0))}
            />

            <input
              className="md:col-span-4 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="Not"
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
                <th className="px-3 py-2">Süre</th>
                <th className="px-3 py-2">Fiyat</th>
                <th className="px-3 py-2">Durum</th>
                <th className="px-3 py-2 text-right">İşlem</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-slate-400">
                    Yükleniyor…
                  </td>
                </tr>
              )}

              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-slate-500">
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
                          {(r.placements || [])
                            .map((p) => (p.maxDays ? `${p.key}:${p.maxDays}` : p.key))
                            .join(", ")}
                        </td>
                        <td className="px-3 py-2 text-xs">{Number(r.durationDays || 0)}g / maxJobs:{Number(r.maxJobs || 1)}</td>
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

                  return (
                    <tr key={r._id} className="border-t border-slate-800 text-slate-100 bg-amber-950/30 ring-1 ring-amber-500/30">
                      <td className="px-3 py-2">
                        <input
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                          value={eName}
                          onChange={(e) => setEName(e.target.value)}
                        />
                        <div className="mt-2 text-[11px] text-slate-400">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={eRequiresApproval}
                              onChange={(e) => setERequiresApproval(e.target.checked)}
                            />
                            Admin onayı gerekir
                          </label>
                        </div>
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
                          placeholder="JOB_LIST_TOP:7,HOME_JOB_TOP:3"
                        />
                        <div className="mt-1 text-[11px] text-slate-500">Format: KEY:days (virgülle)</div>
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <input
                            className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                            type="number"
                            value={eDurationDays}
                            onChange={(e) => setEDurationDays(Number(e.target.value || 0))}
                          />
                          <span className="text-xs text-slate-400">gün</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                            type="number"
                            value={eMaxJobs}
                            onChange={(e) => setEMaxJobs(Number(e.target.value || 1))}
                          />
                          <span className="text-xs text-slate-400">maxJobs</span>
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

                        <div className="mt-2">
                          <input
                            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                            value={eRestrictedTypes}
                            onChange={(e) => setERestrictedTypes(e.target.value)}
                            placeholder="restricted types CSV"
                          />
                          <div className="mt-1 text-[11px] text-slate-500">örn: SRC,DRIVING_SCHOOL,PSYCHOTECH</div>
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        <label className="inline-flex items-center gap-2 text-xs text-slate-200">
                          <input type="checkbox" checked={eActive} onChange={(e) => setEActive(e.target.checked)} />
                          Aktif
                        </label>

                        <div className="mt-2">
                          <input
                            className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                            type="number"
                            value={eSortOrder}
                            onChange={(e) => setESortOrder(Number(e.target.value || 0))}
                          />
                          <span className="ml-2 text-xs text-slate-400">sort</span>
                        </div>
                        <input
                          className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                          value={eNote}
                          onChange={(e) => setENote(e.target.value)}
                          placeholder="not"
                        />
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
