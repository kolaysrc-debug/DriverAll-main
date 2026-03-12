"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/orders/page.tsx
// ----------------------------------------------------------
// Employer Orders — Siparişler + Ödeme Bildirimi
// - GET  /api/orders/mine
// - GET  /api/payments/mine
// - POST /api/payments/orders/:orderId/manual-eft
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import Link from "next/link";
import EmployerOnly from "@/components/EmployerOnly";
import { authHeaders } from "@/lib/api/_core";

type OrderRow = {
  _id: string;
  packageSnapshot?: {
    name?: string;
    type?: string;
    price?: number;
    currency?: string;
    credits?: {
      jobPostCount?: number;
      adCount?: number;
      cvViewCount?: number;
    };
  };
  paymentStatus?: string;
  orderStatus?: string;
  creditsRemaining?: {
    jobPostCount?: number;
    adCount?: number;
    cvViewCount?: number;
    cvSaveCount?: number;
  };
  paidAt?: string;
  expiresAt?: string;
  createdAt?: string;
};

type PaymentRow = {
  _id: string;
  orderId?: string;
  provider?: string;
  status?: string;
  amount?: number;
  currency?: string;
  providerRef?: string;
  createdAt?: string;
};

function StatusBadge({ label, variant }: { label: string; variant: "green" | "amber" | "red" | "slate" }) {
  const cls =
    variant === "green"
      ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300"
      : variant === "amber"
      ? "border-amber-800/60 bg-amber-950/40 text-amber-300"
      : variant === "red"
      ? "border-red-800/60 bg-red-950/40 text-red-300"
      : "border-slate-700 bg-slate-900/40 text-slate-400";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

function paymentStatusVariant(s: string): "green" | "amber" | "red" | "slate" {
  if (s === "paid") return "green";
  if (s === "unpaid") return "amber";
  return "red";
}

function orderStatusVariant(s: string): "green" | "amber" | "red" | "slate" {
  if (s === "active") return "green";
  if (s === "created") return "amber";
  if (s === "exhausted") return "slate";
  return "red";
}

export default function EmployerOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // EFT form
  const [eftOrderId, setEftOrderId] = useState<string | null>(null);
  const [eftRef, setEftRef] = useState("");
  const [eftBusy, setEftBusy] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [rOrders, rPayments] = await Promise.all([
        fetch("/api/orders/mine", { headers: authHeaders(), cache: "no-store" }),
        fetch("/api/payments/mine", { headers: authHeaders(), cache: "no-store" }),
      ]);

      const dOrders = await rOrders.json().catch(() => ({}));
      const dPayments = await rPayments.json().catch(() => ({}));

      if (!rOrders.ok) throw new Error(dOrders?.message || "Siparişler alınamadı");

      setOrders(Array.isArray(dOrders?.orders) ? dOrders.orders : []);
      setPayments(Array.isArray(dPayments?.payments) ? dPayments.payments : []);
    } catch (e: any) {
      setErr(e?.message || "Hata");
    } finally {
      setLoading(false);
    }
  }

  async function submitEft() {
    if (!eftOrderId) return;
    setEftBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/payments/orders/${eftOrderId}/manual-eft`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" } as any,
        body: JSON.stringify({ providerRef: eftRef.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Ödeme bildirimi başarısız");

      setInfo("Ödeme bildirimi gönderildi. Admin onayı bekleniyor.");
      setEftOrderId(null);
      setEftRef("");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Hata");
    } finally {
      setEftBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function paymentsForOrder(orderId: string) {
    return payments.filter((p) => String(p.orderId) === String(orderId));
  }

  return (
    <EmployerOnly>
      <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-8">

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Siparişlerim</h1>
            <Link
              href="/packages"
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Yeni Paket Al
            </Link>
          </div>

          {err && (
            <div className="mb-3 text-sm text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
              {err}
            </div>
          )}
          {info && (
            <div className="mb-3 text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-lg px-3 py-2">
              {info}
            </div>
          )}

          {loading ? (
            <p className="text-slate-400 text-sm">Yükleniyor…</p>
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
              <p className="text-slate-400 text-sm">Henüz siparişiniz yok.</p>
              <Link href="/packages" className="mt-3 inline-block text-sm text-sky-400 hover:underline">
                Paketlere göz at →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => {
                const snap = o.packageSnapshot || {};
                const cr = o.creditsRemaining || {};
                const ps = paymentsForOrder(o._id);
                const canPay = o.paymentStatus === "unpaid";

                return (
                  <div key={o._id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-100">{snap.name || "Paket"}</div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <StatusBadge label={o.paymentStatus || "?"} variant={paymentStatusVariant(o.paymentStatus || "")} />
                          <StatusBadge label={o.orderStatus || "?"} variant={orderStatusVariant(o.orderStatus || "")} />
                        </div>
                        <div className="text-xs text-slate-400">
                          {snap.price} {snap.currency} • {snap.type}
                        </div>
                        <div className="text-xs text-slate-500">
                          Kalan: İlan={cr.jobPostCount ?? 0} Reklam={cr.adCount ?? 0} CV={cr.cvViewCount ?? 0}
                        </div>
                        {o.expiresAt && (
                          <div className="text-xs text-slate-500">
                            Son kullanım: {new Date(o.expiresAt).toLocaleDateString("tr-TR")}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-600">
                          {new Date(o.createdAt || "").toLocaleString("tr-TR")}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {canPay && (
                          <button
                            onClick={() => setEftOrderId(eftOrderId === o._id ? null : o._id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white transition-colors"
                          >
                            Ödeme Bildir
                          </button>
                        )}
                      </div>
                    </div>

                    {/* EFT form */}
                    {eftOrderId === o._id && (
                      <div className="mt-3 border-t border-slate-800 pt-3">
                        <div className="text-xs text-slate-300 mb-2 font-medium">Manuel EFT / Havale Bildirimi</div>
                        <div className="flex flex-wrap gap-2 items-end">
                          <input
                            type="text"
                            placeholder="Dekont no / referans (opsiyonel)"
                            value={eftRef}
                            onChange={(e) => setEftRef(e.target.value)}
                            className="flex-1 min-w-[200px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
                          />
                          <button
                            onClick={submitEft}
                            disabled={eftBusy}
                            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm disabled:opacity-50 transition-colors"
                          >
                            {eftBusy ? "Gönderiliyor…" : "Gönder"}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Ödeme bildirimi admin tarafından onaylandıktan sonra paket aktif olacaktır.
                        </p>
                      </div>
                    )}

                    {/* Payments */}
                    {ps.length > 0 && (
                      <div className="mt-3 border-t border-slate-800 pt-2">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Ödeme geçmişi</div>
                        {ps.map((p) => (
                          <div key={p._id} className="flex items-center gap-2 text-xs text-slate-400 py-0.5">
                            <StatusBadge
                              label={p.status || "?"}
                              variant={p.status === "approved" ? "green" : p.status === "pending" ? "amber" : "red"}
                            />
                            <span>{p.provider}</span>
                            <span>{p.amount} {p.currency}</span>
                            {p.providerRef && <span className="text-slate-500">ref: {p.providerRef}</span>}
                            <span className="text-slate-600">{new Date(p.createdAt || "").toLocaleString("tr-TR")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </EmployerOnly>
  );
}
