"use client";

// PATH: DriverAll-main/drivercv-frontend/app/advertiser/requests/page.tsx
// ----------------------------------------------------------
// Advertiser - Taleplerim
// - Liste: GET /api/ads/requests/mine
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdvertiserOnly from "@/components/AdvertiserOnly";
import { fetchMyAdRequests } from "@/lib/api/ads";

type AdRequest = {
  _id: string;
  packageName?: string;
  placementKey?: string;
  requestedDays?: number;
  countryTargets?: string[];
  geoLevel?: string;
  geoTargets?: string[];
  title?: string;
  clickUrl?: string;
  creativeUrl?: string;
  status?: "pending" | "approved" | "rejected";
  adminNote?: string;
  campaignId?: string | null;
  createdAt?: string;
  startAt?: string | null;
  endAt?: string | null;
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function badgeClass(status: string) {
  if (status === "approved") return "bg-emerald-500/20 text-emerald-200 border-emerald-700/40";
  if (status === "rejected") return "bg-rose-500/20 text-rose-200 border-rose-700/40";
  return "bg-amber-500/20 text-amber-200 border-amber-700/40"; // pending
}

function fmtDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdvertiserRequestsPage() {
  const [list, setList] = useState<AdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchMyAdRequests(); // { success, list }
      const rows = Array.isArray(data?.list) ? (data.list as AdRequest[]) : [];
      setList(rows);
    } catch (e: any) {
      setErr(e?.message || "Talepler yüklenemedi.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return list.filter((r) => {
      const st = (r.status || "pending") as StatusFilter;
      if (statusFilter !== "all" && st !== statusFilter) return false;

      if (!s) return true;
      const hay = [
        r.title,
        r.packageName,
        r.placementKey,
        (r.countryTargets || []).join(","),
        r.geoLevel,
        (r.geoTargets || []).join(","),
        r.adminNote,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(s);
    });
  }, [list, statusFilter, search]);

  return (
    <AdvertiserOnly>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-50">Taleplerim</h1>
            <div className="text-xs text-slate-400">
              Reklam talebi → Admin onayı → (Onaylanırsa) kampanya başlar
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <input
              className="w-full sm:w-64 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
              placeholder="Ara (başlık, paket, durum...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={load}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
            >
              Yenile
            </button>
            <Link
              href="/advertiser/requests/new"
              className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/25 text-center"
            >
              Yeni talep
            </Link>
          </div>
        </div>

        {err && (
          <div className="mb-3 rounded-lg border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {err}
          </div>
        )}

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setStatusFilter(k)}
              className={[
                "rounded-full border px-3 py-1.5 text-xs",
                statusFilter === k
                  ? "bg-slate-800 border-slate-600 text-slate-50"
                  : "bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-900",
              ].join(" ")}
            >
              {k === "all" ? "Tümü" : k === "pending" ? "Beklemede" : k === "approved" ? "Onaylı" : "Reddedildi"}
            </button>
          ))}
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-[950px] w-full text-sm">
              <thead className="bg-slate-950 border-b border-slate-800 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Tarih</th>
                  <th className="px-3 py-2 text-left">Başlık / Paket</th>
                  <th className="px-3 py-2 text-left">Yerleşim</th>
                  <th className="px-3 py-2 text-left">İçerik</th>
                  <th className="px-3 py-2 text-left">Hedefleme</th>
                  <th className="px-3 py-2 text-left">Gün</th>
                  <th className="px-3 py-2 text-left">Durum</th>
                  <th className="px-3 py-2 text-left">Admin Notu</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                      Yükleniyor...
                    </td>
                  </tr>
                )}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                      Talep bulunamadı.
                    </td>
                  </tr>
                )}

                {!loading &&
                  filtered.map((r) => {
                    const status = r.status || "pending";
                    const countries = (r.countryTargets || []).join(", ") || "-";
                    const geo =
                      r.geoLevel
                        ? `${r.geoLevel}${(r.geoTargets || []).length ? `: ${(r.geoTargets || []).join(", ")}` : ""}`
                        : "-";

                    return (
                      <tr key={r._id} className="border-t border-slate-800 hover:bg-slate-900/40">
                        <td className="px-3 py-2 text-slate-300">{fmtDate(r.createdAt)}</td>

                        <td className="px-3 py-2">
                          <div className="text-slate-50 font-medium">{r.title?.trim() || "(başlık yok)"}</div>
                          <div className="text-[11px] text-slate-400">{r.packageName || "-"}</div>
                          {r.campaignId ? (
                            <div className="text-[11px] text-emerald-300 mt-0.5">Kampanya: {String(r.campaignId)}</div>
                          ) : null}
                        </td>

                        <td className="px-3 py-2 text-slate-200">{r.placementKey || "-"}</td>

                        <td className="px-3 py-2 text-[12px] text-slate-300">
                          <div className="truncate max-w-[320px]">Click: {r.clickUrl?.trim() || "-"}</div>
                          <div className="truncate max-w-[320px] text-slate-500">Görsel: {r.creativeUrl?.trim() || "-"}</div>
                        </td>

                        <td className="px-3 py-2 text-[12px] text-slate-300">
                          <div>Ülke: {countries}</div>
                          <div className="text-slate-500">{geo}</div>
                        </td>

                        <td className="px-3 py-2 text-slate-200">{r.requestedDays || "-"}</td>

                        <td className="px-3 py-2">
                          <span
                            className={[
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]",
                              badgeClass(status),
                            ].join(" ")}
                          >
                            {status === "approved" ? "Onaylı" : status === "rejected" ? "Reddedildi" : "Beklemede"}
                          </span>
                          {status === "approved" && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              Başlangıç: {fmtDate(r.startAt)} · Bitiş: {fmtDate(r.endAt)}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-2 text-[12px] text-slate-300">{r.adminNote?.trim() || "-"}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdvertiserOnly>
  );
}
