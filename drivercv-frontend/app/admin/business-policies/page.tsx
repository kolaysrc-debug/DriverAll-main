"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/api/_core";
import { clearSession } from "@/lib/session";

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json", ...authHeaders() };
}

type Policy = {
  _id?: string;
  country: string;
  businessType: string;
  restricted: boolean;
  requiredGeoLevel: "country" | "province" | "district" | "geoGroup";
  allowGeoGroups: boolean;
  note?: string;
  active: boolean;
  sortOrder: number;
};

const businessTypes: Policy["businessType"][] = [
  "DRIVING_SCHOOL",
  "SRC_CENTER",
  "SRC5_CENTER",
  "PSIKOTEKNIK",
  "LOGISTICS",
  "OTHER",
];

const geoLevels: Policy["requiredGeoLevel"][] = [
  "district",
  "province",
  "country",
  "geoGroup",
];

export default function AdminBusinessPoliciesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function handleAuthFailure(message: string) {
    clearSession();
    window.dispatchEvent(new Event("driverall-auth-changed"));
    setErr(message || "Oturum geçersiz. Lütfen tekrar giriş yapın.");
    router.replace("/register/auth");
  }

  const [country, setCountry] = useState("TR");
  const [list, setList] = useState<Policy[]>([]);

  const [form, setForm] = useState<Policy>({
    country: "TR",
    businessType: "PSIKOTEKNIK",
    restricted: true,
    requiredGeoLevel: "district",
    allowGeoGroups: true,
    note: "",
    active: true,
    sortOrder: 0,
  });

  const load = async () => {
    setLoading(true);
    setErr(null);
    setInfo(null);
    try {
      const cc = String(country || "TR").toUpperCase();
      const res = await fetch(`/api/admin/business-policies?country=${encodeURIComponent(cc)}`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Liste alınamadı");

      const items: Policy[] = Array.isArray(data?.list) ? data.list : [];
      setList(items);
    } catch (e: any) {
      setErr(e?.message || "Hata");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  const sorted = useMemo(() => {
    const arr = Array.isArray(list) ? [...list] : [];
    arr.sort((a, b) => {
      const so = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
      if (so !== 0) return so;
      return String(a.businessType || "").localeCompare(String(b.businessType || ""), "tr");
    });
    return arr;
  }, [list]);

  const upsert = async () => {
    setErr(null);
    setInfo(null);
    try {
      const body: any = {
        country: String(form.country || country || "TR").toUpperCase(),
        businessType: String(form.businessType || "").trim(),
        restricted: !!form.restricted,
        requiredGeoLevel: String(form.requiredGeoLevel || "district"),
        allowGeoGroups: form.allowGeoGroups !== false,
        note: String(form.note || ""),
        active: form.active !== false,
        sortOrder: Number(form.sortOrder || 0) || 0,
      };

      if (!body.businessType) throw new Error("businessType zorunlu");

      const res = await fetch("/api/admin/business-policies", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        return handleAuthFailure(data?.message || `HTTP ${res.status}: Oturum geçersiz`);
      }
      if (!res.ok) throw new Error(data?.message || "Kaydedilemedi");

      setInfo("Policy kaydedildi.");
      setForm((prev) => ({ ...prev, country: body.country }));
      await load();
    } catch (e: any) {
      setErr(e?.message || "Hata");
    }
  };

  const loadToForm = (p: Policy) => {
    setForm({
      country: String(p.country || country || "TR").toUpperCase(),
      businessType: String(p.businessType || "OTHER"),
      restricted: !!p.restricted,
      requiredGeoLevel: (p.requiredGeoLevel as any) || "district",
      allowGeoGroups: p.allowGeoGroups !== false,
      note: String(p.note || ""),
      active: p.active !== false,
      sortOrder: Number(p.sortOrder || 0) || 0,
    });
    setInfo(null);
    setErr(null);
  };

  return (
    <AdminOnly>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 text-slate-200">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">Business Policies</h1>
            <div className="text-xs text-slate-400">
              İş tipine göre reklam hedefleme kısıtları (district/province/country).
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div>
              <div className="mb-1 text-[11px] text-slate-400">country</div>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
                placeholder="TR"
              />
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-3 text-sm font-semibold">Policy Tanımla / Güncelle</div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-slate-400">country</div>
                <input
                  value={form.country}
                  onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-400">businessType</div>
                <select
                  value={form.businessType}
                  onChange={(e) => setForm((p) => ({ ...p, businessType: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                >
                  {businessTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.restricted}
                    onChange={(e) => setForm((p) => ({ ...p, restricted: e.target.checked }))}
                  />
                  <span>Kısıtlı (restricted)</span>
                </label>
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">requiredGeoLevel</div>
                <select
                  value={form.requiredGeoLevel}
                  onChange={(e) => setForm((p) => ({ ...p, requiredGeoLevel: e.target.value as any }))}
                  disabled={!form.restricted}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm disabled:opacity-50"
                >
                  {geoLevels.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.allowGeoGroups}
                    onChange={(e) => setForm((p) => ({ ...p, allowGeoGroups: e.target.checked }))}
                    disabled={!form.restricted}
                  />
                  <span>GeoGroup serbest (allowGeoGroups)</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                  />
                  <span>Aktif</span>
                </label>
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">sortOrder</div>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value || 0) }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <div className="mb-1 text-xs text-slate-400">note</div>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm min-h-[90px]"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={upsert}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Kaydet
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Mevcut Policy’ler</div>
              <div className="text-xs text-slate-400">{sorted.length} kayıt</div>
            </div>

            {loading ? (
              <div className="text-sm text-slate-400">Yükleniyor…</div>
            ) : sorted.length === 0 ? (
              <div className="text-sm text-slate-400">Kayıt yok.</div>
            ) : (
              <div className="space-y-2">
                {sorted.map((p) => (
                  <button
                    key={String(p._id || `${p.country}-${p.businessType}`)}
                    type="button"
                    onClick={() => loadToForm(p)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-left hover:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-slate-100">
                        {p.businessType}
                        <span className="ml-2 text-xs text-slate-500">({p.country})</span>
                      </div>
                      <div className="text-xs text-slate-400">sort: {Number(p.sortOrder || 0)}</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      restricted: {String(!!p.restricted)}
                      {p.restricted ? ` • requiredGeoLevel: ${p.requiredGeoLevel}` : ` • allowGeoGroups: ${String(p.allowGeoGroups !== false)}`}
                      {` • active: ${String(p.active !== false)}`}
                    </div>
                    {p.note ? <div className="mt-1 text-xs text-slate-500">{p.note}</div> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
