"use client";

// PATH: drivercv-frontend/app/advertiser/dashboard/page.tsx
// BUILD_MARK: DA-ADS-DASH-2026-01-13

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdvertiserOnly from "@/components/AdvertiserOnly";
import { fetchMyAdRequests } from "@/lib/api/ads";

type ReqItem = {
  _id: string;
  title?: string;
  packageName?: string;
  placementKey?: string;
  requestedDays?: number;
  status?: "pending" | "approved" | "rejected" | string;
  createdAt?: string;
};

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="text-lg font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function ActionCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900"
    >
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <div className="mt-1 text-xs text-slate-400">{desc}</div>
      <div className="mt-3 text-[11px] text-sky-400">Aç →</div>
    </Link>
  );
}

export default function AdvertiserDashboardPage() {
  const [list, setList] = useState<ReqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchMyAdRequests();
      const arr = Array.isArray(data?.list) ? (data.list as ReqItem[]) : [];
      setList(arr);
    } catch (e: any) {
      setErr(e?.message || "Reklam talepleri alınamadı");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const pending = list.filter((x) => x.status === "pending").length;
    const approved = list.filter((x) => x.status === "approved").length;
    const rejected = list.filter((x) => x.status === "rejected").length;
    return { pending, approved, rejected, total: list.length };
  }, [list]);

  const last5 = useMemo(() => list.slice(0, 5), [list]);

  return (
    <AdvertiserOnly>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="mb-4">
          <div className="text-xl font-bold text-slate-100">
            Reklam ve Sponsor Paneli
          </div>
          <div className="mt-1 text-sm text-slate-400">
            Reklam taleplerini oluşturun, takip edin; admin onayından sonra yayın akışına girer.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ActionCard
            href="/advertiser/ads/new"
            title="Yeni Reklam Talebi"
            desc="Paket ve yerleşim seçerek yeni bir reklam talebi oluşturun."
          />
          <ActionCard
            href="/advertiser/requests"
            title="Taleplerim"
            desc="Tüm reklam taleplerinizi ve durumlarını (pending/approved/rejected) görün."
          />
          <ActionCard
            href="/employer/dashboard"
            title="İşveren Paneline Dön"
            desc="İlanlar ve ilan talepleri tarafına geri dön."
          />
        </div>

        <div className="mt-6">
          <div className="mb-2 text-sm font-semibold text-slate-200">Özet</div>

          {err && (
            <div className="mb-3 rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
              {err}
            </div>
          )}

          {loading ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
              Yükleniyor…
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatPill label="Toplam" value={stats.total} />
              <StatPill label="Beklemede" value={stats.pending} />
              <StatPill label="Onaylandı" value={stats.approved} />
              <StatPill label="Reddedildi" value={stats.rejected} />
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 text-sm font-semibold text-slate-200">
            Son Talepler
          </div>

          {loading ? null : last5.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
              Henüz reklam talebiniz yok. “Yeni Reklam Talebi” ile başlayın.
            </div>
          ) : (
            <div className="space-y-3">
              {last5.map((x) => (
                <div
                  key={x._id}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-100">
                      {x.title || x.packageName || "Reklam"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {String(x.status || "pending")}
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 text-xs text-slate-400 md:grid-cols-3">
                    <div>Placement: {x.placementKey || "-"}</div>
                    <div>Gün: {x.requestedDays ?? "-"}</div>
                    <div>
                      Tarih:{" "}
                      {x.createdAt ? new Date(x.createdAt).toLocaleString() : "-"}
                    </div>
                  </div>
                </div>
              ))}
              <div>
                <Link
                  href="/advertiser/ads"
                  className="text-sm text-sky-400 hover:underline"
                >
                  Tüm talepleri görüntüle →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdvertiserOnly>
  );
}
