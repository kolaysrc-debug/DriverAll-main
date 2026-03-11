"use client";

// PATH: drivercv-frontend/app/admin/job-requests/page.tsx

import React, { useEffect, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import { approveJobRequest, fetchAdminJobRequests, rejectJobRequest } from "@/lib/api/jobRequests";
import { useRouter } from "next/navigation";

type Row = {
  _id: string;
  status: "pending" | "approved" | "rejected";
  packageName?: string;
  placementKey?: string;
  requestedDays?: number;
  title?: string;
  createdAt?: string;
  businessType?: string;
};

export default function AdminJobRequestsPage() {
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

  function isAuthError(e: any) {
    const msg = String(e?.message || "");
    return msg.includes("HTTP 401") || msg.includes("HTTP 403");
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchAdminJobRequests(status);
      setList(Array.isArray(data?.list) ? data.list : []);
    } catch (e: any) {
      if (isAuthError(e)) {
        handleAuthFailure("Oturum geçersiz (HTTP 401/403)");
        return;
      }
      setErr(e?.message || "Liste alınamadı.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function approve(id: string) {
    setErr(null);
    try {
      const startAt = window.prompt("Start date (YYYY-MM-DD) (opsiyonel)", "") || "";
      const adminNote = window.prompt("Admin notu (opsiyonel)", "") || "";
      await approveJobRequest(id, {
        startAt: startAt.trim() ? `${startAt.trim()}T00:00:00.000Z` : undefined,
        adminNote,
      });
      await load();
    } catch (e: any) {
      if (isAuthError(e)) {
        handleAuthFailure("Oturum geçersiz (HTTP 401/403)");
        return;
      }
      setErr(e?.message || "Approve failed");
    }
  }

  async function reject(id: string) {
    setErr(null);
    try {
      const adminNote = window.prompt("Red notu (opsiyonel)", "Uygun değil") || "";
      await rejectJobRequest(id, { adminNote });
      await load();
    } catch (e: any) {
      if (isAuthError(e)) {
        handleAuthFailure("Oturum geçersiz (HTTP 401/403)");
        return;
      }
      setErr(e?.message || "Reject failed");
    }
  }

  return (
    <AdminOnly>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">İlan Talepleri</h1>
            <div className="text-xs text-slate-400">approve → Job yayınlanır</div>
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
                <th className="px-3 py-2">Başlık</th>
                <th className="px-3 py-2">Paket</th>
                <th className="px-3 py-2">Yer</th>
                <th className="px-3 py-2">Gün</th>
                <th className="px-3 py-2">Tip</th>
                <th className="px-3 py-2 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-slate-400">
                    Yükleniyor…
                  </td>
                </tr>
              )}

              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-slate-500">
                    Kayıt yok.
                  </td>
                </tr>
              )}

              {!loading &&
                list.map((r) => (
                  <tr key={r._id} className="border-t border-slate-800 text-slate-100 hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 py-2">{r.title || "-"}</td>
                    <td className="px-3 py-2 text-slate-300">{r.packageName || "-"}</td>
                    <td className="px-3 py-2 text-slate-300">{r.placementKey || "-"}</td>
                    <td className="px-3 py-2 text-slate-300">{r.requestedDays || 0}</td>
                    <td className="px-3 py-2 text-slate-300">{r.businessType || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      {status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => reject(r._id)}
                            className="rounded-lg border border-rose-800 bg-rose-950/30 px-3 py-1 text-xs text-rose-200 hover:bg-rose-950/50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => approve(r._id)}
                            className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
                          >
                            Approve
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
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
