"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/job-approvals/page.tsx
// ----------------------------------------------------------
// Admin Job Approvals
// - GET /api/jobs/pending  (draft işler)
// - POST /api/jobs/:id/publish
// - POST /api/jobs/:id/archive
// - DELETE /api/jobs/:id
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchPendingJobs, publishJob, archiveJob, deleteJob } from "@/lib/api/jobs";

type SafeUser = {
  role?: "admin" | "employer" | "advertiser" | "driver" | string;
};

type JobItem = {
  _id: string;
  title?: string;
  country?: string;
  location?: { label?: string; cityCode?: string; countryCode?: string };
  status?: string;
  createdAt?: string;
};

function readUserFromStorage(): SafeUser | null {
  try {
    // Token varsa HER ZAMAN token payload'ını esas al (user kaydı bozuk kalmasın)
    const token = window.localStorage.getItem("token");
    if (token) {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
          atob(b64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(json);

        const userFromToken: any = {
          _id: payload.userId,
          email: payload.email,
          role: payload.role,
        };

        if (userFromToken.role) {
          window.localStorage.setItem("user", JSON.stringify(userFromToken));
          return userFromToken as SafeUser;
        }
      }
    }

    // Token yoksa user'a düş
    const raw = window.localStorage.getItem("user");
    if (!raw) return null;

    const u = JSON.parse(raw);
    if (u?.role) return u as SafeUser;

    return null;
  } catch {
    return null;
  }
}

export default function AdminJobApprovalsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const u = readUserFromStorage();
    if (!u?.role) {
      router.replace("/login");
      return;
    }
    if (u.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
  }, [router]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchPendingJobs();
      setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
    } catch (e: any) {
      setJobs([]);
      setErr(e?.message || "Bekleyen ilanlar alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return jobs;
    return jobs.filter((j) => {
      const t = String(j.title || "").toLowerCase();
      const id = String(j._id || "").toLowerCase();
      return t.includes(s) || id.includes(s);
    });
  }, [jobs, q]);

  async function doPublish(id: string) {
    setBusyId(id);
    setErr(null);
    try {
      await publishJob(id);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Publish başarısız.");
    } finally {
      setBusyId(null);
    }
  }

  async function doArchive(id: string) {
    setBusyId(id);
    setErr(null);
    try {
      await archiveJob(id);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Arşiv başarısız.");
    } finally {
      setBusyId(null);
    }
  }

  async function doDelete(id: string) {
    const ok = window.confirm("Bu ilan silinsin mi? (Geri alınamaz)");
    if (!ok) return;

    setBusyId(id);
    setErr(null);
    try {
      await deleteJob(id);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Silme başarısız.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">İlan Onayları</h1>
            <p className="text-sm text-slate-400">Bekleyen (draft) ilanlar burada listelenir.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              className="px-3 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
              disabled={loading}
            >
              {loading ? "Yükleniyor..." : "Yenile"}
            </button>

            <Link
              href="/admin/dashboard"
              className="px-3 py-2 text-xs rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700"
            >
              Admin Dashboard
            </Link>
          </div>
        </header>

        {err && (
          <div className="text-sm text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
            {err}
          </div>
        )}

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="text-sm text-slate-300">
              Bekleyen ilan sayısı: <span className="text-white font-semibold">{filtered.length}</span>
            </div>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Başlık veya ID ara"
              className="w-full sm:w-72 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none"
            />
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3">
          {filtered.length === 0 && !loading ? (
            <p className="text-slate-500 text-sm">Bekleyen ilan yok.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((j) => {
                const disabled = busyId === j._id;
                return (
                  <div key={j._id} className="bg-slate-950/50 border border-slate-800 rounded-lg p-3">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{j.title || "(Başlık yok)"}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          ID: <span className="text-slate-200">{j._id}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Ülke: <span className="text-slate-200">{j.country || j.location?.countryCode || "-"}</span>
                          {j.location?.label ? ` • ${j.location.label}` : ""}
                        </p>

                        <div className="mt-2 flex items-center gap-3 text-xs">
                          <Link
                            href={`/jobs/${j._id}`}
                            className="text-slate-300 underline decoration-slate-600 hover:text-white"
                          >
                            Public sayfada aç
                          </Link>

                          {/* ✅ DÜZELTİLDİ: sende var olan route yapısı /employer/jobs/new/[id] */}
                          <Link
                            href={`/employer/jobs/new/${j._id}`}
                            className="text-slate-300 underline decoration-slate-600 hover:text-white"
                          >
                            Employer edit sayfası
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => doPublish(j._id)}
                          disabled={disabled}
                          className="text-xs px-3 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {disabled ? "İşleniyor..." : "Publish (Onayla)"}
                        </button>

                        <button
                          type="button"
                          onClick={() => doArchive(j._id)}
                          disabled={disabled}
                          className="text-xs px-3 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Arşivle
                        </button>

                        <button
                          type="button"
                          onClick={() => doDelete(j._id)}
                          disabled={disabled}
                          className="text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
