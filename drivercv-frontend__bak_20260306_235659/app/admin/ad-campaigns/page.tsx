"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";

type Row = {
  _id: string;
  ownerId?: string;
  status?: "running" | "paused" | "ended" | string;
  placements?: string[];
  title?: string;
  clickUrl?: string;
  countryTargets?: string[];
  geoLevel?: string;
  geoTargets?: string[];
  startAt?: string | null;
  endAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

function token() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

function authHeaders(): HeadersInit {
  const t = token();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json", ...authHeaders() };
}

export default function AdminAdCampaignsPage() {
  const [status, setStatus] = useState<string>("");
  const [placement, setPlacement] = useState<string>("");
  const [ownerId, setOwnerId] = useState<string>("");

  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(() => list.find((x) => x._id === editingId) || null, [list, editingId]);

  const [eStatus, setEStatus] = useState<string>("running");
  const [ePlacements, setEPlacements] = useState<string>("");
  const [eStartAt, setEStartAt] = useState<string>("");
  const [eEndAt, setEEndAt] = useState<string>("");
  const [eCountryTargets, setECountryTargets] = useState<string>("");
  const [eGeoLevel, setEGeoLevel] = useState<string>("country");
  const [eGeoTargets, setEGeoTargets] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    setInfo(null);

    try {
      const qs = new URLSearchParams();
      if (status) qs.set("status", status);
      if (placement) qs.set("placement", placement);
      if (ownerId) qs.set("ownerId", ownerId);

      const res = await fetch(`/api/admin/ad-campaigns?${qs.toString()}`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Liste alınamadı");

      setList(Array.isArray(data.list) ? data.list : []);
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

  function beginEdit(r: Row) {
    setEditingId(r._id);
    setEStatus(String(r.status || "running"));
    setEPlacements(Array.isArray(r.placements) ? r.placements.join(",") : "");
    setEStartAt(r.startAt ? String(r.startAt).slice(0, 10) : "");
    setEEndAt(r.endAt ? String(r.endAt).slice(0, 10) : "");
    setECountryTargets(Array.isArray(r.countryTargets) ? r.countryTargets.join(",") : "");
    setEGeoLevel(String(r.geoLevel || "country"));
    setEGeoTargets(Array.isArray(r.geoTargets) ? r.geoTargets.join(",") : "");
    setErr(null);
    setInfo(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setErr(null);
    setInfo(null);

    setSaving(true);
    try {
      const payload: any = {
        status: eStatus,
        placements: ePlacements
          ? ePlacements
              .split(",")
              .map((x) => String(x).trim())
              .filter(Boolean)
          : [],
        startAt: eStartAt ? `${eStartAt}T00:00:00.000Z` : null,
        endAt: eEndAt ? `${eEndAt}T00:00:00.000Z` : null,
        countryTargets: eCountryTargets
          ? eCountryTargets
              .split(",")
              .map((x) => String(x).trim().toUpperCase())
              .filter(Boolean)
          : [],
        geoLevel: eGeoLevel,
        geoTargets: eGeoTargets
          ? eGeoTargets
              .split(",")
              .map((x) => String(x).trim().toUpperCase())
              .filter(Boolean)
          : [],
      };

      const res = await fetch(`/api/admin/ad-campaigns/${encodeURIComponent(editingId)}`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Güncellenemedi");

      setInfo("Kampanya güncellendi.");
      setEditingId(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Güncelleme hatası");
    } finally {
      setSaving(false);
    }
  }

  async function seedTest() {
    if (!confirm("Test kampanya seed edilsin mi?")) return;
    setErr(null);
    setInfo(null);

    try {
      const res = await fetch("/api/admin/ad-campaigns/seed", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ count: 10, countryTargets: ["TR"], placements: ["HOME_RIGHT"] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Seed failed");
      setInfo(`Seed ok: ${Number(data?.count || 0)}`);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Seed error");
    }
  }

  return (
    <AdminOnly>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 text-slate-200">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">Reklam Kampanyaları</h1>
            <div className="text-xs text-slate-400">Admin kampanya yönetimi (running/paused/ended)</div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div>
              <div className="mb-1 text-[11px] text-slate-400">status</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="">(hepsi)</option>
                <option value="running">running</option>
                <option value="paused">paused</option>
                <option value="ended">ended</option>
              </select>
            </div>

            <div>
              <div className="mb-1 text-[11px] text-slate-400">placement</div>
              <input
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                placeholder="HOME_RIGHT"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <div className="mb-1 text-[11px] text-slate-400">ownerId</div>
              <input
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                placeholder="userId"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
              />
            </div>

            <button
              onClick={load}
              className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
            >
              Yenile
            </button>

            <button
              onClick={seedTest}
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-100 hover:bg-slate-800"
            >
              Seed (test)
            </button>
          </div>
        </div>

        {err && (
          <div className="mb-3 rounded-lg border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{err}</div>
        )}
        {info && (
          <div className="mb-3 rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
            {info}
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-950">
          {loading ? (
            <div className="p-4 text-sm text-slate-400">Yükleniyor…</div>
          ) : list.length === 0 ? (
            <div className="p-4 text-sm text-slate-400">Kampanya yok.</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-950/90 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Kampanya</th>
                    <th className="px-3 py-2">Durum</th>
                    <th className="px-3 py-2">Hedef</th>
                    <th className="px-3 py-2">Tarih</th>
                    <th className="px-3 py-2 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r._id} className="border-t border-slate-800">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-100">{String(r.title || "Kampanya")}</div>
                        <div className="text-xs text-slate-500">id: {r._id}</div>
                        <div className="text-xs text-slate-500">owner: {String(r.ownerId || "")}</div>
                        <div className="text-xs text-slate-500">
                          placements: {(Array.isArray(r.placements) ? r.placements : []).join(", ")}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">{String(r.status || "")}</td>
                      <td className="px-3 py-2 text-xs text-slate-300">
                        {(Array.isArray(r.countryTargets) ? r.countryTargets : []).join(", ") || "ALL"} • {String(r.geoLevel || "country")}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-300">
                        {r.startAt ? String(r.startAt).slice(0, 10) : "-"} → {r.endAt ? String(r.endAt).slice(0, 10) : "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => beginEdit(r)}
                          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs hover:bg-slate-800"
                        >
                          Düzenle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {editing && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Düzenle</div>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs hover:bg-slate-800"
              >
                Kapat
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-slate-400">status</div>
                <select
                  value={eStatus}
                  onChange={(e) => setEStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="running">running</option>
                  <option value="paused">paused</option>
                  <option value="ended">ended</option>
                </select>
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">placements (csv)</div>
                <input
                  value={ePlacements}
                  onChange={(e) => setEPlacements(e.target.value)}
                  placeholder="HOME_RIGHT,DASHBOARD_RIGHT"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">startAt (YYYY-MM-DD)</div>
                <input
                  value={eStartAt}
                  onChange={(e) => setEStartAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">endAt (YYYY-MM-DD)</div>
                <input
                  value={eEndAt}
                  onChange={(e) => setEEndAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">countryTargets (csv)</div>
                <input
                  value={eCountryTargets}
                  onChange={(e) => setECountryTargets(e.target.value)}
                  placeholder="TR,DE"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">geoLevel</div>
                <select
                  value={eGeoLevel}
                  onChange={(e) => setEGeoLevel(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="country">country</option>
                  <option value="province">province</option>
                  <option value="district">district</option>
                  <option value="geoGroup">geoGroup</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="mb-1 text-xs text-slate-400">geoTargets (csv)</div>
                <input
                  value={eGeoTargets}
                  onChange={(e) => setEGeoTargets(e.target.value)}
                  placeholder="34,3401"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
              >
                Kaydet
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminOnly>
  );
}
