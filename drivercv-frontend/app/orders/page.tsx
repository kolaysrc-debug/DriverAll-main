"use client";

// PATH: DriverAll-main/drivercv-frontend/app/orders/page.tsx

import React, { useEffect, useState } from "react";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function OrdersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const t = getToken();
      if (!t) {
        setItems([]);
        setErr("Giriş yapmalısınız.");
        return;
      }
      const res = await fetch("/api/orders/mine", { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Siparişler alınamadı");
      setItems(data.orders || []);
    } catch (e: any) {
      setErr(e?.message || "Hata");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-100">Siparişlerim</h1>
        <p className="text-sm text-slate-400">Paket satın alma order’larınız.</p>
      </div>

      {err && (
        <div className="mb-3 text-sm text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
          {err}
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
                    <div className="text-xs text-slate-400 mt-1">
                      creditsRemaining: job={o?.creditsRemaining?.jobCount || 0} ad={o?.creditsRemaining?.adCount || 0}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                  </div>
                </div>

                {o.adminNote ? <div className="text-xs text-slate-500 mt-2">Admin Note: {o.adminNote}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
