"use client";

// PATH: DriverAll-main/drivercv-frontend/app/admin/jobs/page.tsx
// ----------------------------------------------------------
// Admin Jobs Approvals Page
// - Admin tüm ilanları görür (GET /api/jobs/mine -> admin ise hepsi gelir)
// - Taslak ilanları "Onayla/Yayınla" ile yayınlar (POST /api/jobs/:id/publish)
// - Yayındaki ilanları "Arşivle" ile kapatır (POST /api/jobs/:id/archive)
// - İlan silme (DELETE /api/jobs/:id)
// ----------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SafeUser = {
  _id?: string;
  role?: "admin" | "employer" | "advertiser" | "driver" | string;
  name?: string;
  email?: string;
};

type JobItem = {
  _id: string;
  title?: string;
  country?: string;
  location?: {
    countryCode?: string;
    cityCode?: string;
    cityName?: string;
    stateName?: string;
  };
  status?: "draft" | "published" | "archived" | string;
  employerUserId?: string;
  createdAt?: string;
  publishedAt?: string | null;
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

function readTokenFromStorage(): string | null {
  try {
    return window.localStorage.getItem("token");
  } catch {
    return null;
  }
}

async function apiFetch(path: string, init?: RequestInit) {
  const token = readTokenFromStorage();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as any),
  };

  // Token varsa ekle (backend requireAuth kullanıyorsa şart)
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    ...init,
    headers,
  });

  // JSON parse güvenli
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `HTTP ${res.status} ${res.statusText || ""}`.trim();
    throw new Error(msg);
  }

  return data;
}

export default function AdminJobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "pending" | "all" | "draft" | "published" | "archived"
  >("pending");

  const [q, setQ] = useState("");
  const [country, setCountry] = useState<string>("ALL");

  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  // --------------------------------------------------
  // Auth gate: admin değilse login / dashboard
  // --------------------------------------------------
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

  async function loadJobs() {
    setLoading(true);
    setErr(null);
    try {
      // Admin ise backend /api/jobs/mine tüm ilanları döndürmeli (sizde böyle kurgulanmıştı)
      const data = await apiFetch("/api/jobs/mine");
      const list = Array.isArray(data?.jobs) ? (data.jobs as JobItem[]) : [];
      setJobs(list);
    } catch (e: any) {
      setJobs([]);
      setErr(e?.message || "İlan listesi alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------
  // Filtreli liste
  // --------------------------------------------------
  const filtered = useMemo(() => {
    let list = [...jobs];

    // status
    if (statusFilter === "pending") {
      list = list.filter((j) => (j.status || "") === "draft");
    } else if (statusFilter !== "all") {
      list = list.filter((j) => (j.status || "") === statusFilter);
    }

    // country
    if (country !== "ALL") {
      list = list.filter(
        (j) => String(j.country || j.location?.countryCode || "").toUpperCase() === country
      );
    }

    // search
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter((j) => {
        const title = String(j.title || "").toLowerCase();
        const id = String(j._id || "").toLowerCase();
        return title.includes(s) || id.includes(s);
      });
    }

    // newest first
    list.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    return list;
  }, [jobs, statusFilter, q, country]);

  // --------------------------------------------------
  // Actions
  // --------------------------------------------------
  async function publishJob(jobId: string) {
    setBusyJobId(jobId);
    setErr(null);
    try {
      await apiFetch(`/api/jobs/${jobId}/publish`, { method: "POST" });
      await loadJobs();
    } catch (e: any) {
      setErr(e?.message || "İlan yayınlanamadı.");
    } finally {
      setBusyJobId(null);
    }
  }

  async function archiveJob(jobId: string) {
    setBusyJobId(jobId);
    setErr(null);
    try {
      await apiFetch(`/api/jobs/${jobId}/archive`, { method: "POST" });
      await loadJobs();
    } catch (e: any) {
      setErr(e?.message || "İlan arşivlenemedi.");
    } finally {
      setBusyJobId(null);
    }
  }

  async function deleteJob(jobId: string) {
    const ok = window.confirm("Bu ilan silinsin mi? (Geri alınamaz)");
    if (!ok) return;

    setBusyJobId(jobId);
    setErr(null);
    try {
      await apiFetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      await loadJobs();
    } catch (e: any) {
      setErr(e?.message || "İlan silinemedi.");
    } finally {
      setBusyJobId(null);
    }
  }

  // --------------------------------------------------
  // UI helpers
  // --------------------------------------------------
  function badgeClass(status?: string) {
    if (status === "draft") return "bg-amber-900/30 border-amber-700 text-amber-200";
    if (status === "published") return "bg-emerald-900/30 border-emerald-700 text-emerald-200";
    if (status === "archived") return "bg-slate-900/30 border-slate-700 text-slate-200";
    return "bg-slate-900/30 border-slate-700 text-slate-200";
  }

  const counts = useMemo(() => {
    const c = { draft: 0, published: 0, archived: 0, all: jobs.length };
    for (const j of jobs) {
      if (j.status === "draft") c.draft++;
      else if (j.status === "published") c.published++;
      else if (j.status === "archived") c.archived++;
    }
    return c;
  }, [jobs]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">İlan Onay / Yönetim</h1>
            <p className="text-sm text-slate-400">
              Bu ekran <strong>admin</strong> içindir: taslak ilanları inceler, yayınlar, arşivler veya siler.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadJobs}
              className="px-3 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
              disabled={loading}
            >
              {loading ? "Yükleniyor..." : "Yenile"}
            </button>

            {/* İsterseniz ileride admin detay sayfası yaparız. Şimdilik placeholder link */}
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

        {/* Filters */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 text-xs rounded-full border ${
                  statusFilter === "pending"
                    ? "bg-sky-700/60 border-sky-400 text-sky-50"
                    : "bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                Onay Bekleyen ({counts.draft})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-xs rounded-full border ${
                  statusFilter === "all"
                    ? "bg-sky-700/60 border-sky-400 text-sky-50"
                    : "bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                Tümü ({counts.all})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("published")}
                className={`px-3 py-1.5 text-xs rounded-full border ${
                  statusFilter === "published"
                    ? "bg-sky-700/60 border-sky-400 text-sky-50"
                    : "bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                Yayında ({counts.published})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("archived")}
                className={`px-3 py-1.5 text-xs rounded-full border ${
                  statusFilter === "archived"
                    ? "bg-sky-700/60 border-sky-400 text-sky-50"
                    : "bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                Arşiv ({counts.archived})
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none"
              >
                <option value="ALL">Tüm Ülkeler</option>
                <option value="TR">TR</option>
                <option value="DE">DE</option>
                <option value="NL">NL</option>
                <option value="FI">FI</option>
                <option value="NO">NO</option>
                <option value="ES">ES</option>
                <option value="IT">IT</option>
                <option value="HU">HU</option>
              </select>

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Başlık veya ID ara"
                className="w-full sm:w-64 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">
              İlanlar {loading ? "(yükleniyor...)" : `(${filtered.length})`}
            </h2>
          </div>

          {!loading && filtered.length === 0 ? (
            <p className="text-slate-500 text-sm">Sonuç bulunamadı.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((j) => {
                const st = String(j.status || "draft");
                const disabled = busyJobId === j._id;

                return (
                  <div
                    key={j._id}
                    className="bg-slate-950/50 border border-slate-800 rounded-lg p-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold truncate">
                            {j.title || "(Başlık yok)"}
                          </p>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded border ${badgeClass(
                              st
                            )}`}
                          >
                            {st}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mt-1">
                          ID: <span className="text-slate-300">{j._id}</span>
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          Ülke:{" "}
                          <span className="text-slate-200">
                            {j.country || j.location?.countryCode || "-"}
                          </span>
                          {"  "}
                          {j.location?.cityName
                            ? `• Şehir: ${j.location.cityName}`
                            : j.location?.cityCode
                            ? `• Şehir Kodu: ${j.location.cityCode}`
                            : ""}
                        </p>

                        {j.createdAt && (
                          <p className="text-xs text-slate-500 mt-1">
                            Oluşturma: {new Date(j.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Taslak -> yayınla */}
                        {st === "draft" && (
                          <button
                            type="button"
                            onClick={() => publishJob(j._id)}
                            disabled={disabled}
                            className="text-xs px-3 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {disabled ? "İşleniyor..." : "Onayla / Yayınla"}
                          </button>
                        )}

                        {/* Yayında -> arşivle */}
                        {st === "published" && (
                          <button
                            type="button"
                            onClick={() => archiveJob(j._id)}
                            disabled={disabled}
                            className="text-xs px-3 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {disabled ? "İşleniyor..." : "Arşivle"}
                          </button>
                        )}

                        {/* Her durumda sil */}
                        <button
                          type="button"
                          onClick={() => deleteJob(j._id)}
                          disabled={disabled}
                          className="text-xs px-3 py-2 rounded-lg bg-rose-600/80 border border-rose-500 text-rose-50 hover:bg-rose-600 disabled:opacity-60 disabled:cursor-not-allowed"
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

        <div className="text-xs text-slate-500">
          Not: İlan oluşturma ekranı admin panelinde olmamalı; işveren (employer) tarafında ayrı bir sayfada olmalı.
          İsterseniz bir sonraki adımda “Employer İlan Oluşturma” sayfasını netleştirip TopBar menüsünü ona göre düzenleriz.
        </div>
      </div>
    </div>
  );
}
