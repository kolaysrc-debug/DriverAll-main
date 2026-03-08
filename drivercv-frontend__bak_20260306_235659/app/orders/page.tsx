"use client";

// PATH: DriverAll-main/drivercv-frontend/app/orders/page.tsx

import React, { useEffect, useMemo, useState } from "react";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json", ...authHeaders() };
}

export default function OrdersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");
  const [busyOrderId, setBusyOrderId] = useState<string>("");

  useEffect(() => {
    try {
      const rawUser = typeof window !== "undefined" ? window.localStorage.getItem("user") : null;
      const user = rawUser ? JSON.parse(rawUser) : null;
      setRole(String(user?.role || "").trim().toLowerCase());
    } catch {
      setRole("");
    }
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    setInfo(null);
    try {
      const t = getToken();
      if (!t) {
        setItems([]);
        setPayments([]);
        setErr("Giriş yapmalısınız.");
        return;
      }

      const [resOrders, resPayments] = await Promise.all([
        fetch("/api/orders/mine", { headers: authHeaders() }),
        fetch("/api/payments/mine", { headers: authHeaders() }),
      ]);

      const dataOrders = await resOrders.json().catch(() => ({}));
      if (!resOrders.ok) throw new Error(dataOrders?.message || "Siparişler alınamadı");
      setItems(dataOrders.orders || []);

      const dataPayments = await resPayments.json().catch(() => ({}));
      if (resPayments.ok) {
        setPayments(Array.isArray(dataPayments.payments) ? dataPayments.payments : []);
      } else {
        setPayments([]);
      }
    } catch (e: any) {
      setErr(e?.message || "Hata");
      setItems([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  const paymentByOrderId = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of payments || []) {
      const oid = String(p?.orderId || "");
      if (!oid) continue;
      const prev = map.get(oid);
      if (!prev) {
        map.set(oid, p);
        continue;
      }
      const prevTime = prev?.createdAt ? new Date(prev.createdAt).getTime() : 0;
      const nextTime = p?.createdAt ? new Date(p.createdAt).getTime() : 0;
      if (nextTime >= prevTime) map.set(oid, p);
    }
    return map;
  }, [payments]);

  async function notifyEft(order: any) {
    const orderId = String(order?._id || "");
    if (!orderId) return;

    const existing = paymentByOrderId.get(orderId);
    const existingStatus = String(existing?.status || "");
    if (existing && ["pending", "approved"].includes(existingStatus)) {
      setInfo(existingStatus === "approved" ? "Bu sipariş için ödeme zaten onaylanmış." : "Bu sipariş için bekleyen bir EFT bildirimi var.");
      return;
    }

    const providerRef = window.prompt("Dekont No / Açıklama (opsiyonel)", "") || "";
    setBusyOrderId(orderId);
    setErr(null);
    setInfo(null);
    try {
      const idempotencyKey = `manual_eft:${orderId}`;
      const res = await fetch(`/api/payments/orders/${encodeURIComponent(orderId)}/manual-eft`, {
        method: "POST",
        headers: { ...jsonHeaders(), "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ providerRef, idempotencyKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "EFT bildirimi oluşturulamadı");
      setInfo("EFT/Havale bildirimi alındı. Onay sonrası paketiniz aktive edilecek.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Hata");
    } finally {
      setBusyOrderId("");
    }
  }

  useEffect(() => {
    if (!role) return;
    if (role === "driver") {
      setLoading(false);
      setErr(null);
      setItems([]);
      return;
    }
    load();
  }, [role]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-100">
          {role === "driver" ? "Kurs / Hizmet Al" : "Siparişlerim"}
        </h1>
        <p className="text-sm text-slate-400">
          {role === "driver"
            ? "Yakındaki işletmelerden kurs veya hizmet al (yakında)."
            : "Paket satın alma order’larınız."}
        </p>
      </div>

      {role === "driver" ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <div className="text-sm text-slate-200 font-semibold">Not</div>
          <div className="mt-2 text-sm text-slate-400">
            Bu alan ileride sürücülerin yakındaki işletmelerden (kurs, belge yenileme, eğitim vb.) hizmet alması için
            kullanılacak.
          </div>
        </div>
      ) : null}

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
          <p className="text-slate-400 text-sm">Sipariş yok.</p>
        ) : (
          <div className="space-y-2">
            {items.map((o) => (
              <div key={o._id} className="border border-slate-800 rounded-lg p-3 bg-slate-950/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-100">
                      {o?.packageSnapshot?.name || "Package"}{" "}
                      <span className="text-xs text-slate-500">({o?.packageSnapshot?.code || ""})</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      payment: {o.paymentStatus} • status: {o.orderStatus}
                    </div>

                    {(() => {
                      const p = paymentByOrderId.get(String(o._id));
                      if (!p) return null;
                      return (
                        <div className="text-xs text-slate-400 mt-1">
                          eft: {p.provider} • paymentTx: {p.status}
                        </div>
                      );
                    })()}
                    <div className="text-xs text-slate-400 mt-1">
                      creditsRemaining: job={o?.creditsRemaining?.jobCount || 0} ad={o?.creditsRemaining?.adCount || 0}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                  </div>
                </div>

                {String(o?.paymentStatus || "") !== "paid" ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => notifyEft(o)}
                      disabled={busyOrderId === String(o._id)}
                      className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs disabled:opacity-50"
                    >
                      {busyOrderId === String(o._id) ? "Gönderiliyor..." : "EFT/Havale Bildir"}
                    </button>
                    <div className="text-xs text-slate-500">
                      EFT/Havale gecikebilir; bu bildirim kontrolü hızlandırır.
                    </div>
                  </div>
                ) : null}

                {o.adminNote ? <div className="text-xs text-slate-500 mt-2">Admin Note: {o.adminNote}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
