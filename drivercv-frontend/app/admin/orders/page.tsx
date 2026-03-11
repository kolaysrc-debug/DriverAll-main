"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/api/_core";

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json", ...authHeaders() };
}

type CreditsRemaining = {
  adCount?: number;
  jobCount?: number;
  jobPostCount?: number;
  cvViewCount?: number;
  cvSaveCount?: number;
};

type OrderRow = {
  _id: string;
  buyerUserId?: string;
  packageId?: string;
  paymentStatus?: string;
  orderStatus?: string;
  paidAt?: string | null;
  expiresAt?: string | null;
  creditsRemaining?: CreditsRemaining;
  packageSnapshot?: any;
  adminNote?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function AdminOrdersPage() {
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

  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [orderStatus, setOrderStatus] = useState<string>("");

  const [items, setItems] = useState<OrderRow[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const editingOrder = useMemo(
    () => items.find((x) => x._id === editingId) || null,
    [items, editingId]
  );

  const [editExpiresAt, setEditExpiresAt] = useState<string>("");
  const [editAdCount, setEditAdCount] = useState<string>("");
  const [editJobCount, setEditJobCount] = useState<string>("");
  const [editJobPost, setEditJobPost] = useState<string>("");
  const [editCvView, setEditCvView] = useState<string>("");
  const [editCvSave, setEditCvSave] = useState<string>("");
  const [editAdminNote, setEditAdminNote] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setErr(null);
    setInfo(null);
    try {
      const qs = new URLSearchParams();
      if (paymentStatus) qs.set("paymentStatus", paymentStatus);
      if (orderStatus) qs.set("orderStatus", orderStatus);

      const res = await fetch(`/api/admin/orders?${qs.toString()}`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Siparişler alınamadı");

      setItems(Array.isArray(data.orders) ? data.orders : []);
    } catch (e: any) {
      setErr(e?.message || "Hata");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshSnapshot = async (o: OrderRow, opts?: { overwriteCredits?: boolean }) => {
    const overwriteCredits = opts?.overwriteCredits === true;
    const ok = confirm(
      overwriteCredits
        ? "Bu siparişin paket snapshot'ını güncelleyip KALAN HAKLARI da pakete göre sıfırlamak istiyor musunuz?"
        : "Bu siparişin paket snapshot'ını güncel paketten yenilemek istiyor musunuz?"
    );
    if (!ok) return;

    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(o._id)}/refresh-snapshot`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify({ overwriteCredits }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Snapshot yenilenemedi");

      setInfo(overwriteCredits ? "Snapshot + haklar güncellendi." : "Snapshot güncellendi.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Hata");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const beginEdit = (o: OrderRow) => {
    setEditingId(o._id);
    setEditExpiresAt(o.expiresAt ? String(o.expiresAt).slice(0, 10) : "");
    setEditAdCount(String(o?.creditsRemaining?.adCount ?? ""));
    setEditJobCount(String(o?.creditsRemaining?.jobCount ?? ""));
    setEditJobPost(String(o?.creditsRemaining?.jobPostCount ?? ""));
    setEditCvView(String(o?.creditsRemaining?.cvViewCount ?? ""));
    setEditCvSave(String(o?.creditsRemaining?.cvSaveCount ?? ""));
    setEditAdminNote(String(o?.adminNote || ""));
    setErr(null);
    setInfo(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setErr(null);
    setInfo(null);

    try {
      const body: any = {
        expiresAt: editExpiresAt ? `${editExpiresAt}T00:00:00.000Z` : null,
        creditsRemaining: {
          adCount: editAdCount === "" ? undefined : Number(editAdCount || 0),
          jobCount: editJobCount === "" ? undefined : Number(editJobCount || 0),
          jobPostCount: editJobPost === "" ? undefined : Number(editJobPost || 0),
          cvViewCount: editCvView === "" ? undefined : Number(editCvView || 0),
          cvSaveCount: editCvSave === "" ? undefined : Number(editCvSave || 0),
        },
        adminNote: editAdminNote,
      };

      const res = await fetch(`/api/admin/orders/${encodeURIComponent(editingId)}`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Güncellenemedi");

      setInfo("Sipariş güncellendi.");
      setEditingId(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Güncelleme hatası");
    }
  };

  const markPaid = async (o: OrderRow) => {
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(o._id)}/mark-paid`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify({
          expiresAt: o.expiresAt || null,
          creditsRemaining: {
            adCount: o?.creditsRemaining?.adCount,
            jobCount: o?.creditsRemaining?.jobCount,
            jobPostCount: o?.creditsRemaining?.jobPostCount,
            cvViewCount: o?.creditsRemaining?.cvViewCount,
            cvSaveCount: o?.creditsRemaining?.cvSaveCount,
          },
          adminNote: o.adminNote || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Onaylanamadı");
      setInfo("Sipariş paid+active yapıldı.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Hata");
    }
  };

  const expire = async (o: OrderRow) => {
    if (!confirm("Bu siparişi expired yapmak istiyor musunuz?") ) return;
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(o._id)}/expire`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify({ adminNote: o.adminNote || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Expire yapılamadı");
      setInfo("Sipariş expired yapıldı.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Hata");
    }
  };

  const cancel = async (o: OrderRow) => {
    if (!confirm("Bu siparişi cancelled yapmak istiyor musunuz?") ) return;
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(o._id)}/cancel`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify({ adminNote: o.adminNote || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Cancel yapılamadı");
      setInfo("Sipariş cancelled yapıldı.");
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
            <h1 className="text-xl font-bold text-slate-50">Siparişler</h1>
            <div className="text-xs text-slate-400">PackageOrder yönetimi (onay/aktif et, süre ve hak düzenle)</div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div>
              <div className="mb-1 text-[11px] text-slate-400">paymentStatus</div>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="">(hepsi)</option>
                <option value="unpaid">unpaid</option>
                <option value="paid">paid</option>
                <option value="failed">failed</option>
                <option value="refunded">refunded</option>
              </select>
            </div>
            <div>
              <div className="mb-1 text-[11px] text-slate-400">orderStatus</div>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="">(hepsi)</option>
                <option value="created">created</option>
                <option value="active">active</option>
                <option value="exhausted">exhausted</option>
                <option value="expired">expired</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
            <button
              onClick={load}
              className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
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
        {info && (
          <div className="mb-3 rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
            {info}
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-950">
          {loading ? (
            <div className="p-4 text-sm text-slate-400">Yükleniyor…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-slate-400">Sipariş yok.</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-950/90 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Sipariş</th>
                    <th className="px-3 py-2">Durum</th>
                    <th className="px-3 py-2">Haklar</th>
                    <th className="px-3 py-2">Bitiş</th>
                    <th className="px-3 py-2 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((o) => (
                    <tr key={o._id} className="border-t border-slate-800">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-100">
                          {String(o?.packageSnapshot?.name || "Paket")}
                        </div>
                        <div className="text-xs text-slate-500">orderId: {o._id}</div>
                        <div className="text-xs text-slate-500">buyer: {String(o.buyerUserId || "")}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-300">
                        <div>payment: {String(o.paymentStatus || "")}</div>
                        <div>status: {String(o.orderStatus || "")}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-300">
                        <div>reklam: {Number((o as any)?.creditsRemaining?.adCount || 0)}</div>
                        <div>job: {Number((o as any)?.creditsRemaining?.jobCount || 0)}</div>
                        <div>ilan: {Number(o?.creditsRemaining?.jobPostCount || 0)}</div>
                        <div>cv view: {Number(o?.creditsRemaining?.cvViewCount || 0)}</div>
                        <div>cv save: {Number(o?.creditsRemaining?.cvSaveCount || 0)}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-300">
                        {o.expiresAt ? String(o.expiresAt).slice(0, 10) : "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex flex-wrap justify-end gap-2 text-xs">
                          <button
                            onClick={() => beginEdit(o)}
                            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 hover:bg-slate-800"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => refreshSnapshot(o)}
                            className="rounded-md border border-sky-700 bg-sky-950/30 px-3 py-1.5 text-sky-200 hover:bg-sky-900/30"
                          >
                            Snapshot
                          </button>
                          <button
                            onClick={() => markPaid(o)}
                            className="rounded-md border border-emerald-700 bg-emerald-950/30 px-3 py-1.5 text-emerald-200 hover:bg-emerald-900/30"
                          >
                            Paid+Active
                          </button>
                          <button
                            onClick={() => expire(o)}
                            className="rounded-md border border-amber-700 bg-amber-950/30 px-3 py-1.5 text-amber-200 hover:bg-amber-900/30"
                          >
                            Expire
                          </button>
                          <button
                            onClick={() => cancel(o)}
                            className="rounded-md border border-rose-700 bg-rose-950/30 px-3 py-1.5 text-rose-200 hover:bg-rose-900/30"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {editingOrder && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Düzenle: {editingOrder._id}</div>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs hover:bg-slate-800"
              >
                Kapat
              </button>
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => refreshSnapshot(editingOrder)}
                className="rounded-md border border-sky-700 bg-sky-950/30 px-3 py-1.5 text-xs text-sky-200 hover:bg-sky-900/30"
              >
                Snapshot Yenile
              </button>
              <button
                type="button"
                onClick={() => refreshSnapshot(editingOrder, { overwriteCredits: true })}
                className="rounded-md border border-amber-700 bg-amber-950/30 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-900/30"
              >
                Snapshot + Hakları Sıfırla
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-slate-400">Bitiş tarihi (YYYY-MM-DD)</div>
                <input
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                  placeholder="2026-12-31"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">Reklam hakkı (adCount)</div>
                <input
                  type="number"
                  value={editAdCount}
                  onChange={(e) => setEditAdCount(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">İlan sayısı (jobCount)</div>
                <input
                  type="number"
                  value={editJobCount}
                  onChange={(e) => setEditJobCount(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">İlan hakkı (jobPostCount)</div>
                <input
                  type="number"
                  value={editJobPost}
                  onChange={(e) => setEditJobPost(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">CV görüntüleme (cvViewCount)</div>
                <input
                  type="number"
                  value={editCvView}
                  onChange={(e) => setEditCvView(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">CV kayıt (cvSaveCount)</div>
                <input
                  type="number"
                  value={editCvSave}
                  onChange={(e) => setEditCvSave(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <div className="mb-1 text-xs text-slate-400">Admin notu</div>
                <textarea
                  value={editAdminNote}
                  onChange={(e) => setEditAdminNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm min-h-[90px]"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={saveEdit}
                className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
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
