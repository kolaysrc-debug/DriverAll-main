"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/packages/[id]/page.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminOnly from "@/components/AdminOnly";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}

function jsonHeaders(): HeadersInit {
  const t = getToken();
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

type FormState = {
  type: "JOB" | "AD" | "BOTH";
  productKey: string;
  purchaseType: "subscription" | "one_time";
  billingCycleMonths: string;
  name: string;
  code: string;
  description: string;
  country: string;
  currency: string;
  price: number;

  jobCount: number;
  adCount: number;
  jobPostCount: number;
  cvViewCount: number;
  cvSaveCount: number;

  requiresApproval: boolean;
  allowedPlacementsCsv: string;
  maxDurationJson: string;
  configJson: string;
  listingDays: number;
  homeDays: number;

  active: boolean;
};

function safeCsv(arr: any): string {
  const a = Array.isArray(arr) ? arr : [];
  return a.map((x) => String(x || "").trim()).filter(Boolean).join(",");
}

export default function AdminPackageEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = useMemo(() => String((params as any)?.id || "").trim(), [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    type: "JOB",
    productKey: "",
    purchaseType: "one_time",
    billingCycleMonths: "",
    name: "",
    code: "",
    description: "",
    country: "ALL",
    currency: "TRY",
    price: 0,

    jobCount: 0,
    adCount: 0,
    jobPostCount: 0,
    cvViewCount: 0,
    cvSaveCount: 0,

    requiresApproval: true,
    allowedPlacementsCsv: "",
    maxDurationJson: "{}",
    configJson: "{}",
    listingDays: 0,
    homeDays: 0,

    active: true,
  });

  async function load() {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/packages/${encodeURIComponent(id)}`, {
        headers: jsonHeaders(),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Paket alınamadı");

      const p = data?.package || {};
      const credits = p?.credits || {};
      const rules = p?.rules || {};
      const config = p?.config || {};

      let maxDurationText = "{}";
      try {
        maxDurationText = JSON.stringify(rules?.maxDurationDaysByPlacement || {}, null, 0);
      } catch {
        maxDurationText = "{}";
      }

      let configText = "{}";
      try {
        configText = JSON.stringify(config || {}, null, 2);
      } catch {
        configText = "{}";
      }

      setForm({
        type: (String(p.type || "JOB").toUpperCase() as any) || "JOB",
        productKey: String(p.productKey || ""),
        purchaseType: (String(p.purchaseType || "one_time") === "subscription" ? "subscription" : "one_time") as any,
        billingCycleMonths:
          p.billingCycleMonths == null ? "" : String(Number(p.billingCycleMonths) || ""),
        name: String(p.name || ""),
        code: String(p.code || ""),
        description: String(p.description || ""),
        country: String(p.country || "ALL"),
        currency: String(p.currency || "TRY"),
        price: Number(p.price || 0),

        jobCount: Number(credits.jobCount || 0),
        adCount: Number(credits.adCount || 0),
        jobPostCount: Number(credits.jobPostCount || 0),
        cvViewCount: Number(credits.cvViewCount || 0),
        cvSaveCount: Number(credits.cvSaveCount || 0),

        requiresApproval: rules?.requiresApproval !== false,
        allowedPlacementsCsv: safeCsv(rules?.allowedPlacements),
        maxDurationJson: maxDurationText,
        configJson: configText,
        listingDays: Number(rules?.listingDays || 0),
        homeDays: Number(rules?.homeDays || 0),

        active: p.active !== false,
      });
    } catch (e: any) {
      setErr(e?.message || "Hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function save() {
    if (!id) return;
    if (saving) return;

    setErr(null);

    let maxDuration: any = {};
    try {
      maxDuration = JSON.parse(form.maxDurationJson || "{}");
    } catch {
      setErr("MaxDuration JSON hatalı. Örn: {\"HOME_BAR_1\":3}");
      return;
    }

    let config: any = {};
    try {
      config = JSON.parse(form.configJson || "{}");
    } catch {
      setErr("Config JSON hatalı. Örn: {\"contactAccess\":\"unlock\"}");
      return;
    }

    const payload = {
      type: form.type,
      productKey: form.productKey,
      purchaseType: form.purchaseType,
      billingCycleMonths: form.billingCycleMonths === "" ? null : Number(form.billingCycleMonths),
      name: form.name,
      code: form.code,
      description: form.description,
      country: form.country,
      currency: form.currency,
      price: Number(form.price || 0),
      credits: {
        jobCount: Number(form.jobCount || 0),
        adCount: Number(form.adCount || 0),
        jobPostCount: Number(form.jobPostCount || 0),
        cvViewCount: Number(form.cvViewCount || 0),
        cvSaveCount: Number(form.cvSaveCount || 0),
      },
      rules: {
        requiresApproval: form.requiresApproval !== false,
        allowedPlacements: String(form.allowedPlacementsCsv || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        maxDurationDaysByPlacement: maxDuration,
        listingDays: Number(form.listingDays || 0),
        homeDays: Number(form.homeDays || 0),
      },
      config,
      active: Boolean(form.active),
    };

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/packages/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Kaydedilemedi");
      router.replace("/admin/packages");
    } catch (e: any) {
      setErr(e?.message || "Hata");
    } finally {
      setSaving(false);
    }
  }

  async function softDelete() {
    if (!id) return;
    const ok = window.confirm("Bu paketi pasife alıp silinmiş işaretlemek istiyor musunuz?");
    if (!ok) return;

    setErr(null);
    try {
      const res = await fetch(`/api/admin/packages/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: jsonHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Silinemedi");
      router.replace("/admin/packages");
    } catch (e: any) {
      setErr(e?.message || "Hata");
    }
  }

  return (
    <AdminOnly>
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Paket Düzenle</h1>
            <p className="text-xs text-slate-500">id: {id || "-"}</p>
          </div>

          <button
            onClick={() => router.replace("/admin/packages")}
            className="px-3 py-2 rounded bg-slate-950 border border-slate-800 hover:bg-slate-900 text-sm text-slate-100"
          >
            Geri
          </button>
        </div>

        {err && (
          <div className="mb-3 text-sm text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
            {err}
          </div>
        )}

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
          {loading ? (
            <div className="text-sm text-slate-400">Yükleniyor…</div>
          ) : (
            <>
              <div>
                <label className="text-xs text-slate-400">Type</label>
                <select
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                >
                  <option value="JOB">JOB</option>
                  <option value="AD">AD</option>
                  <option value="BOTH">BOTH</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Product Key</label>
                <input
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                  value={form.productKey}
                  onChange={(e) => setForm({ ...form, productKey: e.target.value })}
                  placeholder="Örn: DATA_ACCESS / JOB_POSTING / ADS"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Purchase Type</label>
                  <select
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                    value={form.purchaseType}
                    onChange={(e) => setForm({ ...form, purchaseType: e.target.value as any })}
                  >
                    <option value="one_time">one_time</option>
                    <option value="subscription">subscription</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Billing Cycle (Months)</label>
                  <input
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                    value={form.billingCycleMonths}
                    onChange={(e) => setForm({ ...form, billingCycleMonths: e.target.value })}
                    placeholder="3 / 6 / 12"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Name</label>
                <input
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Code (unique)</label>
                <input
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Country</label>
                <input
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Price</label>
                  <input
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Currency</label>
                  <input
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Credits Job Count</label>
                  <input
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                    value={form.jobCount}
                    onChange={(e) => setForm({ ...form, jobCount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Credits Ad Count</label>
                  <input
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                    value={form.adCount}
                    onChange={(e) => setForm({ ...form, adCount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400">jobPostCount</label>
                  <input
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                    value={form.jobPostCount}
                    onChange={(e) => setForm({ ...form, jobPostCount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">cvViewCount</label>
                  <input
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                    value={form.cvViewCount}
                    onChange={(e) => setForm({ ...form, cvViewCount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">cvSaveCount</label>
                  <input
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                    value={form.cvSaveCount}
                    onChange={(e) => setForm({ ...form, cvSaveCount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Allowed Placements (CSV)</label>
                <input
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                  value={form.allowedPlacementsCsv}
                  onChange={(e) => setForm({ ...form, allowedPlacementsCsv: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Max Duration JSON</label>
                <textarea
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 min-h-[90px]"
                  value={form.maxDurationJson}
                  onChange={(e) => setForm({ ...form, maxDurationJson: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Config JSON</label>
                <textarea
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 min-h-[120px]"
                  value={form.configJson}
                  onChange={(e) => setForm({ ...form, configJson: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">listingDays</label>
                  <input
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                    value={form.listingDays}
                    onChange={(e) => setForm({ ...form, listingDays: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">homeDays</label>
                  <input
                    type="number"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
                    value={form.homeDays}
                    onChange={(e) => setForm({ ...form, homeDays: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-300 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.requiresApproval}
                    onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
                  />
                  Requires Admin Approval
                </label>

                <label className="text-sm text-slate-300 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div>
                <label className="text-xs text-slate-400">Description</label>
                <textarea
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 min-h-[90px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-100 disabled:opacity-60"
                >
                  Kaydet
                </button>
                <button
                  onClick={softDelete}
                  className="px-3 py-2 rounded bg-red-950/40 border border-red-800/60 hover:bg-red-950 text-sm text-red-200"
                >
                  Sil/Pasif
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminOnly>
  );
}
