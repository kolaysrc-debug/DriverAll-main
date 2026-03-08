"use client";

import React, { useEffect, useState } from "react";
import AdminOnly from "@/components/AdminOnly";

type Row = {
  _id?: string;
  country: string;
  groupKey: string;
  label?: string;
  members?: string[];
  active?: boolean;
  sortOrder?: number;
  note?: string;
};

function token() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

function authHeaders(): HeadersInit {
  const t = token();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function AdminGeoGroupsPage() {
  const [country, setCountry] = useState("TR");
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [groupKey, setGroupKey] = useState("ISTANBUL_ALL");
  const [label, setLabel] = useState("İstanbul (tüm ilçeler)");
  const [membersCsv, setMembersCsv] = useState("34");
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);

  async function load() {
    setLoading(true);
    setErr(null);
    setInfo(null);
    try {
      const sp = new URLSearchParams({ country: String(country || "TR").toUpperCase() });
      const res = await fetch(`/api/admin/geo-groups?${sp.toString()}`, { headers: authHeaders(), cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Liste alınamadı");
      setList(Array.isArray(data?.list) ? data.list : []);
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
  }, [country]);

  async function save() {
    setErr(null);
    setInfo(null);
    try {
      const payload = {
        country: String(country || "TR").toUpperCase(),
        groupKey: String(groupKey || "").trim().toUpperCase(),
        label: String(label || ""),
        members: String(membersCsv || "")
          .split(",")
          .map((x) => String(x).trim())
          .filter(Boolean),
        sortOrder: Number(sortOrder || 0) || 0,
        active: active !== false,
      };

      const res = await fetch("/api/admin/geo-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Kaydedilemedi");
      setInfo("Kaydedildi.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Kayıt hatası");
    }
  }

  return (
    <AdminOnly>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 text-slate-100">
        <div className="mb-4">
          <div className="text-xl font-bold">Geo Groups</div>
          <div className="mt-1 text-xs text-slate-400">Ülkeye göre şehir/ilçe grupları (reklam hedefleme için)</div>
        </div>

        {err && <div className="mb-3 rounded-lg border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{err}</div>}
        {info && <div className="mb-3 rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">{info}</div>}

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="grid gap-3 md:grid-cols-5">
            <div>
              <div className="text-xs text-slate-400">country</div>
              <select value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                <option value="TR">TR</option>
                <option value="DE">DE</option>
                <option value="NL">NL</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-slate-400">groupKey</div>
              <input value={groupKey} onChange={(e) => setGroupKey(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-slate-400">label</div>
              <input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-3">
              <div className="text-xs text-slate-400">members (csv)</div>
              <input value={membersCsv} onChange={(e) => setMembersCsv(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm" />
              <div className="mt-1 text-[11px] text-slate-500">Örn: il kodu (34) veya ilçe kodları</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">sortOrder</div>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value || 0))} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end gap-2">
              <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                active
              </label>
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button onClick={load} className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs hover:bg-slate-800">Yenile</button>
            <button onClick={save} className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500">Kaydet</button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950">
          {loading ? (
            <div className="p-4 text-sm text-slate-400">Yükleniyor…</div>
          ) : list.length === 0 ? (
            <div className="p-4 text-sm text-slate-400">Kayıt yok.</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-2">groupKey</th>
                    <th className="px-3 py-2">label</th>
                    <th className="px-3 py-2">members</th>
                    <th className="px-3 py-2">active</th>
                    <th className="px-3 py-2">sort</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={String(r._id || r.groupKey)} className="border-t border-slate-800">
                      <td className="px-3 py-2 font-mono text-xs">{r.groupKey}</td>
                      <td className="px-3 py-2">{r.label || "-"}</td>
                      <td className="px-3 py-2 text-xs text-slate-300">{(r.members || []).join(", ")}</td>
                      <td className="px-3 py-2">{r.active === false ? "false" : "true"}</td>
                      <td className="px-3 py-2">{Number(r.sortOrder || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminOnly>
  );
}
