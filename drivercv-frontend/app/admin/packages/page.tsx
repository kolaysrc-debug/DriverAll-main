"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/packages/page.tsx

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AdminOnly from "@/components/AdminOnly";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/api/_core";
import { clearSession } from "@/lib/session";

export default function AdminPackagesPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState<"all" | "1" | "0">("all");
  const [type, setType] = useState<string>("");
  const [country, setCountry] = useState<string>("");

  const handleAuthFailure = (message?: string) => {
    clearSession();
    setErr(message || "Oturum geçersiz. Lütfen tekrar giriş yapın.");
    router.replace("/register/auth");
  };

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (active !== "all") params.set("active", active);
      if (type) params.set("type", type);
      if (country) params.set("country", country);
      const qs = params.toString();
      const url = qs ? `/api/admin/packages?${qs}` : "/api/admin/packages";

      const res = await fetch(url, { headers: authHeaders() });

      if (res.status === 401 || res.status === 403) {
        const data = await res.json().catch(() => ({}));
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }

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

  async function softDelete(id: string) {
    const ok = confirm("Bu paketi pasife alıp silinmiş işaretlemek istiyor musunuz?");
    if (!ok) return;
    const res = await fetch(`/api/admin/packages/${id}`, { method: "DELETE", headers: authHeaders() });

    if (res.status === 401 || res.status === 403) {
      const data = await res.json().catch(() => ({}));
      return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.message || "Silinemedi");
      return;
    }
    await load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, type, country]);

  return (
    <AdminOnly>
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Paketler</h1>
            <p className="text-sm text-slate-400">İlan/Reklam paketlerini buradan yönetirsiniz.</p>
          </div>
          <Link
            href="/admin/packages/new"
            className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm"
          >
            + Yeni Paket
          </Link>
        </div>

        {err && (
          <div className="mb-3 text-sm text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
            {err}
          </div>
        )}

        <div className="mb-3 bg-slate-900/40 border border-slate-800 rounded-xl p-3">
          <div className="grid gap-2 md:grid-cols-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">Active</div>
              <select
                value={active}
                onChange={(e) => setActive(e.target.value as any)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none text-slate-100"
              >
                <option value="all">all</option>
                <option value="1">active</option>
                <option value="0">inactive</option>
              </select>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Type</div>
              <select
                value={type}
                onChange={(e) => setType(String(e.target.value || "").toUpperCase())}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none text-slate-100"
              >
                <option value="">all</option>
                <option value="JOB">JOB</option>
                <option value="AD">AD</option>
                <option value="BOTH">BOTH</option>
              </select>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Country</div>
              <input
                value={country}
                onChange={(e) => setCountry(String(e.target.value || "").toUpperCase())}
                placeholder="TR / ALL / ..."
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none text-slate-100"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setActive("all");
                  setType("");
                  setCountry("");
                }}
                className="w-full px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs"
              >
                Filtreleri Sıfırla
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3">
          {loading ? (
            <p className="text-slate-400 text-sm">Yükleniyor…</p>
          ) : items.length === 0 ? (
            <p className="text-slate-400 text-sm">Paket yok.</p>
          ) : (
            <div className="space-y-2">
              {items.map((p) => (
                <div key={p._id} className="border border-slate-800 rounded-lg p-3 bg-slate-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-100">
                        {p.name}{" "}
                        <span className="text-xs text-slate-500">({p.code})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        type: {p.type} • country: {p.country} • active: {String(p.active)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        price: {p.price} {p.currency} • credits: job={p?.credits?.jobCount || 0} ad={p?.credits?.adCount || 0}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/admin/packages/${p._id}`}
                        className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
                      >
                        Düzenle
                      </Link>
                      <button
                        onClick={() => softDelete(p._id)}
                        className="text-xs px-2 py-1 rounded bg-red-950/40 border border-red-800/60 hover:bg-red-950"
                      >
                        Sil/Pasif
                      </button>
                    </div>
                  </div>

                  {p.description ? (
                    <div className="text-xs text-slate-500 mt-2">{p.description}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminOnly>
  );
}
