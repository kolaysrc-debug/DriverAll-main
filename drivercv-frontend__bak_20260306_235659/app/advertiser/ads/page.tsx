"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMyAdRequests } from "@/lib/api/ads";

export default function AdvertiserAdsPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchMyAdRequests();
      setList(Array.isArray(data.list) ? data.list : []);
    } catch (e: any) {
      setErr(e?.message || "Liste alınamadı.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-100">Reklamlarım</h1>
        <Link
          href="/advertiser/ads/new"
          className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/25"
        >
          Yeni Reklam Talebi
        </Link>
      </div>

      {err && (
        <div className="mb-3 rounded-lg border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
          {err}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/60 text-slate-200">
            <tr>
              <th className="px-3 py-2">Paket</th>
              <th className="px-3 py-2">Yer</th>
              <th className="px-3 py-2">Gün</th>
              <th className="px-3 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                  Yükleniyor…
                </td>
              </tr>
            )}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                  Kayıt yok.
                </td>
              </tr>
            )}
            {!loading &&
              list.map((r) => (
                <tr key={r._id} className="border-t border-slate-800 text-slate-100">
                  <td className="px-3 py-2">{r.packageName || "-"}</td>
                  <td className="px-3 py-2 text-xs text-slate-300">{r.placementKey}</td>
                  <td className="px-3 py-2">{r.requestedDays}</td>
                  <td className="px-3 py-2">
                    {r.status === "approved" ? (
                      <span className="text-emerald-300">Onaylandı</span>
                    ) : r.status === "rejected" ? (
                      <span className="text-rose-300">Reddedildi</span>
                    ) : (
                      <span className="text-amber-300">Bekliyor</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
