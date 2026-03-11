"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/ad-approvals/page.tsx
// ----------------------------------------------------------
// Admin · Reklam Onayları
// - GET  /api/ads/requests/admin/list?status=pending|approved|rejected
// - POST /api/ads/requests/:id/approve
// - POST /api/ads/requests/:id/reject
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { approveAdRequest, fetchAdminAdRequests, rejectAdRequest } from "@/lib/api/ads";
import { getToken } from "@/lib/session";

type SafeUser = {
  role?: "admin" | "employer" | "advertiser" | "driver" | string;
};

type AdReqItem = {
  _id: string;
  title?: string;
  adTitle?: string; // bazı eski payload’larda olabilir
  packageName?: string;
  placementKey?: string;
  requestedDays?: number;
  status?: "pending" | "approved" | "rejected" | string;
  countryTargets?: string[];
  geoLevel?: string;
  geoTargets?: string[];
  creativeUrl?: string;
  clickUrl?: string;
  createdAt?: string;
};

function readUserFromStorage(): SafeUser | null {
  try {
    const token = getToken();
    if (token) {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
          atob(b64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(json);
        const u: any = { _id: payload.userId, email: payload.email, role: payload.role };
        if (u.role) {
          window.localStorage.setItem("user", JSON.stringify(u));
          return u as SafeUser;
        }
      }
    }

    const raw = window.localStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (u?.role) return u as SafeUser;
    return null;
  } catch {
    return null;
  }
}

function StatusPill({ status }: { status: string }) {
  const s = String(status || "pending");
  const cls =
    s === "approved"
      ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-200"
      : s === "rejected"
      ? "border-red-800/60 bg-red-950/40 text-red-200"
      : "border-amber-800/60 bg-amber-950/40 text-amber-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
      {s}
    </span>
  );
}

export default function AdminAdApprovalsPage() {
  const router = useRouter();

  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [list, setList] = useState<AdReqItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [q, setQ] = useState("");

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

  useEffect(() => {
    const u = readUserFromStorage();
    if (!u?.role) {
      router.replace("/login");
      return;
    }
    if (u.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
  }, [router]);

  async function load(nextStatus?: typeof status) {
    const s = nextStatus || status;
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchAdminAdRequests(s);
      setList(Array.isArray(data?.list) ? data.list : []);
    } catch (e: any) {
      if (isAuthError(e)) {
        handleAuthFailure("Oturum geçersiz (HTTP 401/403)");
        return;
      }
      setList([]);
      setErr(e?.message || "Bekleyen reklam talepleri alınamadı.");
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
    if (!s) return list;
    return list.filter((r) => {
      const t = String(r.title || r.adTitle || "").toLowerCase();
      const id = String(r._id || "").toLowerCase();
      const pkg = String(r.packageName || "").toLowerCase();
      return t.includes(s) || id.includes(s) || pkg.includes(s);
    });
  }, [list, q]);

  async function doApprove(id: string) {
    setBusyId(id);
    setErr(null);
    try {
      await approveAdRequest(id, adminNote ? { adminNote } : {});
      await load();
    } catch (e: any) {
      if (isAuthError(e)) {
        handleAuthFailure("Oturum geçersiz (HTTP 401/403)");
        return;
      }
      setErr(e?.message || "Approve başarısız.");
    } finally {
      setBusyId(null);
    }
  }

  async function doReject(id: string) {
    setBusyId(id);
    setErr(null);
    try {
      await rejectAdRequest(id, adminNote ? { adminNote } : {});
      await load();
    } catch (e: any) {
      if (isAuthError(e)) {
        handleAuthFailure("Oturum geçersiz (HTTP 401/403)");
        return;
      }
      setErr(e?.message || "Reject başarısız.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">Reklam Onayları</h1>
            <p className="text-sm text-slate-400">Reklam talepleri (pending/approved/rejected) burada yönetilir.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => load()}
              className="px-3 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
              disabled={loading}
            >
              {loading ? "Yükleniyor..." : "Yenile"}
            </button>

            <Link
              href="/admin/dashboard"
              className="px-3 py-2 text-xs rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700"
            >
              Admin Dashboard
            </Link>
          </div>
        </header>

        <div className="flex gap-2 flex-wrap">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                status === s
                  ? "bg-sky-700/60 border-sky-400 text-sky-50"
                  : "bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {err && (
          <div className="text-sm text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
            {err}
          </div>
        )}

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <div className="text-xs text-slate-400 mb-1">Admin Notu (opsiyonel)</div>
              <input
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Onay/ret notu (isteğe bağlı)"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none"
              />
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-1">Arama</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Başlık / paket / ID ara"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none"
              />
            </div>
          </div>

          <div className="text-sm text-slate-300">
            Kayıt: <span className="text-white font-semibold">{filtered.length}</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3">
          {filtered.length === 0 && !loading ? (
            <p className="text-slate-500 text-sm">Bu statüde kayıt yok.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => {
                const disabled = busyId === r._id;
                const title = r.title || r.adTitle || r.packageName || "(Başlık yok)";
                const countries = Array.isArray(r.countryTargets) ? r.countryTargets.join(", ") : "-";
                const geoInfo =
                  r.geoLevel ? `${r.geoLevel}${Array.isArray(r.geoTargets) && r.geoTargets.length ? `: ${r.geoTargets.join(", ")}` : ""}` : "-";

                return (
                  <div key={r._id} className="bg-slate-950/50 border border-slate-800 rounded-lg p-3">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{title}</p>
                          <StatusPill status={String(r.status || status)} />
                        </div>

                        <p className="text-xs text-slate-400 mt-1">
                          ID: <span className="text-slate-200">{r._id}</span>
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          Paket: <span className="text-slate-200">{r.packageName || "-"}</span> • Placement:{" "}
                          <span className="text-slate-200">{r.placementKey || "-"}</span> • Gün:{" "}
                          <span className="text-slate-200">{r.requestedDays || 0}</span>
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          Ülke: <span className="text-slate-200">{countries}</span> • Geo:{" "}
                          <span className="text-slate-200">{geoInfo}</span>
                        </p>

                        {(r.clickUrl || r.creativeUrl) && (
                          <div className="mt-2 flex flex-col gap-1 text-xs text-slate-400">
                            {r.clickUrl ? (
                              <div className="truncate">
                                Click: <span className="text-slate-200">{r.clickUrl}</span>
                              </div>
                            ) : null}
                            {r.creativeUrl ? (
                              <div className="truncate">
                                Creative: <span className="text-slate-200">{r.creativeUrl}</span>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>

                      {status === "pending" ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => doApprove(r._id)}
                            disabled={disabled}
                            className="text-xs px-3 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {disabled ? "İşleniyor..." : "Approve"}
                          </button>

                          <button
                            type="button"
                            onClick={() => doReject(r._id)}
                            disabled={disabled}
                            className="text-xs px-3 py-2 rounded-lg bg-red-500 text-slate-950 font-semibold hover:bg-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
