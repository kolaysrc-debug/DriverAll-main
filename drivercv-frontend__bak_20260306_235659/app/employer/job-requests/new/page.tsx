"use client";

// PATH: DriverAll-main/drivercv-frontend/app/employer/job-requests/new/page.tsx
// ----------------------------------------------------------
// Employer Job Request Create (İlan Talebi Oluştur)
// - GET  /api/jobs/mine                         (auth)
// - GET  /api/orders/mine                        (auth)
// - POST /api/job-requests/from-job/:jobId       (auth)
// Akış: İlan seç → Paket + Placement seç → Talep gönder → Admin onayı → Yayın
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import EmployerOnly from "@/components/EmployerOnly";
import Link from "next/link";

type JobRow = {
  _id: string;
  title?: string;
  status?: string;
  createdAt?: string;
};

type Placement = {
  key: string;
  label?: string;
  maxDays?: number;
  notes?: string;
};

type PackageOrder = {
  _id: string;
  paymentStatus?: string;
  orderStatus?: string;
  expiresAt?: string | null;
  packageSnapshot?: any;
  creditsRemaining?: {
    jobPostCount?: number;
    cvViewCount?: number;
    cvSaveCount?: number;
  };
};

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}
function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function EmployerJobRequestNewPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [orders, setOrders] = useState<PackageOrder[]>([]);

  const [jobId, setJobId] = useState("");
  const [packageOrderId, setPackageOrderId] = useState("");
  const [placementKey, setPlacementKey] = useState("");
  const [requestedDays, setRequestedDays] = useState<number>(7);

  async function loadAll() {
    setLoading(true);
    setErr(null);
    setOkMsg(null);

    try {
      // 1) Employer jobs (auth)
      const rJobs = await fetch("/api/jobs/mine", { headers: authHeaders(), cache: "no-store" });
      const dJobs = await rJobs.json().catch(() => null);
      if (!rJobs.ok) throw new Error(dJobs?.message || "İlanlarım alınamadı.");
      setJobs(Array.isArray(dJobs?.jobs) ? dJobs.jobs : []);

      // 2) My package orders (auth)
      const rOrd = await fetch("/api/orders/mine", { headers: authHeaders(), cache: "no-store" });
      const dOrd = await rOrd.json().catch(() => null);
      if (!rOrd.ok) throw new Error(dOrd?.message || "Paket siparişlerim alınamadı.");
      const list = Array.isArray(dOrd?.orders) ? dOrd.orders : [];
      const activePaid = list.filter(
        (o: any) =>
          String(o?.paymentStatus || "").toLowerCase() === "paid" &&
          String(o?.orderStatus || "").toLowerCase() === "active"
      );
      setOrders(activePaid);

      // defaults
      if (activePaid[0]?._id) setPackageOrderId(activePaid[0]._id);
    } catch (e: any) {
      setErr(e?.message || "Beklenmeyen hata.");
      setJobs([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((o) => o._id === packageOrderId) || null,
    [orders, packageOrderId]
  );

  const selectedOrderRules = useMemo(() => {
    return (selectedOrder as any)?.packageSnapshot?.rules || {};
  }, [selectedOrder]);

  const placementOptions = useMemo<Placement[]>(() => {
    const rulesAny = selectedOrderRules as any;
    const allowed = Array.isArray(rulesAny?.allowedPlacements) ? rulesAny.allowedPlacements : [];
    const maxMap = rulesAny?.maxDurationDaysByPlacement || {};

    const allowedKeys = allowed.map((k: string) => String(k || "").trim()).filter(Boolean);
    const maxKeys = Object.keys(maxMap || {}).map((k) => String(k || "").trim()).filter(Boolean);

    const keys = allowedKeys.length ? allowedKeys : maxKeys.length ? maxKeys : ["standard"];
    return keys.map((k: string) => ({ key: k, label: k }));
  }, [selectedOrderRules]);

  useEffect(() => {
    if (!placementKey && placementOptions[0]?.key) {
      setPlacementKey(placementOptions[0].key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageOrderId, placementOptions.length]);

  const selectedPlacement = useMemo(
    () => placementOptions.find((p: Placement) => p.key === placementKey) || null,
    [placementOptions, placementKey]
  );

  const maxDays = useMemo(() => {
    const maxMap = (selectedOrderRules as any)?.maxDurationDaysByPlacement || {};
    const n = Number(maxMap?.[placementKey] || 0) || 9999;
    return n;
  }, [selectedOrderRules, placementKey]);

  async function submit() {
    setErr(null);
    setOkMsg(null);

    try {
      if (!jobId) throw new Error("İlan seçmelisin (jobId).");
      if (!packageOrderId) throw new Error("Aktif paket siparişi seçmelisin (packageOrderId).");
      if (!placementKey) throw new Error("Placement seçmelisin (placementKey).");

      const days = Math.max(1, Math.min(Number(requestedDays || 0), maxDays));

      const res = await fetch(`/api/job-requests/from-job/${encodeURIComponent(jobId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          packageOrderId,
          placementKey,
          requestedDays: days,
          countryTargets: ["TR"],
          geoLevel: "country",
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Talep gönderilemedi.");

      setOkMsg("Talep oluşturuldu. Admin onayı bekliyor.");
    } catch (e: any) {
      setErr(e?.message || "Beklenmeyen hata.");
    }
  }

  return (
    <EmployerOnly>
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">İlan Talebi Oluştur</h1>
            <div className="text-xs text-slate-400">İlan seç → paket/placement seç → talep gönder</div>
          </div>
          <Link
            href="/employer/dashboard"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 hover:bg-slate-800"
          >
            Dashboard
          </Link>
        </div>

        {(err || okMsg) && (
          <div
            className={
              "mb-4 rounded-lg border px-3 py-2 text-sm " +
              (err
                ? "border-rose-800 bg-rose-950/40 text-rose-200"
                : "border-emerald-800 bg-emerald-950/40 text-emerald-200")
            }
          >
            {err || okMsg}
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          {loading ? (
            <div className="text-sm text-slate-400">Yükleniyor…</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-slate-400">1) İlan seç (jobId)</div>
                <select
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="">— ilan seç —</option>
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>
                      {(j.title || "Başlıksız")} {j.status ? `(${j.status})` : ""}
                    </option>
                  ))}
                </select>

                <div className="mt-2 text-xs text-slate-500">
                  İlan yoksa önce{" "}
                  <Link className="text-sky-300 hover:underline" href="/employer/jobs/new">
                    /employer/jobs/new
                  </Link>{" "}
                  ile ilan oluştur.
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">2) Paket seç</div>
                <select
                  value={packageOrderId}
                  onChange={(e) => {
                    setPackageOrderId(e.target.value);
                    setPlacementKey("");
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="">— aktif paket seç —</option>
                  {orders.map((o) => (
                    <option key={o._id} value={o._id}>
                      {String(o?.packageSnapshot?.name || "Paket")}
                      {typeof o?.creditsRemaining?.jobPostCount === "number"
                        ? ` • ilan hakkı: ${o.creditsRemaining.jobPostCount}`
                        : ""}
                      {o.expiresAt ? ` • bitiş: ${String(o.expiresAt).slice(0, 10)}` : ""}
                    </option>
                  ))}
                </select>

                {orders.length === 0 ? (
                  <div className="mt-2 text-xs text-amber-200 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">
                    Aktif paket görünmüyor. Bu liste sadece <strong>paid + active</strong> durumundaki paket siparişlerini
                    gösterir.
                    <div className="mt-1">
                      <Link className="text-sky-300 hover:underline" href="/packages">
                        /packages
                      </Link>{" "}
                      üzerinden paket seçip sipariş oluşturun; EFT/Havale yaptıysanız
                      <Link className="text-sky-300 hover:underline" href="/orders">
                        {" "}/orders
                      </Link>{" "}
                      sayfasından &ldquo;EFT/Havale Bildir&rdquo; gönderin. Admin onaylayınca burada görünecek.
                    </div>
                  </div>
                ) : null}

                <div className="mt-2 text-xs text-slate-500">
                  {selectedOrder ? (
                    <span>
                      CV görüntüleme: {Number(selectedOrder?.creditsRemaining?.cvViewCount || 0)} • CV kayıt: {Number(selectedOrder?.creditsRemaining?.cvSaveCount || 0)}
                    </span>
                  ) : (
                    <span>Önce aktif bir paket siparişi seç.</span>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">3) Placement seç</div>
                <select
                  value={placementKey}
                  onChange={(e) => setPlacementKey(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  disabled={!packageOrderId}
                >
                  <option value="">— placement seç —</option>
                  {placementOptions.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label || p.key}
                    </option>
                  ))}
                </select>

                {packageOrderId && placementOptions.length === 1 && placementOptions[0]?.key === "standard" ? (
                  <div className="mt-2 text-xs text-amber-200 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">
                    Bu pakette placement tanımı bulunamadı. Varsayılan olarak <strong>standard</strong> kullanılıyor.
                    Admin panelde paket kurallarına <strong>allowedPlacements</strong> veya <strong>maxDurationDaysByPlacement</strong>
                    tanımlarsanız burada seçenekler listelenir.
                  </div>
                ) : null}

                <div className="mt-2 text-xs text-slate-500">
                  Maksimum gün: <span className="text-slate-200 font-semibold">{maxDays}</span>
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">4) Gün</div>
                <input
                  type="number"
                  min={1}
                  max={maxDays}
                  value={requestedDays}
                  onChange={(e) => setRequestedDays(Number(e.target.value || 1))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                />
                <div className="mt-2 text-xs text-slate-500">Seçili placement için max: {maxDays} gün</div>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <Link
                  href="/employer/job-requests"
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
                >
                  Taleplerim
                </Link>
                <button
                  onClick={submit}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Talep Gönder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </EmployerOnly>
  );
}
