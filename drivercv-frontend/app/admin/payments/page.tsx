"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/api/_core";

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json", ...authHeaders() };
}

type PaymentRow = {
  _id: string;
  orderId?: string;
  buyerUserId?: string;
  provider?: string;
  status?: string;
  amount?: number;
  currency?: string;
  providerRef?: string;
  idempotencyKey?: string;
  adminNote?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function handleAuthFailure(message: string) {
    try {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      window.dispatchEvent(new Event("driverall-auth-changed"));
    } catch {}
    setErr(message || "Oturum geçersiz. Lütfen tekrar giriş yapın.");
    router.replace("/login");
  }

  const [status, setStatus] = useState<string>("pending");
  const [provider, setProvider] = useState<string>("manual_eft");
  const [orderId, setOrderId] = useState<string>("");

  const [items, setItems] = useState<PaymentRow[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const editingPayment = useMemo(
    () => items.find((x) => x._id === editingId) || null,
    [items, editingId]
  );

  const [editAdminNote, setEditAdminNote] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setErr(null);
    setInfo(null);
    try {
      const qs = new URLSearchParams();
      if (status) qs.set("status", status);
      if (provider) qs.set("provider", provider);
      if (orderId) qs.set("orderId", orderId);

      const res = await fetch(`/api/admin/payments?${qs.toString()}`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Ödemeler alınamadı");

      setItems(Array.isArray(data.payments) ? data.payments : []);
    } catch (e: any) {
      setErr(e?.message || "Hata");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const beginEdit = (p: PaymentRow) => {
    setEditingId(p._id);
    setEditAdminNote(String(p?.adminNote || ""));
    setErr(null);
    setInfo(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const approve = async (p: PaymentRow) => {
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/admin/payments/${encodeURIComponent(p._id)}/approve`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify({ adminNote: editAdminNote }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Onaylanamadı");
      setInfo("Ödeme onaylandı ve order aktive edildi.");
      setEditingId(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Hata");
    }
  };

  const reject = async (p: PaymentRow) => {
    if (!confirm("Bu ödemeyi reddetmek istiyor musunuz?") ) return;
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/admin/payments/${encodeURIComponent(p._id)}/reject`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify({ adminNote: editAdminNote }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Reddedilemedi");
      setInfo("Ödeme reddedildi.");
      setEditingId(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Hata");
    }
  };

  return (
    <AdminOnly>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 text-slate-200">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">Ödemeler</h1>
            <div className="text-xs text-slate-400">PaymentTransaction (ledger) yönetimi</div>
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
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>

            <div>
              <div className="mb-1 text-[11px] text-slate-400">provider</div>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="">(hepsi)</option>
                <option value="manual_eft">manual_eft</option>
                <option value="iyzico">iyzico</option>
              </select>
            </div>

            <div>
              <div className="mb-1 text-[11px] text-slate-400">orderId</div>
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
                placeholder="(opsiyonel)"
              />
            </div>

            <button
              onClick={load}
              className="rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 text-xs"
            >
              Yenile
            </button>
          </div>
        </div>

        {err && (
          <div className="mb-3 text-sm text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
            {err}
          </div>
        )}
        {info && (
          <div className="mb-3 text-sm text-emerald-200 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2">
            {info}
          </div>
        )}

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3">
          {loading ? (
            <p className="text-slate-400 text-sm">Yükleniyor…</p>
          ) : items.length === 0 ? (
            <p className="text-slate-400 text-sm">Kayıt yok.</p>
          ) : (
            <div className="space-y-2">
              {items.map((p) => (
                <div key={p._id} className="border border-slate-800 rounded-lg p-3 bg-slate-950/40">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-100">
                        {p.provider || "provider"} • {p.status || "status"}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        orderId: <span className="text-slate-300">{p.orderId || "-"}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        amount: <span className="text-slate-300">{Number(p.amount || 0)} {p.currency || ""}</span>
                        {p.providerRef ? (
                          <span className="text-slate-500"> • ref: {p.providerRef}</span>
                        ) : null}
                      </div>
                      {p.adminNote ? <div className="text-xs text-slate-500 mt-2">Admin Note: {p.adminNote}</div> : null}
                    </div>

                    <div className="text-xs text-slate-500">
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <button
                      onClick={() => beginEdit(p)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
                    >
                      İşlem
                    </button>

                    {editingId === p._id ? (
                      <div className="flex flex-1 flex-wrap items-end gap-2">
                        <div className="flex-1 min-w-[240px]">
                          <div className="mb-1 text-[11px] text-slate-400">adminNote</div>
                          <input
                            value={editAdminNote}
                            onChange={(e) => setEditAdminNote(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
                          />
                        </div>

                        <button
                          disabled={!editingPayment || (p.status !== "pending")}
                          onClick={() => approve(p)}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={!editingPayment || (p.status !== "pending")}
                          onClick={() => reject(p)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs"
                        >
                          Kapat
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminOnly>
  );
}
