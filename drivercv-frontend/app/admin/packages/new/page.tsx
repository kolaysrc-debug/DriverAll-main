"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/packages/new/page.tsx

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AdminOnly from "@/components/AdminOnly";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}

function jsonHeaders(): HeadersInit {
  const t = getToken();
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

export default function AdminPackageNewPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    type: "JOB",
    name: "",
    code: "",
    description: "",
    country: "ALL",
    currency: "TRY",
    price: 0,
    jobCount: 1,
    adCount: 0,
    requiresApproval: true,
    allowedPlacementsCsv: "HOME_BAR_1,HOME_BAR_2",
    maxDurationJson: '{"HOME_BAR_1":3,"HOME_BAR_2":5}',
    active: true,
  });

  async function submit() {
    try {
      let maxDuration: any = {};
      try {
        maxDuration = JSON.parse(form.maxDurationJson || "{}");
      } catch {
        alert("MaxDuration JSON hatalı. Örn: {\"HOME_BAR_1\":3}");
        return;
      }

      const res = await fetch("/api/admin/packages", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          type: form.type,
          name: form.name,
          code: form.code,
          description: form.description,
          country: form.country,
          currency: form.currency,
          price: Number(form.price || 0),
          credits: { jobCount: Number(form.jobCount || 0), adCount: Number(form.adCount || 0) },
          rules: {
            requiresApproval: form.requiresApproval !== false,
            allowedPlacements: String(form.allowedPlacementsCsv || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            maxDurationDaysByPlacement: maxDuration,
          },
          active: form.active,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Paket oluşturulamadı");

      router.replace("/admin/packages");
    } catch (e: any) {
      alert(e?.message || "Hata");
    }
  }

  return (
    <AdminOnly>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-semibold text-slate-100 mb-1">Yeni Paket</h1>
        <p className="text-sm text-slate-400 mb-4">Paket motoru (ilan/reklam) tanımı.</p>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400">Type</label>
            <select
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="JOB">JOB</option>
              <option value="AD">AD</option>
              <option value="BOTH">BOTH</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400">Name</label>
            <input
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Örn: Basic Job Package"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Code (unique)</label>
            <input
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Örn: JOB_BASIC_TR"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Country</label>
            <input
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="ALL / TR / DE ..."
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
            <div className="text-[11px] text-slate-500 mt-1">
              Örn: {"{ \"HOME_BAR_1\": 3, \"HOME_BAR_2\": 5 }"}
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
            <button onClick={submit} className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm">
              Kaydet
            </button>
            <button
              onClick={() => router.replace("/admin/packages")}
              className="px-3 py-2 rounded bg-slate-950 border border-slate-800 hover:bg-slate-900 text-sm"
            >
              Vazgeç
            </button>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
