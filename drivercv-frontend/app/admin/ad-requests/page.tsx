"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/ad-requests/page.tsx
// ----------------------------------------------------------
// Admin - Reklam Talepleri
// - GET  /api/ads/requests/admin/list?status=pending|approved|rejected
// - POST /api/ads/requests/:id/approve
// - POST /api/ads/requests/:id/reject
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/api/_core";

type Row = {
  _id: string;
  packageName?: string;
  placementKey?: string;
  requestedDays?: number;
  title?: string;
  creativeUrl?: string;
  clickUrl?: string;
  status?: "pending" | "approved" | "rejected" | string;
  countryTargets?: string[];
  geoLevel?: string;
  adminNote?: string;
  createdAt?: string;
};

export default function AdminAdRequestsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  function handleAuthFailure(message: string) {
    try {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      window.dispatchEvent(new Event("driverall-auth-changed"));
    } catch {}
    setErr(message || "Oturum geçersiz. Lütfen tekrar giriş yapın.");
    router.replace("/login");
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/ads/requests/admin/list?status=${encodeURIComponent(status)}`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Liste alınamadı.");
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
  }, [status]);

  const pendingCount = useMemo(() => list.filter((x) => x.status === "pending").length, [list]);

  async function approve(id: string) {
    setErr(null);
    try {
      const adminNote = window.prompt("Admin notu (opsiyonel):", "") || "";
      const res = await fetch(`/api/ads/requests/${encodeURIComponent(id)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ adminNote }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Approve failed");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Approve error");
    }
  }

  async function reject(id: string) {
    setErr(null);
    try {
      const adminNote = window.prompt("Red nedeni / notu:", "") || "";
      const res = await fetch(`/api/ads/requests/${encodeURIComponent(id)}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ adminNote }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Reject failed");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Reject error");
    }
  }

  return (
    <AdminOnly>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">Reklam Talepleri</h1>
            <div className="text-xs text-slate-400">
              Durum: <span className="text-slate-200 font-semibold">{status}</span>
              {status === "pending" ? ` • Bekleyen: ${pendingCount}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>

            <button
              onClick={load}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 hover:bg-slate-800"
            >
              Yenile
            </button>
          </div>
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
                <th className="px-3 py-2">Placement</th>
                <th className="px-3 py-2">Gün</th>
                <th className="px-3 py-2">Başlık</th>
                <th className="px-3 py-2">Creative</th>
                <th className="px-3 py-2">Hedef</th>
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
                    Kayıt yok.
                  </td>
                </tr>
              )}

              {!loading &&
                list.map((r) => (
                  <tr key={r._id} className="border-t border-slate-800 text-slate-100 align-top">
                    <td className="px-3 py-2">{r.packageName || "-"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.placementKey || "-"}</td>
                    <td className="px-3 py-2">{r.requestedDays || 0}</td>
                    <td className="px-3 py-2">{r.title || "-"}</td>
                    <td className="px-3 py-2 text-xs">
                      {r.creativeUrl ? (
                        <a className="text-sky-300 hover:underline" href={r.creativeUrl} target="_blank">
                          görsel
                        </a>
                      ) : (
                        "-"
                      )}
                      {r.clickUrl ? (
                        <>
                          {" "}
                          •{" "}
                          <a className="text-sky-300 hover:underline" href={r.clickUrl} target="_blank">
                            tıkla
                          </a>
                        </>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-300">
                      {(r.countryTargets || []).join(", ") || "ALL"} • {r.geoLevel || "country"}
                    </td>
                    <td className="px-3 py-2">{r.status || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      {r.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => approve(r._id)}
                            className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => reject(r._id)}
                            className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/25"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">{r.adminNote ? "Not var" : ""}</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminOnly>
  );
}
