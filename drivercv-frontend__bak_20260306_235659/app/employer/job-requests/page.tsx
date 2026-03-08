"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/job-requests/page.tsx
// ----------------------------------------------------------
// Employer Job Requests (İlan Taleplerim)
// - GET /api/job-requests/mine
// - Yeni talep: /employer/job-requests/new
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import EmployerOnly from "@/components/EmployerOnly";
import Link from "next/link";

type ReqRow = {
  _id: string;
  status?: string;
  jobId?: string;
  jobTitle?: string;
  packageName?: string;
  placementKey?: string;
  requestedDays?: number;
  createdAt?: string;
};

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}
function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function statusBadge(status?: string) {
  const s = String(status || "").toLowerCase();
  if (s === "approved") return "bg-emerald-500/15 text-emerald-200 border-emerald-800/50";
  if (s === "rejected") return "bg-rose-500/15 text-rose-200 border-rose-800/50";
  return "bg-amber-500/15 text-amber-200 border-amber-800/50"; // pending default
}

export default function EmployerJobRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [list, setList] = useState<ReqRow[]>([]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/job-requests/mine", { headers: authHeaders(), cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Liste alınamadı.");
      setList(Array.isArray(data?.list) ? data.list : []);
    } catch (e: any) {
      setErr(e?.message || "Beklenmeyen hata.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <EmployerOnly>
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">İlan Taleplerim</h1>
            <div className="text-xs text-slate-400">Gönderilen taleplerin durumu</div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/employer/job-requests/new"
              className="rounded-lg bg-sky-500/20 px-3 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-500/25"
            >
              Yeni talep
            </Link>
            <button
              onClick={load}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 hover:bg-slate-800"
            >
              Yenile
            </button>
          </div>
        </div>

        {err && (
          <div className="mb-4 rounded-lg border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {err}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/60 text-slate-200">
              <tr>
                <th className="px-3 py-2">İlan</th>
                <th className="px-3 py-2">Paket</th>
                <th className="px-3 py-2">Placement</th>
                <th className="px-3 py-2">Gün</th>
                <th className="px-3 py-2">Durum</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-3 text-slate-400" colSpan={6}>
                    Yükleniyor…
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-slate-400" colSpan={6}>
                    Henüz talep yok.
                  </td>
                </tr>
              ) : (
                list.map((r) => (
                  <tr key={r._id} className="border-t border-slate-800">
                    <td className="px-3 py-2">
                      <div className="text-slate-100">{r.jobTitle || r.jobId || "-"}</div>
                      {r.jobId && <div className="text-xs text-slate-500">jobId: {r.jobId}</div>}
                    </td>
                    <td className="px-3 py-2 text-slate-200">{r.packageName || "-"}</td>
                    <td className="px-3 py-2 text-slate-200">{r.placementKey || "-"}</td>
                    <td className="px-3 py-2 text-slate-200">{r.requestedDays || 0}</td>
                    <td className="px-3 py-2">
                      <span className={"inline-flex items-center rounded-full border px-2 py-1 text-xs " + statusBadge(r.status)}>
                        {r.status || "pending"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.jobId ? (
                        <Link
                          href={`/employer/jobs/new/${r.jobId}`}
                          className="text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800"
                        >
                          İlanı aç
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </EmployerOnly>
  );
}
