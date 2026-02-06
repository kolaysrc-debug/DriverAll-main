"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/approvals/page.tsx
// ----------------------------------------------------------
// Admin Approvals - Advertiser
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";

type UserRow = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  isApproved?: boolean;
  isActive?: boolean;
  createdAt?: string;
};

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [q, setQ] = useState("");

  const [users, setUsers] = useState<UserRow[]>([]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/approvals/advertisers?status=${status}`, {
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Liste alınamadı.");

      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (e: any) {
      setError(e?.message || "Beklenmeyen hata.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;

    return users.filter((u) => {
      const name = String(u.name || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      return name.includes(s) || email.includes(s) || String(u._id).includes(s);
    });
  }, [users, q]);

  async function approve(id: string) {
    setBusyId(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/approvals/advertisers/${id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ note: "" }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Onay işlemi başarısız.");

      await load();
    } catch (e: any) {
      setError(e?.message || "Onay sırasında hata.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/approvals/advertisers/${id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ note: "" }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Red işlemi başarısız.");

      await load();
    } catch (e: any) {
      setError(e?.message || "Red sırasında hata.");
    } finally {
      setBusyId(null);
    }
  }

  function statusLabel(u: UserRow) {
    if (u.isApproved === true) return "Onaylı";
    if (u.isApproved === false) return "Beklemede";
    return "Belirsiz";
  }

  return (
    <AdminOnly>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">Reklamveren Onayları</h1>
            <div className="text-xs text-slate-400">Advertiser hesaplarını onayla / reddet</div>
          </div>

          <button
            onClick={load}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 hover:bg-slate-800"
          >
            Yenile
          </button>
        </div>

        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatus("pending")}
              className={`rounded-full px-3 py-1 text-xs ${
                status === "pending"
                  ? "bg-sky-500/20 text-sky-200"
                  : "border border-slate-700 text-slate-200 hover:bg-slate-900"
              }`}
            >
              Bekleyen
            </button>
            <button
              onClick={() => setStatus("approved")}
              className={`rounded-full px-3 py-1 text-xs ${
                status === "approved"
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "border border-slate-700 text-slate-200 hover:bg-slate-900"
              }`}
            >
              Onaylı
            </button>
            <button
              onClick={() => setStatus("rejected")}
              className={`rounded-full px-3 py-1 text-xs ${
                status === "rejected"
                  ? "bg-rose-500/20 text-rose-200"
                  : "border border-slate-700 text-slate-200 hover:bg-slate-900"
              }`}
            >
              Reddedilen
            </button>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: isim / e-posta / id"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 md:max-w-xs"
          />
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/60 text-slate-200">
              <tr>
                <th className="px-3 py-2">Kullanıcı</th>
                <th className="px-3 py-2">E-posta</th>
                <th className="px-3 py-2">Durum</th>
                <th className="px-3 py-2 text-right">İşlem</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                    Yükleniyor.
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((u) => {
                  const isBusy = busyId === u._id;
                  const st = statusLabel(u);

                  return (
                    <tr key={u._id} className="border-t border-slate-800 hover:bg-slate-900/40">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-100">{u.name || "(isim yok)"}</div>
                        <div className="text-xs text-slate-400">{u._id}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-200">{u.email || "-"}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-200">
                          {st}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          {status === "pending" && (
                            <>
                              <button
                                disabled={isBusy}
                                onClick={() => approve(u._id)}
                                className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-emerald-500 disabled:opacity-60"
                              >
                                Onayla
                              </button>
                              <button
                                disabled={isBusy}
                                onClick={() => reject(u._id)}
                                className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-slate-50 hover:bg-rose-500 disabled:opacity-60"
                              >
                                Reddet
                              </button>
                            </>
                          )}

                          {status !== "pending" && (
                            <button
                              disabled={isBusy}
                              onClick={() => {}}
                              className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-900 disabled:opacity-60"
                            >
                              Detay (sonra)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-slate-400">
          Not: Bu ekran şu an sadece <span className="text-slate-200">advertiser</span> rolündeki kullanıcıların onay akışını yönetir.
        </div>
      </div>
    </AdminOnly>
  );
}
