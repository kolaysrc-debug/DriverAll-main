"use client";

// PATH: DriverAll-main/drivercv-frontend/app/packages/page.tsx

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/api/_core";
import { getToken } from "@/lib/session";

export default function PackagesPage() {
  const router = useRouter();
  const [type, setType] = useState<"JOB" | "AD">("JOB");
  const [country, setCountry] = useState("TR");

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/packages?type=${type}&country=${country}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Paketler alınamadı");
      setItems(data.packages || []);
    } catch (e: any) {
      setErr(e?.message || "Hata");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function buy(id: string) {
    const t = getToken();
    if (!t) {
      router.push("/register/auth");
      return;
    }

    const ok = confirm("Bu paketi satın almak (order oluşturmak) istiyor musunuz?\nNot: Ödeme şimdilik admin tarafından manuel onaylanacak.");
    if (!ok) return;

    const res = await fetch(`/api/packages/${id}/buy`, { method: "POST", headers: authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.message || "Satın alma başarısız");
      return;
    }

    alert("Order oluşturuldu! Ödeme bilgisi gönderebilirsiniz.");
    router.push("/employer/dashboard");
  }

  useEffect(() => {
    load();
  }, [type, country]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-100">Paketler</h1>
        <p className="text-sm text-slate-400">İlan/Reklam paketleri (satın alma için order oluşturur).</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <select
          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as any)}
        >
          <option value="JOB">JOB</option>
          <option value="AD">AD</option>
        </select>

        <select
          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-sm"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="TR">TR</option>
          <option value="DE">DE</option>
          <option value="NL">NL</option>
          <option value="NO">NO</option>
          <option value="FI">FI</option>
          <option value="ES">ES</option>
          <option value="IT">IT</option>
          <option value="HU">HU</option>
        </select>

        <button
          className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm"
          onClick={load}
        >
          Yenile
        </button>
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
          <p className="text-slate-400 text-sm">Bu filtrelerde paket yok.</p>
        ) : (
          <div className="space-y-2">
            {items.map((p) => (
              <div key={p._id} className="border border-slate-800 rounded-lg p-3 bg-slate-950/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-100">{p.name}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {p.type} • {p.country} • {p.price} {p.currency}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Kredi: İlan={p?.credits?.jobPostCount || p?.credits?.jobCount || 0} Reklam={p?.credits?.adCount || 0} CV={p?.credits?.cvViewCount || 0}
                    </div>
                    {p.description ? <div className="text-xs text-slate-500 mt-2">{p.description}</div> : null}
                  </div>

                  <button
                    onClick={() => buy(p._id)}
                    className="text-xs px-2 py-2 rounded bg-slate-800 hover:bg-slate-700"
                  >
                    Satın Al
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
