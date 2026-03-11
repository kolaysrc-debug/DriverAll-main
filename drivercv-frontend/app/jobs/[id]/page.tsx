// PATH: DriverAll-main/drivercv-frontend/app/jobs/[id]/page.tsx
// ----------------------------------------------------------
// Public Job Detail Page — kariyer.net esinlenmeli
// + Driver logged in ise başvuru alanı
// + Mobil alt nav (driver ise)
// ----------------------------------------------------------

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchPublicJobById } from "@/lib/api/publicJobs";
import { applyToJob } from "@/lib/api/applications";

type JobOwner =
  | string
  | {
      _id?: string;
      name?: string;
      email?: string;
    };

type Job = {
  _id: string;
  title?: string;
  description?: string;
  status?: string;
  country?: string;
  location?: {
    countryCode?: string;
    cityCode?: string;
    cityName?: string;
    stateName?: string;
    label?: string;
  };
  criteria?: Record<string, any>;
  createdAt?: string;
  publishedAt?: string | null;
  employerUserId?: JobOwner | null;
};

type StoredUser = { role?: string; email?: string; name?: string };

function readUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("token");
  } catch {
    return null;
  }
}

function getOwnerLabel(owner?: JobOwner | null) {
  if (!owner) return "-";
  if (typeof owner === "string") return owner;
  const name = String(owner.name || "").trim();
  const email = String(owner.email || "").trim();
  if (name && email) return `${name} (${email})`;
  if (name) return name;
  if (email) return email;
  if (owner._id) return String(owner._id);
  return "-";
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = String((params as any)?.id || "");

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // apply UI
  const [note, setNote] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  const user = useMemo(() => readUser(), []);
  const token = useMemo(() => readToken(), []);

  const isDriver = Boolean(token) && String(user?.role || "") === "driver";

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      setJob(null);

      if (!id) {
        setErr("İlan ID bulunamadı.");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchPublicJobById(id);
        if (!alive) return;
        setJob(data?.job || null);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "İlan alınamadı.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  async function onApply() {
    if (!id) return;
    setApplyLoading(true);
    setApplyMsg(null);
    setApplySuccess(false);

    try {
      const data = await applyToJob(id, { note });
      if (data?.alreadyApplied) {
        setApplyMsg(data?.message || "Bu ilana zaten başvurmuşsunuz.");
      } else {
        setApplyMsg("Başvurunuz alındı! Başvurularım ekranından takip edebilirsiniz.");
        setApplySuccess(true);
        setNote("");
      }
    } catch (e: any) {
      setApplyMsg(e?.message || "Başvuru gönderilemedi.");
    } finally {
      setApplyLoading(false);
    }
  }

  const locationLabel =
    job?.location?.label ||
    job?.location?.cityName ||
    [job?.country || job?.location?.countryCode].filter(Boolean).join("") ||
    "-";

  const criteriaKeys = useMemo(() => {
    if (!job?.criteria) return [];
    return Object.entries(job.criteria)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k)
      .slice(0, 50);
  }, [job?.criteria]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 md:pb-6">
      <div className="mx-auto max-w-4xl px-4 py-5 md:px-8 space-y-4">

        {/* Breadcrumb / Nav */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
            >
              ← Geri
            </button>
            <Link
              href="/jobs"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Tüm İlanlar
            </Link>
          </div>

          {isDriver && (
            <Link
              href="/driver/applications"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Başvurularım
            </Link>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-12 justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
            İlan yükleniyor…
          </div>
        )}

        {/* Error */}
        {!loading && err && (
          <div className="rounded-2xl border border-red-800/50 bg-red-950/30 p-5 text-center">
            <div className="text-red-300 text-sm">{err}</div>
            <p className="mt-2 text-xs text-slate-500">
              Bu ilan taslak/arşiv olabilir veya yayından kaldırılmış olabilir.
            </p>
            <Link
              href="/jobs"
              className="mt-3 inline-block rounded-lg bg-sky-600 px-4 py-2 text-xs font-medium text-white hover:bg-sky-500 transition-colors"
            >
              İlanlara Dön
            </Link>
          </div>
        )}

        {/* Not found */}
        {!loading && !err && !job && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
            <div className="text-slate-400 text-sm">İlan bulunamadı.</div>
          </div>
        )}

        {/* Job Content */}
        {!loading && !err && job && (
          <div className="space-y-4">

            {/* Ana Kart — İlan Detayı */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-5 border-b border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-50 leading-tight">
                      {job.title || "(Başlıksız)"}
                    </h1>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                      {/* Konum */}
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {locationLabel}
                      </span>

                      {/* Firma */}
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {getOwnerLabel(job.employerUserId)}
                      </span>

                      {/* Tarih */}
                      <span className="flex items-center gap-1.5 text-xs">
                        <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(job.publishedAt || job.createdAt)}
                      </span>
                    </div>
                  </div>

                  {job.status && (
                    <span className={`flex-shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold ${
                      job.status === "published"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-slate-700/50 text-slate-300 border-slate-600"
                    }`}>
                      {job.status === "published" ? "Yayında" : job.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Açıklama */}
                {job.description ? (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Açıklama</div>
                    <div className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                      {job.description}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic">Açıklama eklenmemiş.</div>
                )}

                {/* Kriterler */}
                {criteriaKeys.length > 0 && (
                  <div className="pt-3 border-t border-slate-800">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Aranan Kriterler</div>
                    <div className="flex flex-wrap gap-2">
                      {criteriaKeys.map((k) => (
                        <span
                          key={k}
                          className="rounded-full border border-sky-600/30 bg-sky-500/10 px-3 py-1 text-xs text-sky-300"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Başvuru Kartı */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Başvuru</div>

              {!token ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-center">
                  <div className="text-slate-400 text-sm">Başvurmak için giriş yapmalısınız.</div>
                  <button
                    onClick={() => router.push("/login")}
                    className="mt-3 inline-block rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
                  >
                    Giriş Yap
                  </button>
                </div>
              ) : String(user?.role || "") !== "driver" ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-center text-sm text-slate-400">
                  Başvuru sadece sürücü hesabı ile yapılabilir.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Bu ilana dair kısa bir not bırakabilirsiniz (ihtiyaç, beklenti, uygunluk vb.).
                  </p>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    disabled={applySuccess}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-sky-600/50 focus:ring-1 focus:ring-sky-600/30 transition-colors disabled:opacity-50"
                    placeholder="Örn: Uzun yol deneyimim var, ADR Tank mevcut, 2 hafta/1 hafta rota uygundur..."
                  />

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={onApply}
                      disabled={applyLoading || applySuccess}
                      className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60 transition-colors"
                    >
                      {applyLoading ? "Gönderiliyor..." : applySuccess ? "Başvuruldu ✓" : "Başvur"}
                    </button>

                    {applyMsg && (
                      <div className={`text-sm ${applySuccess ? "text-emerald-300" : "text-amber-300"}`}>
                        {applyMsg}
                      </div>
                    )}
                  </div>

                  {applySuccess && (
                    <Link
                      href="/driver/applications"
                      className="inline-block text-xs text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      Başvurularımı Gör →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MOBİL ALT NAVİGASYON (driver ise) */}
      {isDriver && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <Link href="/driver/dashboard" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Panel</Link>
              <Link href="/jobs" className="rounded-xl border border-sky-600/40 bg-sky-950/30 px-2 py-2 text-center text-[11px] font-medium text-sky-300">İlanlar</Link>
              <Link href="/driver/applications" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">Başvurular</Link>
              <Link href="/cv" className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-[11px] text-slate-200 hover:bg-slate-900/50 transition-colors">CV</Link>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
